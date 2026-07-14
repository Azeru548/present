# Present — Attendance System

Geo-location verified attendance with facial recognition, built with Next.js and Firebase.

## Features

- **Lecturer dashboard** — create lecture sessions, close attendance windows, view organized attendance tables
- **Student flow** — browse live sessions, verify location within class radius, facial identity verification
- **Two-factor check** — geolocation proximity check + in-browser facial recognition before marking attendance
- **Anti-spoofing** — no QR codes or shareable links; each student can only mark once per session
- **Google sign-in** or email/password authentication

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) (browser-based facial recognition)

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
├── components/    Navbar, AttendanceTable
├── context/       AuthContext (Firebase auth state)
└── lib/           Firebase config, auth helpers, Firestore API, geo utils, face verification
```
