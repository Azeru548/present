'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getLecturerSessions, closeSession } from '@/lib/firestore';
import AttendanceTable from '@/components/AttendanceTable';
import Loading from '@/components/Loading';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import SessionRow from '@/components/SessionRow';
import StatusBadge from '@/components/StatusBadge';
import Icon from '@/components/Icon';
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

  function exportCsv() {
    const rows = [
      ['#', 'Student Name', 'Email', 'Geo Verified', 'Face Verified', 'Timestamp'],
      ...attendance.map((r, i) => [
        String(i + 1),
        r.studentName || '',
        r.studentEmail || '',
        r.geoVerified ? 'Yes' : 'No',
        r.faceVerified ? 'Yes' : 'No',
        r.timestamp?.toDate?.().toLocaleString() || '',
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (selectedSession?.title || 'attendance')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `attendance-${slug}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (authLoading || loading) return <Loading />;

  return (
    <div className="container">
      <PageHeader
        title="Lecturer Dashboard"
        sub={sessions.length ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} on record` : undefined}
        actions={[
          <Link key="create" href="/dashboard/lecturer/create-session" className="btn-primary">
            <Icon name="plus" size={16} />
            Create Session
          </Link>,
        ]}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon="plus"
          title="No sessions yet"
          text="Create your first attendance session and set its geo-radius and window here."
        />
      ) : (
        <div className={styles.grid}>
          <section className={`card animate-rise ${styles.panel}`} aria-label="Your sessions">
            <h2 className="subtitle">Your Sessions</h2>
            <div className={styles.sessionList}>
              {sessions.map((s, i) => {
                const tags = [
                  s.level && `${s.level} Level`,
                  s.department,
                ].filter(Boolean);
                return (
                  <SessionRow
                    key={s.id}
                    title={s.title}
                    meta={s.course}
                    tags={tags}
                    active={selectedSession?.id === s.id}
                    onClick={() => viewAttendance(s)}
                    trailing={
                      <StatusBadge tone={s.isActive ? 'active' : 'closed'}>
                        {s.isActive ? 'Active' : 'Closed'}
                      </StatusBadge>
                    }
                    delay={i * 50}
                  />
                );
              })}
            </div>
          </section>

          <section className={`card animate-rise ${styles.panel}`} style={{ flex: 2 }}>
            <div className={styles.panelHeader}>
              <h2 className="subtitle" style={{ marginBottom: 0 }}>
                {selectedSession
                  ? `Attendance — ${selectedSession.title}`
                  : 'Attendance'}
              </h2>
              {selectedSession && attendance.length > 0 && (
                <button
                  className="btn-ghost"
                  style={{ padding: '8px 14px' }}
                  onClick={exportCsv}
                >
                  <Icon name="download" size={16} />
                  Download CSV
                </button>
              )}
            </div>

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
              <div className={styles.selectHint}>
                <p>Select a session to view its attendance.</p>
                <p className={styles.selectHintSub}>
                  Rows appear here in real time as students verify.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}