'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getLecturerSessions, closeSession } from '@/lib/firestore';
import AttendanceTable from '@/components/AttendanceTable';
import Loading from '@/components/Loading';
import styles from './page.module.css';

export default function LecturerDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== 'lecturer') {
      router.push('/login/lecturer');
      return;
    }
    loadSessions();
  }, [user, role, authLoading]);

  async function loadSessions() {
    setLoading(true);
    const data = await getLecturerSessions(user.uid);
    setSessions(data);
    setLoading(false);
  }

  async function handleClose(sessionId) {
    await closeSession(sessionId);
    loadSessions();
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
      setAttendance([]);
    }
  }

  async function viewAttendance(session) {
    setSelectedSession(session);
    setAttLoading(true);
    const { getSessionAttendance } = await import('@/lib/firestore');
    const records = await getSessionAttendance(session.id);
    setAttendance(records);
    setAttLoading(false);
  }

  if (authLoading || loading) return <Loading />;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.header} animate-rise`}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Lecturer Dashboard
        </h1>
        <Link href="/dashboard/lecturer/create-session" className="btn-primary">
          + Create Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card animate-rise">
          <p className={styles.muted}>No sessions yet. Create your first one!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <div className="card animate-rise" style={{ flex: 1 }}>
            <h2 className="subtitle">Your Sessions</h2>
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className={`${styles.sessionCard} ${selectedSession?.id === s.id ? styles.active : ''}`}
                style={{ animationDelay: `${i * 70}ms` }}
                onClick={() => viewAttendance(s)}
              >
                <div>
                  <strong>{s.title}</strong>
                  <span className={styles.course}>{s.course}</span>
                </div>
                <span className={s.isActive ? styles.badgeActive : styles.badgeClosed}>
                  {s.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
            ))}
          </div>

          <div className="card animate-rise" style={{ flex: 2 }}>
            <h2 className="subtitle">
              {selectedSession
                ? `Attendance — ${selectedSession.title}`
                : 'Select a session'}
            </h2>

            {selectedSession && selectedSession.isActive && (
              <button
                className="btn-danger"
                style={{ marginBottom: 12 }}
                onClick={() => handleClose(selectedSession.id)}
              >
                Close Attendance Window
              </button>
            )}

            {selectedSession ? (
              <AttendanceTable records={attendance} loading={attLoading} />
            ) : (
              <p className={styles.muted}>Click a session to view attendance.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}