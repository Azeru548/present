const CACHE = 'present-v1';

const PRECACHE_URLS = [
  '/vendor/face_landmarker.task',
  '/vendor/wasm/vision_wasm_internal.js',
  '/vendor/wasm/vision_wasm_internal.wasm',
  '/weights/face_landmark_68_model-weights_manifest.json',
  '/weights/face_landmark_68_model-shard1',
  '/weights/face_recognition_model-weights_manifest.json',
  '/weights/face_recognition_model-shard1',
  '/weights/face_recognition_model-shard2',
  '/logopresent.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isModelAsset =
    url.pathname.startsWith('/vendor/') ||
    url.pathname.startsWith('/weights/') ||
    /\.(wasm|task|bin|png|svg|ico|webmanifest)$/.test(url.pathname);

  if (isModelAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
    );
  }
});
