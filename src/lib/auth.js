import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

export async function registerWithRole(email, password, name, role, extra = {}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    faceEnrolled: false,
    ...extra,
  });
  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle(role) {
  const cred = await signInWithPopup(auth, googleProvider);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: cred.user.displayName || 'User',
      email: cred.user.email,
      role,
      createdAt: new Date().toISOString(),
      faceEnrolled: false,
    });
  }
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data().role;
}

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Signup writes the Auth user first, then the Firestore profile. The auth
// listener can fire in that gap — retry so we don't treat a new account as
// having no role (which used to bounce login <-> dashboard forever).
export async function getUserDataWithRetry(uid, { attempts = 10, delayMs = 200 } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await getUserData(uid);
    if (last?.role) return last;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return last;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}
