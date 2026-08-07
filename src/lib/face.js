import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Detection now comes from MediaPipe FaceLandmarker (free, on-device), which
// is far more reliable on small/low-resolution webcams (e.g. VMs at 320x240)
// than face-api's ssd detector. face-api is kept ONLY as the embedding engine
// (faceLandmark68Net + faceRecognitionNet) so the 128-d descriptor space — and
// therefore every stored enrollment — stays compatible.
const MODELS_URL = process.env.NEXT_PUBLIC_FACE_MODELS_URL || '/weights';
const LANDMARKER_MODEL_URL =
  process.env.NEXT_PUBLIC_FACE_LANDMARKER_MODEL_URL ||
  '/vendor/face_landmarker.task';
const LANDMARKER_WASM_URL =
  process.env.NEXT_PUBLIC_FACE_LANDMARKER_WASM_URL || '/vendor/wasm';

const MATCH_THRESHOLD = Number(process.env.NEXT_PUBLIC_FACE_THRESHOLD) || 0.6;
const BURST_FRAMES = Number(process.env.NEXT_PUBLIC_FACE_BURST_FRAMES) || 8;
const FRAME_INTERVAL = 160;

const DETECTION_ATTEMPTS = 4;
const DETECTION_INTERVAL = 300;

// MediaPipe reliably locates small/low-res faces, so this is a sanity floor,
// not a quality gate — SAME policy as before: size ranks frames, never blocks.
const MIN_FACE_WIDTH = 16; // px, in the camera frame
const MIN_SHARPNESS = 15; // Laplacian variance of the grayscale face crop

let faceapi = null; // lazy-loaded face-api embedding nets
let landmarker = null; // MediaPipe FaceLandmarker
let landmarkerPromise = null;
let loadingPromise = null;
let loaded = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Flaky connections (e.g. dev machines, weak WiFi) make Firestore reads fail
// intermittently with "client is offline". Retry a few times before giving up.
async function getDocWithRetry(ref, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await getDoc(ref);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(700 * (i + 1));
    }
  }
  throw lastErr;
}

// ---- face-api embedder (lazily loaded, client only) -------------------------

async function ensureFaceAPI() {
  if (faceapi) return faceapi;
  if (typeof window === 'undefined') {
    throw new Error('Face recognition is only available in the browser.');
  }
  faceapi = await import('@vladmandic/face-api');
  return faceapi;
}

async function embedderNets() {
  const fa = await ensureFaceAPI();
  return [fa.nets.faceLandmark68Net, fa.nets.faceRecognitionNet];
}

async function allNetsLoaded() {
  if (typeof window === 'undefined' || !faceapi) return false;
  const nets = await embedderNets();
  return nets.every((net) => net.isLoaded);
}

// ---- MediaPipe FaceLandmarker (detection) -----------------------------------

let lastLandmarkTs = 0;
let detectionWarned = 0;

// MediaPipe's WASM/TFLite runtime logs routine messages (e.g. "INFO: Created
// TensorFlow Lite XNNPACK delegate for CPU.") through the console, which
// Next.js surfaces as a red error overlay. These are benign. We install this
// filter permanently at module load — BEFORE MediaPipe is ever imported — so
// its logger captures our filtered console.error and the noise never reaches
// the dev overlay. Real errors still pass through to the original.
function installMediaPipeLogFilter() {
  if (typeof window === 'undefined' || window.__faceLogFilterInstalled) return;
  window.__faceLogFilterInstalled = true;
  const original = console.error;
  const isBenign = (msg) =>
    /^(INFO|DEBUG|WARNING):/i.test(msg) ||
    (/TensorFlow Lite|XNNPACK|delegate/i.test(msg) &&
      /created|init|delegate|simd|wasm|mediapipe/i.test(msg));
  console.error = (...args) => {
    if (args.some((a) => isBenign(String(a)))) return;
    original.apply(console, args);
  };
}
installMediaPipeLogFilter();

export async function modelsReady() {
  return (await allNetsLoaded()) && !!landmarker;
}

