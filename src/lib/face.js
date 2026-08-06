import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const MODELS_URL =
  process.env.NEXT_PUBLIC_FACE_MODELS_URL || '/weights';

// ssdMobilenetv1 is far more accurate than tinyFaceDetector. It auto-falls
// back to tinyFaceDetector if the SSD weights fail to load, and on very slow
// connections we prefer tiny up-front since its weights are ~20x smaller.
function defaultDetector() {
  const conn =
    typeof navigator !== 'undefined' ? navigator.connection : null;
  if (conn && /(slow-2g|2g)/.test(conn.effectiveType || '')) {
    return 'tinyFaceDetector';
  }
  return 'ssdMobilenetv1';
}
const DETECTOR = process.env.NEXT_PUBLIC_FACE_DETECTOR || defaultDetector();
const MATCH_THRESHOLD = Number(process.env.NEXT_PUBLIC_FACE_THRESHOLD) || 0.6;
const BURST_FRAMES = Number(process.env.NEXT_PUBLIC_FACE_BURST_FRAMES) || 9;
const FRAME_INTERVAL = 150;

const DETECTION_ATTEMPTS = 4;
const DETECTION_INTERVAL = 300;

// A face must be at least this wide (px, at ~640x480) and detected with at
// least this confidence before we trust its descriptor.
const MIN_FACE_SIZE = 90;
const MIN_CONFIDENCE = 0.4;

let loaded = false;
let loadingPromise = null;
let activeDetector = DETECTOR;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForFaceAPI(timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.faceapi) {
      resolve();
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.faceapi) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeout) {
        clearInterval(timer);
        reject(new Error('Face recognition library failed to load.'));
      }
    }, 100);
  });
}

function resolveDetector() {
  if (activeDetector === 'tinyFaceDetector') {
    return {
      net: window.faceapi.nets.tinyFaceDetector,
      options: new window.faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.35,
      }),
    };
  }
  return {
    net: window.faceapi.nets.ssdMobilenetv1,
    options: new window.faceapi.SsdMobilenetv1Options({
      minConfidence: 0.4,
    }),
  };
}

function requiredNets() {
  return [
    resolveDetector().net,
    window.faceapi.nets.faceLandmark68Net,
    window.faceapi.nets.faceRecognitionNet,
  ];
}

function allNetsLoaded() {
  if (typeof window === 'undefined' || !window.faceapi) return false;
  return requiredNets().every((net) => net.isLoaded);
}

async function loadNetworkModels(onProgress) {
  await waitForFaceAPI();
  const nets = requiredNets();
  const total = nets.length;
  let done = 0;
  // allSettled waits for EVERY net to finish (success or failure) before we
  // decide what to do next, so a fallback retry can never race a net that is
  // still loading (which used to leave the recognition net unloaded).
  const results = await Promise.allSettled(
    nets.map((net) =>
      net.loadFromUri(MODELS_URL).then(() => {
        done += 1;
        onProgress?.(done, total);
      })
    )
  );
  const failure = results.find((r) => r.status === 'rejected');
  if (failure) {
    throw failure.reason || new Error('Failed to load face models.');
  }
}

export async function loadModels({ onProgress } = {}) {
  if (loaded && allNetsLoaded()) return;
  if (loadingPromise) {
    await loadingPromise;
    return;
  }
  loadingPromise = (async () => {
    let lastErr = null;
    const maxAttempts = activeDetector === 'tinyFaceDetector' ? 1 : 2;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await loadNetworkModels(onProgress);
        if (!allNetsLoaded()) {
          throw new Error('Face models did not finish loading.');
        }
        loaded = true;
        return;
      } catch (err) {
        lastErr = err;
        if (activeDetector !== 'tinyFaceDetector') {
          activeDetector = 'tinyFaceDetector';
        }
      }
    }
    loaded = false;
    throw lastErr;
  })();
  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

async function waitForVideoReady(video, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.currentTime > 0) {
      return true;
    }
    await sleep(50);
  }
  return false;
}

async function getStream() {
  return navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user',
    },
  });
}

