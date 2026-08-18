'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireRole } from '@/lib/useRequireRole';
import { getAllSessions, getStudentAttendanceIds } from '@/lib/firestore';
import { friendlyError } from '@/lib/errors';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import styles from './page.module.css';

function sessionStatus(session, marked) {
  if (marked) return 'present';
  const ended =
    session.isActive === false ||
    (session.endTime && new Date(session.endTime).getTime() < Date.now());
  return ended ? 'missed' : 'ongoing';
}

function sessionDate(session) {
  if (session.endTime) {
    return new Date(session.endTime).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  const created = session.createdAt?.toDate?.();
  return created ? created.toLocaleDateString() : 'N/A';
}

const STATUS = {
  present: { label: 'Present', className: styles.present },
  missed: { label: 'Missed', className: styles.missed },
  ongoing: { label: 'Ongoing', className: styles.ongoing },
};

export default function StudentAttendanceHistory() {
  const { user, userData, ready } = useRequireRole('student');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, user, userData?.level, userData?.department]);

  async function load() {
    try {
      const [all, marked] = await Promise.all([
        getAllSessions(),
        getStudentAttendanceIds(user.uid),
      ]);
      const { level, department } = userData || {};
      const filtered = all.filter((s) => {
        if (s.level && s.level !== level) return false;
        if (s.department && s.department !== department) return false;
        return true;
      });
      setSessions(filtered.map((s) => ({ ...s, status: sessionStatus(s, marked.has(s.id)) })));
    } catch (err) {
      setError(friendlyError(err, 'Could not load your attendance history. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || loading) return <Loading text="Loading history..." />;

  const counts = sessions.reduce(
    (acc, s) => {
      acc[s.status] += 1;
      return acc;
    },
    { present: 0, missed: 0, ongoing: 0 }
  );
  const present = counts.present;
  const attended = sessions.filter((s) => s.status !== 'ongoing').length;

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            My Attendance
          </h1>
          <p className={styles.filterNote}>
            {userData?.level && userData?.department
              ? `${userData.level} Level · ${userData.department}`
              : 'Complete your profile to see your sessions.'}
          </p>
        </div>
        <Link href="/dashboard/student" className="btn-primary">
          Dashboard
        </Link>
      </div>

      <div className={styles.stats}>
        <div className={`${styles.stat} animate-rise`}>
          <span className={styles.statValue}>{present}</span>
          <span className={styles.statLabel}>Present</span>
        </div>
        <div className={`${styles.stat} animate-rise`} style={{ animationDelay: '60ms' }}>
          <span className={styles.statValue}>{counts.missed}</span>
          <span className={styles.statLabel}>Missed</span>
        </div>
        <div className={`${styles.stat} animate-rise`} style={{ animationDelay: '120ms' }}>
          <span className={styles.statValue}>{counts.ongoing}</span>
          <span className={styles.statLabel}>Ongoing</span>
        </div>
        <div className={`${styles.stat} animate-rise`} style={{ animationDelay: '180ms' }}>
          <span className={styles.statValue}>
            {attended > 0 ? `${Math.round((present / attended) * 100)}%` : '—'}
          </span>
          <span className={styles.statLabel}>Attendance Rate</span>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {sessions.length === 0 ? (
        <div className="card animate-rise">
          <p style={{ color: 'var(--ink-2)' }}>
            No sessions for you yet. They will appear here once your lecturers create them.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map((s, i) => {
            const meta = STATUS[s.status];
            return (
              <div
                key={s.id}
                className={`${styles.sessionCard} animate-rise`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div>
                  <strong>{s.title}</strong>
                  <span className={styles.course}>
                    {s.course}
                    {s.level && ` · ${s.level} Level`}
                    {s.department && ` · ${s.department}`}
                  </span>
                  <span className={styles.date}>
                    <Icon name="calendar" size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                    {sessionDate(s)}
                  </span>
                </div>
                <div className={styles.meta}>
                  <span className={meta.className}>
                    {s.status === 'present' && (
                      <Icon name="check" size={12} strokeWidth={2.5} />
                    )}
                    {meta.label}
                  </span>
                  {s.status === 'ongoing' && (
                    <Link
                      href={`/dashboard/student/session/${s.id}`}
                      className={styles.markLink}
                    >
                      Mark now →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