async function ensureLandmarker() {
  if (landmarker) return landmarker;
  if (typeof window === 'undefined') {
    throw new Error('Face recognition is only available in the browser.');
  }
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const vision = await import('@mediapipe/tasks-vision');
    const wasm = await vision.FilesetResolver.forVisionTasks(LANDMARKER_WASM_URL);
    const base = { modelAssetPath: LANDMARKER_MODEL_URL };
    const options = (delegate) => ({
      baseOptions: { ...base, delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    // GPU delegate is the default, but it can fail on machines without usable
    // WebGL (common in VMs), so fall back to CPU.
    try {
      landmarker = await vision.FaceLandmarker.createFromOptions(wasm, options('GPU'));
    } catch {
      landmarker = await vision.FaceLandmarker.createFromOptions(wasm, options('CPU'));
    }
    return landmarker;
  })();
  return landmarkerPromise;
}

function isVideoReady(video) {
  return (
    !!video &&
    video.readyState >= 2 &&
    video.videoWidth > 0 &&
    video.videoHeight > 0 &&
    video.currentTime > 0
  );
}

// Detect a single face via MediaPipe. Returns a plain pixel-space rect
// { x, y, width, height, imageWidth, imageHeight } or null.
async function detectFaceRect(video) {
  const lm = await ensureLandmarker();
  // MediaPipe's face landmarker graph throws "ROI width and height must be > 0"
  // (and logs it via console.error on every call) when handed a frame with no
  // dimensions — e.g. the video element is still warming up. Bail before it
  // ever sees a blank frame; the caller treats null as "no face yet".
  if (!isVideoReady(video)) return null;
  // detectForVideo demands strictly increasing timestamps per landmarker; two
  // calls within the same millisecond would throw, so bump the last one.
  const ts = Math.max(performance.now(), lastLandmarkTs + 1);
  lastLandmarkTs = ts;
  let result;
  try {
    result = lm.detectForVideo(video, ts);
  } catch (err) {
    // Report once (console.warn, not error, so it never triggers the dev
    // overlay) — if this ever happens repeatedly it means MediaPipe can't
    // run inference on this device and the fallback path needs attention.
    if (detectionWarned < 3) {
      detectionWarned += 1;
      // eslint-disable-next-line no-console
      console.warn('face.js: MediaPipe detectForVideo failed:', err?.message || err);
    }
    return null;
  }
  const pts = result?.faceLandmarks?.[0];
  if (!pts || pts.length === 0) return null;
  const w = video.videoWidth || 1;
  const h = video.videoHeight || 1;
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of pts) {
    // NOTE: do NOT gate on `visibility` — the JS build reports 0 for every
    // face landmark, which would drop all points and read as "no face".
    // Only ignore genuinely invalid coordinates.
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (maxX <= minX || maxY <= minY) {
    // One-time warn: landmarks came back but produced a degenerate box.
    if (detectionWarned < 3) {
      detectionWarned += 1;
      // eslint-disable-next-line no-console
      console.warn(`face.js: degenerate face box (${pts.length} landmarks).`);
    }
    return null;
  }
  return {
    x: minX * w,
    y: minY * h,
    width: (maxX - minX) * w,
    height: (maxY - minY) * h,
    imageWidth: w,
    imageHeight: h,
  };
}

// ---- Embedding (face-api net, aligned the same way as before) ---------------

function padRect(box, pad) {
  const padX = box.width * pad;
  const padY = box.height * pad;
  const x = Math.max(0, box.x - padX);
  const y = Math.max(0, box.y - padY);
  const width = Math.min(box.imageWidth - x, box.width + padX * 2);
  const height = Math.min(box.imageHeight - y, box.height + padY * 2);
  return { x, y, width, height };
}

function asFloat32Array(d) {
  if (!d) return null;
  let vec = d;
  if (Array.isArray(d) && d.length && ArrayBuffer.isView(d[0])) vec = d[0];
  if (!ArrayBuffer.isView(vec)) vec = new Float32Array(Array.isArray(vec) ? vec : [vec]);
  return new Float32Array(vec);
}

async function computeDescriptor(video, box) {
  const fa = await ensureFaceAPI();
  const cropRect = padRect(box, 0.5);
  // extractFaces needs a Rect/FaceDetection instance (it calls
  // clipAtImageBorders), so wrap the plain rect.
  const crops = await fa.extractFaces(video, [
    new fa.Rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height),
  ]);
  const crop = crops && crops[0];
  if (!crop) return null;
  // Align using face-api's 68-point landmarks (same net as original enrollment)
  // so the descriptor space is unchanged and stored vectors still match.
  try {
    const landmarks = await fa.nets.faceLandmark68Net.detectLandmarks(crop);
    if (landmarks && landmarks.alignedRect) {
      const aligned = await fa.extractFaces(crop, [landmarks.alignedRect]);
      if (aligned && aligned[0]) {
        return asFloat32Array(
          await fa.nets.faceRecognitionNet.computeFaceDescriptor(aligned[0])
        );
      }
    }
  } catch {
    // fall through to the unaligned path below
  }
  return asFloat32Array(
    await fa.nets.faceRecognitionNet.computeFaceDescriptor(crop)
  );
}