export async function startCamera(videoEl) {
  const stream = await getStream();
  videoEl.srcObject = stream;
  await new Promise((resolve) => {
    if (videoEl.readyState >= 1) {
      resolve();
    } else {
      videoEl.onloadedmetadata = resolve;
    }
  });
  await videoEl.play();
  await waitForVideoReady(videoEl);
  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

function isGoodFrame(detection) {
  if (!detection) return false;
  return detection.score >= MIN_CONFIDENCE && detection.box.width >= MIN_FACE_SIZE;
}

async function detectSingle(video) {
  if (!allNetsLoaded()) {
    await loadModels();
  }
  if (!allNetsLoaded()) {
    throw new Error('Face models are still loading. Please try again in a moment.');
  }
  const detector = resolveDetector();
  return window.faceapi
    .detectSingleFace(video, detector.options)
    .withFaceLandmarks()
    .withFaceDescriptor();
}

export async function detectFace(video, { attempts = DETECTION_ATTEMPTS, interval = DETECTION_INTERVAL } = {}) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    if (i > 0) await sleep(interval);
    try {
      const detection = await detectSingle(video);
      if (isGoodFrame(detection)) return detection;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError?.message ? lastError : new Error('No face detected. Ensure good lighting.');
}

/**
 * Captures a burst of frames and averages the best-scoring half into a single
 * high-quality descriptor. Averaging many frames cancels out noise (motion
 * blur, exposure flicker) that makes single-frame matching unreliable.
 */
export async function captureDescriptor(video, { samples = BURST_FRAMES } = {}) {
  const frames = [];
  let hadAny = false;
  let lastError = null;
  for (let i = 0; i < samples; i += 1) {
    if (i > 0) await sleep(FRAME_INTERVAL);
    try {
      const detection = await detectSingle(video);
      if (detection) hadAny = true;
      if (isGoodFrame(detection)) frames.push(detection);
    } catch (err) {
      lastError = err;
    }
  }

  if (frames.length === 0) {
    if (hadAny) {
      throw new Error(
        'Face detected but too small or blurry. Move closer to the camera and keep still.'
      );
    }
    throw lastError?.message
      ? lastError
      : new Error('No face detected. Ensure good lighting and keep your face in the oval.');
  }

  const ranked = [...frames].sort((a, b) => b.score - a.score);
  const keep = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 2)));
  const descriptor = averageDescriptors(keep.map((d) => d.descriptor));
  return { descriptor, detection: ranked[0] };
}

export function averageDescriptors(descriptors) {
  if (!descriptors.length) return null;
  const len = descriptors[0].length;
  const sum = new Float32Array(len);
  for (const d of descriptors) {
    for (let i = 0; i < len; i += 1) sum[i] += d[i];
  }
  for (let i = 0; i < len; i += 1) sum[i] /= descriptors.length;
  return sum;
}

export async function saveEnrollment(userId, descriptors) {
  const list = Array.isArray(descriptors[0])
    ? descriptors
    : [descriptors];
  const payload = {
    descriptors: list.map((d) => Array.from(d)),
    descriptor: Array.from(list[0]),
    detector: activeDetector,
    updatedAt: new Date().toISOString(),
  };

  const ref = doc(db, 'face_descriptors', userId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...payload, createdAt: new Date().toISOString() });
  }
  await updateDoc(doc(db, 'users', userId), { faceEnrolled: true });
}

export async function authenticateFace(userId, videoEl) {
  await loadModels();
  const { video, stream } = await getVideo(videoEl);

  try {
    const snap = await getDoc(doc(db, 'face_descriptors', userId));
    if (!snap.exists()) {
      throw new Error('No enrolled face found. Please re-register.');
    }

    const data = snap.data();
    const stored = data.descriptors || (data.descriptor ? [data.descriptor] : null);
    if (!stored || stored.length === 0) {
      throw new Error('No enrolled face found. Please re-register.');
    }
    const storedDescs = stored.map((d) => new Float32Array(d));

    const { descriptor } = await captureDescriptor(video, { samples: BURST_FRAMES });

    let bestDistance = Infinity;
    for (const s of storedDescs) {
      const d = window.faceapi.euclideanDistance(descriptor, s);
      if (d < bestDistance) bestDistance = d;
    }

    if (bestDistance > MATCH_THRESHOLD) {
      throw new Error('Face does not match. Distance: ' + bestDistance.toFixed(2));
    }
  } finally {
    stopVideo(video);
  }
}

async function getVideo(videoEl) {
  let video = videoEl;
  if (!video) {
    video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.width = 640;
    video.height = 480;
  }
  const stream = await getStream();
  video.srcObject = stream;
  await new Promise((resolve) => {
    if (video.readyState >= 1) {
      resolve();
    } else {
      video.onloadedmetadata = resolve;
    }
  });
  await video.play();
  await waitForVideoReady(video);
  return { video, stream };
}

function stopVideo(video) {
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
  }
}
