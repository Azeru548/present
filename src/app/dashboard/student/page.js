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
    <div className="container">
      <div className="card animate-rise">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontSize: '1.8rem',
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))',
              }}
              aria-hidden="true"
            >
              {enrolled ? '✅' : '🙋'}
            </span>
            <div>
              <h2 className="subtitle" style={{ marginBottom: 2 }}>
                Face Enrollment
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
                {enrolled
                  ? 'Your face is enrolled. You can update it anytime.'
                  : 'Your face is not enrolled yet. Enroll now to mark attendance.'}
              </p>
            </div>
          </div>
          <button
            className={enrolled ? 'btn-primary' : 'btn-success'}
            onClick={() => setShowEnroll((v) => !v)}
          >
            {enrolled ? 'Update Face' : 'Enroll Face'}
          </button>
        </div>
        {showEnroll && (
          <div style={{ marginTop: 20 }} className="animate-pop">
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

      <h1 className="page-title" style={{ marginTop: 8 }}>
        Live Sessions
      </h1>
      {sessions.length === 0 ? (
        <div className="card animate-rise">
          <p style={{ color: 'var(--ink-2)' }}>
            No active sessions right now. Check back soon!
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map((s, i) => {
            const dist = distanceTo(s);
            return (
              <Link
                key={s.id}
                href={`/dashboard/student/session/${s.id}`}
                className={styles.sessionCard}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div>
                  <strong>{s.title}</strong>
                  <span className={styles.course}>{s.course}</span>
                </div>
                <div className={styles.meta}>
                  <span className={styles.liveDot}>Live</span>
                  <span
                    className={
                      dist !== null ? styles.distance : styles.distanceUnavailable
                    }
                  >
                    {dist !== null
                      ? `${Math.round(dist)}m away`
                      : 'Location unavailable'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}