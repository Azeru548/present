'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getActiveSessions } from '@/lib/firestore';
import { getCurrentPosition, getDistance } from '@/lib/geo';
import Loading from '@/components/Loading';
import FaceEnrollment from '@/components/FaceEnrollment';
import styles from './page.module.css';

export default function StudentDashboard() {
  const { user, role, userData, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentPos, setStudentPos] = useState(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrolled, setEnrolled] = useState(userData?.faceEnrolled === true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== 'student') {
      router.push('/login/student');
      return;
    }
    init();
  }, [user, role, authLoading]);

  async function init() {
    try {
      const pos = await getCurrentPosition();
      setStudentPos(pos);
    } catch {
      // location denied — still show sessions
    }
    const data = await getActiveSessions();
    setSessions(data);
    setLoading(false);
  }

  function distanceTo(session) {
    if (!studentPos || !session.location) return null;
    return getDistance(
      studentPos.lat, studentPos.lng,
      session.location.lat, session.location.lng
    );
  }

  if (authLoading || loading) return <Loading text="Loading sessions..." />;

  return (
    <div>
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 className="subtitle">Face Enrollment</h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              {enrolled
                ? 'Your face is enrolled. You can update it anytime.'
                : 'Your face is not enrolled yet. Enroll now to mark attendance.'}
            </p>
          </div>
          <button
            className={enrolled ? 'btn-primary' : 'btn-success'}
            onClick={() => setShowEnroll((v) => !v)}
          >
            {enrolled ? 'Update Face' : 'Enroll Face'}
          </button>
        </div>
        {showEnroll && (
          <div style={{ marginTop: 16 }}>
            <FaceEnrollment
              userId={user.uid}
              onComplete={() => {
                setEnrolled(true);
                setShowEnroll(false);
              }}
              onCancel={() => setShowEnroll(false)}
            />
          </div>
        )}
      </div>

      <h1 className="page-title">Live Sessions</h1>
      {sessions.length === 0 ? (
        <div className="card">
          <p style={{ color: '#888' }}>No active sessions right now.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map((s) => {
            const dist = distanceTo(s);
            return (
              <Link
                key={s.id}
                href={`/dashboard/student/session/${s.id}`}
                className={styles.sessionCard}
              >
                <div>
                  <strong>{s.title}</strong>
                  <span className={styles.course}>{s.course}</span>
                </div>
                <span className={styles.distance}>
                  {dist !== null
                    ? `${Math.round(dist)}m away`
                    : 'Location unavailable'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
