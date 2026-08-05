import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const MODELS_URL =
  process.env.NEXT_PUBLIC_FACE_MODELS_URL ||
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

const DETECTION_ATTEMPTS = 4;
const DETECTION_INTERVAL = 300;

let loaded = false;
let loadingPromise = null;

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

async function loadNetworkModels(onProgress) {
  await waitForFaceAPI();
  const nets = [
    window.faceapi.nets.tinyFaceDetector,
    window.faceapi.nets.faceLandmark68Net,
    window.faceapi.nets.faceRecognitionNet,
  ];
  const total = nets.length;
  let done = 0;
  await Promise.all(
    nets.map((net) =>
      net.loadFromUri(MODELS_URL).then(() => {
        done += 1;
        onProgress?.(done, total);
      })
    )
  );
}

export async function loadModels({ onProgress } = {}) {
  if (loaded) return;
  if (loadingPromise) {
    await loadingPromise;
    return;
  }
  loadingPromise = loadNetworkModels(onProgress).then(() => {
    loaded = true;
  });
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

export async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

export async function detectFace(video) {
  const options = new window.faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });

  let lastError = null;
  for (let i = 0; i < DETECTION_ATTEMPTS; i += 1) {
    if (i > 0) await sleep(DETECTION_INTERVAL);
    try {
      const detection = await window.faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) return detection;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error('No face detected. Ensure good lighting.');
}

export async function saveEnrollment(userId, descriptor) {
  await setDoc(doc(db, 'face_descriptors', userId), {
    descriptor,
    createdAt: new Date().toISOString(),
  });
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

    const storedDescriptor = new Float32Array(snap.data().descriptor);
    const detections = await detectFace(video);

    const distance = window.faceapi.euclideanDistance(
      detections.descriptor,
      storedDescriptor
    );

    if (distance > 0.6) {
      throw new Error('Face does not match. Distance: ' + distance.toFixed(2));
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
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
