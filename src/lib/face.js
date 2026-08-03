import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
let loaded = false;

export async function loadModels() {
  if (loaded) return;
  if (typeof window === 'undefined' || !window.faceapi) {
    throw new Error(
      'face-api.js not loaded. Ensure the script is included in layout.'
    );
  }
  await Promise.all([
    window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
    window.faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
    window.faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
  ]);
  loaded = true;
}

export async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl.srcObject = stream;
  await new Promise((r) => (videoEl.onloadedmetadata = r));
  await videoEl.play();
  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

export async function detectFace(video) {
  const detections = await window.faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detections) throw new Error('No face detected. Ensure good lighting.');
  return detections;
}

export async function saveEnrollment(userId, descriptor) {
  await setDoc(doc(db, 'face_descriptors', userId), {
    descriptor,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(doc(db, 'users', userId), { faceEnrolled: true });
}

export async function authenticateFace(userId) {
  await loadModels();
  const { video, stream } = await getVideo();

  try {
    const snap = await getDoc(doc(db, 'face_descriptors', userId));
    if (!snap.exists()) {
      throw new Error('No enrolled face found. Please re-register.');
    }

    const storedDescriptor = new Float32Array(snap.data().descriptor);
    const detections = await window.faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) throw new Error('No face detected. Ensure good lighting.');

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

async function getVideo() {
  const video = document.createElement('video');
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.width = 640;
  video.height = 480;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise((r) => (video.onloadedmetadata = r));
  video.play();
  return { video, stream };
}

function stopVideo(video) {
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
  }
}
