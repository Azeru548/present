# Present — Attendance System

Geo-location verified attendance with on-device facial recognition, built with Next.js and Firebase.

## Features

- **Lecturer dashboard** — create lecture sessions, close attendance windows, view organized attendance tables with each student's name and verification status
- **Student flow** — browse live sessions, verify location within class radius, facial identity verification
- **Two-factor check** — geolocation proximity check + in-browser facial recognition before marking attendance
- **On-device verification** — faces never leave the browser; the captured frame is matched against the student's enrolled descriptor stored in Firestore
- **Anti-spoofing** — no QR codes or shareable links; each student can only mark once per session
- **Google sign-in** or email/password authentication

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router, webpack)
- [Firebase](https://firebase.google.com/) (Auth, Firestore)
- [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (face detection)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) (face embedding/recognition)

All model and WASM files are served locally from `public/` — no third-party CDN or runtime API keys.

## How Face Verification Works

1. **Enrollment** — the student's face is captured in a burst, aligned, and a 128-d embedding is computed with face-api's `faceRecognitionNet` (MediaPipe only handles detection). Descriptors are stored per user in Firestore.
2. **Verification** — at attendance time the live face is detected with the MediaPipe FaceLandmarker, aligned, embedded, and compared (Euclidean distance) against the student's stored descriptors. Below `NEXT_PUBLIC_FACE_THRESHOLD` (default `0.6`) the match succeeds.

The embedding space is unchanged from earlier versions, so existing enrollments stay valid across library upgrades.

## Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.local` and fill in your Firebase project credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Optional face-tuning variables (defaults shown):

```
NEXT_PUBLIC_FACE_MODELS_URL=/weights
NEXT_PUBLIC_FACE_LANDMARKER_MODEL_URL=/vendor/face_landmarker.task
NEXT_PUBLIC_FACE_LANDMARKER_WASM_URL=/vendor/wasm
NEXT_PUBLIC_FACE_THRESHOLD=0.6
NEXT_PUBLIC_FACE_BURST_FRAMES=8
```

If the app matches strangers too eagerly, lower `NEXT_PUBLIC_FACE_THRESHOLD`; if it rejects the same person, raise it.

### Firebase Setup

1. Enable **Authentication** → Email/Password + Google providers
2. Create a **Firestore Database** and apply the rules in `firestore.rules`

## Project Structure

```
src/
├── app/           Next.js App Router pages
│   ├── dashboard/ Lecturer and student dashboards
│   ├── login/     Role-based login pages
│   └── register/  Role-based registration
├── components/    Navbar, FaceEnrollment, AttendanceTable
├── context/       AuthContext (Firebase auth state)
└── lib/           Firebase config, auth helpers, Firestore API, geo utils, face verification
public/
├── vendor/        MediaPipe WASM runtime + face_landmarker.task model
└── weights/       face-api embedding weights (face_landmark_68_model, face_recognition_model)
```

## Deploying

Push to GitHub, then connect the repo to [Netlify](https://netlify.com):

- **Build command:** `npm run build` (next build)
- **Publish directory:** `.next`
- Set the same `NEXT_PUBLIC_*` environment variables as `.env.local` in the Netlify dashboard.

Model and WASM files (~15–20 MB) are self-hosted in `public/`, so they're served from Netlify's CDN; face detection runs on each user's device, so there is no server-side GPU or API cost. The first visit downloads the models, which are then cached by the browser.
