'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireRole } from '@/lib/useRequireRole';
import { getActiveSessions, getStudentAttendanceIds } from '@/lib/firestore';
import { getCurrentPosition, getDistance } from '@/lib/geo';
import { friendlyError } from '@/lib/errors';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import styles from './page.module.css';

export default function LecturesPage() {
  const { user, userData, ready } = useRequireRole('student');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentPos, setStudentPos] = useState(null);
  const [markedIds, setMarkedIds] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, user, userData?.level, userData?.department]);

  async function load() {
    const geoPromise = getCurrentPosition({ allowCache: true })
      .then((pos) => setStudentPos(pos))
      .catch(() => {});
    try {
      const [data, marked] = await Promise.all([
        getActiveSessions(),
        getStudentAttendanceIds(user.uid),
      ]);
      setMarkedIds(marked);
      setSessions(filterSessions(data));
    } catch (err) {
      setError(friendlyError(err, 'Could not load lectures. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
    await geoPromise;
  }

  function filterSessions(list) {
    const { level, department } = userData || {};
    return list.filter((s) => {
      if (s.level && s.level !== level) return false;
      if (s.department && s.department !== department) return false;
      return true;
    });
  }

  function distanceTo(session) {
    if (!studentPos || !session.location) return null;
    return getDistance(
      studentPos.lat,
      studentPos.lng,
      session.location.lat,
      session.location.lng
    );
  }

  if (!ready || loading) return <Loading text="Loading lectures..." />;

  return (
    <div className="container">
      <div className={styles.header}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Live Lectures
        </h1>
        <Link href="/dashboard/student" className="btn-primary">
          Dashboard
        </Link>
      </div>

      {!userData?.level || !userData?.department ? (
        <div className="card animate-rise">
          <p style={{ color: 'var(--ink-2)' }}>
            Set your level and department to see lectures specific to you.
          </p>
          <Link
            href="/dashboard/student"
            className="btn-primary"
            style={{ marginTop: 12 }}
          >
            Complete My Profile
          </Link>
        </div>
      ) : (
        <p className={styles.filterNote}>
          Showing live lectures for{' '}
          <b>
            {userData.level} Level · {userData.department}
          </b>
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {sessions.length === 0 ? (
        <div className="card animate-rise">
          <p style={{ color: 'var(--ink-2)' }}>
            No live lectures for you right now. Check back soon!
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map((s, i) => {
            const dist = distanceTo(s);
            const marked = markedIds.has(s.id);
            return (
              <Link
                key={s.id}
                href={`/dashboard/student/session/${s.id}`}
                className={styles.sessionCard}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div>
                  <strong>{s.title}</strong>
                  <span className={styles.course}>
                    {s.course}
                  </span>
                  {(s.level || s.department) && (
                    <span className={styles.tag}>
                      {[s.level && `${s.level} Level`, s.department]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                  {s.locationNote && (
                    <span className={styles.locationNote}>
                      <Icon
                        name="pin"
                        size={13}
                        style={{ verticalAlign: '-2px', marginRight: 5 }}
                      />
                      {s.locationNote}
                    </span>
                  )}
                </div>
                <div className={styles.meta}>
                  {marked ? (
                    <span className={styles.marked}>
                      <Icon name="check" size={12} strokeWidth={2.5} />
                      Marked
                    </span>
                  ) : (
                    <span className={styles.liveDot}>Live</span>
                  )}
                  <span
                    className={
                      dist !== null
                        ? styles.distance
                        : styles.distanceUnavailable
                    }
                  >
                    {dist !== null
                      ? studentPos?.accuracy > 80
                        ? `About ${Math.round(dist)}m (imprecise)`
                        : `${Math.round(dist)}m away`
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