async function detectOne(video) {
  const box = await detectFaceRect(video);
  if (!box) return null;
  const descriptor = await computeDescriptor(video, box);
  if (!descriptor) return null;
  return { box, descriptor, score: 1 };
}

function isGoodFrame(detection) {
  if (!detection || !detection.box || !detection.descriptor) return false;
  return detection.box.width >= MIN_FACE_WIDTH;
}

// ---- Model loading ---------------------------------------------------------

async function fetchJson(fa, url) {
  const res = await fa.tf.util.fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status}).`);
  return res.json();
}

async function fileSizeOf(fa, url) {
  try {
    const res = await fa.tf.util.fetch(url, { method: 'HEAD' });
    const size = Number(res.headers.get('content-length'));
    return Number.isFinite(size) && size > 0 ? size : 0;
  } catch {
    return 0;
  }
}

async function downloadToArrayBuffer(fa, url, onIncrement) {
  const res = await fa.tf.util.fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} (${res.status}).`);
  if (!res.body) {
    const buf = await res.arrayBuffer();
    onIncrement?.(buf.byteLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
    onIncrement?.(value.length);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out.buffer;
}

async function loadNetWithProgress(fa, net, onProgress) {
  const modelName = net.getDefaultModelName();
  const manifestUrl = `${MODELS_URL}/${modelName}-weights_manifest.json`;
  const manifest = await fetchJson(fa, manifestUrl);
  const shardPaths = [...new Set(manifest.flatMap((g) => g.paths || []))];
  const shards = shardPaths.map((path) => ({ path, url: `${MODELS_URL}/${path}` }));
  const sizes = await Promise.all(shards.map((s) => fileSizeOf(fa, s.url)));
  const totalBytes = sizes.reduce((a, b) => a + b, 0);

  let doneBytes = 0;
  let doneFiles = 0;
  const report = () => {
    const bytesPct = totalBytes > 0 ? (doneBytes / totalBytes) * 100 : 0;
    const filesPct = shards.length > 0 ? (doneFiles / shards.length) * 100 : 0;
    onProgress(Math.round(Math.max(bytesPct, filesPct)));
  };

  const buffers = new Map();
  for (const s of shards) {
    const buf = await downloadToArrayBuffer(fa, s.url, (n) => {
      doneBytes += n;
      report();
    });
    buffers.set(s.path.split('/').pop(), buf);
    doneFiles += 1;
    report();
  }

  const loader = fa.tf.io.weightsLoaderFactory((urls) =>
    Promise.all(
      urls.map(async (url) => {
        const name = String(url).split('/').pop();
        const buf = buffers.get(name);
        if (!buf) throw new Error(`Missing pre-downloaded weights for ${name}.`);
        return buf;
      })
    )
  );
  const weightMap = await loader(manifest, MODELS_URL);
  net.loadFromWeightMap(weightMap);
}

async function loadNetworkModels(onProgress) {
  const fa = await ensureFaceAPI();
  const nets = await embedderNets();
  const totalNets = nets.length;
  let lastPct = 0;
  for (let i = 0; i < totalNets; i += 1) {
    const net = nets[i];
    const startPct = lastPct;
    const weight = 100 / totalNets;
    await loadNetWithProgress(fa, net, (netPct) => {
      lastPct = startPct + (netPct / 100) * weight;
      onProgress(Math.min(99, Math.round(lastPct)));
    });
    lastPct = ((i + 1) / totalNets) * 100;
    onProgress(Math.round(lastPct));
  }
}

const progressListeners = new Set();

function notifyProgress(percent) {
  for (const cb of progressListeners) {
    try {
      cb(percent);
    } catch {
      // A broken listener must not abort model loading.
    }
  }
}

export async function loadModels({ onProgress } = {}) {
  if (onProgress) progressListeners.add(onProgress);
  try {
    if (loaded && (await allNetsLoaded()) && landmarker) {
      notifyProgress(100);
      return;
    }
    if (loadingPromise) {
      await loadingPromise;
      return;
    }
    loadingPromise = (async () => {
      try {
        // Phase 1: MediaPipe detector (wasm + model download).
        notifyProgress(2);
        await ensureLandmarker();
        notifyProgress(20);
        // Phase 2: face-api embedding nets, streamed with real progress.
        await loadNetworkModels((pct) => notifyProgress(20 + Math.round((pct / 100) * 78)));
        if (!(await allNetsLoaded())) {
          throw new Error('Face models did not finish loading.');
        }
        loaded = true;
        notifyProgress(100);
      } catch (err) {
        loaded = false;
        throw err;
      }
    })();
    try {
      await loadingPromise;
    } finally {
      loadingPromise = null;
    }
  } finally {
    if (onProgress) progressListeners.delete(onProgress);
  }
}

// ---- Camera helpers --------------------------------------------------------

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
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
  });
}

