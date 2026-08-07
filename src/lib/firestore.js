import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const SESSIONS = 'sessions';
const ATTENDANCE = 'attendance';
const USERS = 'users';

export async function createSession(data) {
  return addDoc(collection(db, SESSIONS), {
    ...data,
    lecturerId: data.lecturerId,
    isActive: true,
    createdAt: serverTimestamp(),
  });
}

export async function updateSession(sessionId, data) {
  return updateDoc(doc(db, SESSIONS, sessionId), data);
}

export async function closeSession(sessionId) {
  return updateDoc(doc(db, SESSIONS, sessionId), {
    isActive: false,
    closedAt: serverTimestamp(),
  });
}

export async function getSession(sessionId) {
  const snap = await getDoc(doc(db, SESSIONS, sessionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getActiveSessions() {
  const q = query(
    collection(db, SESSIONS),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllSessions() {
  const q = query(collection(db, SESSIONS), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLecturerSessions(lecturerId) {
  const q = query(
    collection(db, SESSIONS),
    where('lecturerId', '==', lecturerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markAttendance(sessionId, studentId, geoVerified, faceVerified) {
  const attendanceId = `${sessionId}_${studentId}`;
  return setDoc(doc(db, ATTENDANCE, attendanceId), {
    sessionId,
    studentId,
    geoVerified,
    faceVerified,
    timestamp: serverTimestamp(),
  });
}

export async function hasMarkedAttendance(sessionId, studentId) {
  const snap = await getDoc(doc(db, ATTENDANCE, `${sessionId}_${studentId}`));
  return snap.exists();
}

export async function getStudentAttendanceIds(studentId) {
  const q = query(
    collection(db, ATTENDANCE),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().sessionId));
}

export async function getSessionAttendance(sessionId) {
  const q = query(
    collection(db, ATTENDANCE),
    where('sessionId', '==', sessionId)
  );
  const snap = await getDocs(q);
  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const enriched = await Promise.all(
    records.map(async (r) => {
      const user = await getDoc(doc(db, USERS, r.studentId));
      return {
        ...r,
        studentName: user.exists() ? user.data().name : 'Unknown',
        studentEmail: user.exists() ? user.data().email : '',
      };
    })
  );
  return enriched;
}
