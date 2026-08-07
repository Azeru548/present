/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        // face-api and MediaPipe use dynamic `require`/WASM loaders that webpack
        // cannot statically analyse. Both are only ever imported lazily on the
        // client (see src/lib/face.js), so the warnings are safe to ignore.
        module: /node_modules\/(@vladmandic\/face-api|@mediapipe\/tasks-vision)/,
      },
    ];
    return config;
  },
  async headers() {
    return [
      {
        source: '/weights/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/vendor/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
export default nextConfig;