export async function startCamera(videoEl) {
  const stream = await getStream();
  videoEl.srcObject = stream;
  await new Promise((resolve) => {
    if (videoEl.readyState >= 1) resolve();
    else videoEl.onloadedmetadata = resolve;
  });
  await videoEl.play();
  await waitForVideoReady(videoEl);
  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

async function getVideo(videoEl) {
  let video = videoEl;
  if (!video) {
    video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.width = 1280;
    video.height = 720;
  }
  const stream = await getStream();
  video.srcObject = stream;
  await new Promise((resolve) => {
    if (video.readyState >= 1) resolve();
    else video.onloadedmetadata = resolve;
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

// ---- Quality metrics -------------------------------------------------------

export function faceSharpness(video, box) {
  const { x, y, width, height } = box;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const maxDim = 128;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, Math.round(x), Math.round(y), w, h, 0, 0, cw, ch);
  const img = ctx.getImageData(0, 0, cw, ch);
  return laplacianVariance(img.data, cw, ch);
}

function laplacianVariance(data, w, h) {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i += 1) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      sum += lap;
      sumSq += lap * lap;
      n += 1;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

// ---- Exported detection / capture APIs -------------------------------------

export async function probeFrame(video) {
  if (typeof window === 'undefined') return { status: 'error', message: 'Unavailable on server.' };
  try {
    if (!(await modelsReady())) return { status: 'loading' };
    const box = await detectFaceRect(video);
    if (!box) return { status: 'no-face' };
    const frameWidth = video.videoWidth || 0;
    const frameHeight = video.videoHeight || 0;
    const boxWidth = box.width;
    if (boxWidth < MIN_FACE_WIDTH) {
      return {
        status: 'too-small',
        boxWidth,
        minWidth: MIN_FACE_WIDTH,
        frameWidth,
        frameHeight,
      };
    }
    const sharpness = faceSharpness(video, box);
    if (sharpness < MIN_SHARPNESS) {
      return { status: 'blurry', sharpness, boxWidth, frameWidth, frameHeight };
    }
    return {
      status: 'good',
      score: 1,
      sharpness,
      boxWidth,
      frameWidth,
      frameHeight,
    };
  } catch (err) {
    return { status: 'error', message: err?.message || 'Unknown error.' };
  }
}

export async function captureDescriptor(video, { samples = BURST_FRAMES } = {}) {
  const frames = [];
  let lastError = null;
  for (let i = 0; i < samples; i += 1) {
    if (i > 0) await sleep(FRAME_INTERVAL);
    try {
      const detection = await detectOne(video);
      if (detection) {
        frames.push({
          detection,
          descriptor: detection.descriptor,
          sharpness: faceSharpness(video, detection.box),
          good: isGoodFrame(detection),
        });
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Face size ranks frames; it never blocks capture, per the design intent.
  let usable = frames.filter((f) => f.good);
  if (usable.length === 0) usable = frames;
  if (usable.length === 0) {
    throw lastError?.message
      ? lastError
      : new Error('No face detected. Ensure good lighting and keep your face in the oval.');
  }

  const ranked = [...usable].sort(
    (a, b) =>
      b.sharpness - a.sharpness || b.detection.box.width - a.detection.box.width
  );
  const sharpFrames = ranked.filter((f) => f.sharpness >= MIN_SHARPNESS);
  if (ranked.length >= 4 && sharpFrames.length === 0) {
    throw new Error(
      'Face detected but blurry. Hold still and make sure the lighting is good.'
    );
  }
  const pool = sharpFrames.length > 0 ? sharpFrames : ranked;
  const keep = pool.slice(0, Math.max(1, Math.ceil(pool.length / 2)));
  const descriptor = averageDescriptors(keep.map((f) => f.descriptor));
  return {
    descriptor,
    detection: ranked[0].detection,
    sharpness: ranked[0].sharpness,
    frameCount: frames.length,
  };
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

export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export async function drawDetections(canvas, detection) {
  const ctx = canvas.getContext('2d');
  const box = detection?.box;
  if (!ctx || !box) return;
  canvas.width = box.imageWidth || 0;
  canvas.height = box.imageHeight || 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
}

// ---- Persistence -----------------------------------------------------------

function normalizeDescriptors(descriptors) {
  if (!Array.isArray(descriptors)) return [descriptors];
  if (descriptors.length === 0) return [descriptors];
  const first = descriptors[0];
  if (Array.isArray(first) || ArrayBuffer.isView(first)) return descriptors;
  return [descriptors];
}

export async function saveEnrollment(userId, descriptors) {
  const list = normalizeDescriptors(descriptors).map((d) => Array.from(d));
  // Firestore forbids arrays nested inside arrays, so store the set of
  // descriptors as a map keyed by index ({ "0": [...], "1": [...] }). Each
  // individual descriptor is a plain (flat) array, which Firestore allows.
  const descriptorsMap = {};
  list.forEach((d, i) => {
    descriptorsMap[i] = Array.from(d);
  });
  const payload = {
    descriptors: descriptorsMap,
    descriptor: Array.from(list[0]),
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
    const snap = await getDocWithRetry(doc(db, 'face_descriptors', userId));
    if (!snap.exists()) {
      throw new Error('No enrolled face found. Please re-register.');
    }
    const data = snap.data();
    let stored = null;
    const ds = data.descriptors;
    if (ds && !Array.isArray(ds)) {
      // New format: descriptors stored as a map keyed by index.
      stored = Object.values(ds).filter((d) => d);
    } else if (Array.isArray(ds)) {
      // Legacy format: descriptors as an array of arrays.
      stored = ds;
    }
    if (!stored || stored.length === 0) {
      stored = data.descriptor ? [data.descriptor] : null;
    }
    if (!stored || stored.length === 0) {
      throw new Error('No enrolled face found. Please re-register.');
    }
    const storedDescs = stored.map((d) => new Float32Array(d));

    const { descriptor } = await captureDescriptor(video, { samples: BURST_FRAMES });

    let bestDistance = Infinity;
    for (const s of storedDescs) {
      const d = euclideanDistance(descriptor, s);
      if (d < bestDistance) bestDistance = d;
    }

    if (bestDistance > MATCH_THRESHOLD) {
      throw new Error('Face does not match. Distance: ' + bestDistance.toFixed(2));
    }
    return { distance: bestDistance };
  } finally {
    stopVideo(video);
  }
}