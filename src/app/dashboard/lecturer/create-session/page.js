'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireRole } from '@/lib/useRequireRole';
import { createSession } from '@/lib/firestore';
import { getCurrentPosition } from '@/lib/geo';
import { friendlyError } from '@/lib/errors';
import { LEVELS, DEPARTMENTS } from '@/lib/constants';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import PageHeader from '@/components/PageHeader';
import styles from './page.module.css';

export default function CreateSession() {
  const { user, ready } = useRequireRole('lecturer');
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [radius, setRadius] = useState(50);
  const [duration, setDuration] = useState(60);
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!ready) return <Loading />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const pos = await getCurrentPosition();
      const endTime = new Date(Date.now() + duration * 60000).toISOString();

      await createSession({
        title: title.trim(),
        course: course.trim(),
        lecturerId: user.uid,
        level: level || null,
        department: department || null,
        locationNote: locationNote.trim() || null,
        location: { lat: pos.lat, lng: pos.lng, radius: Number(radius) },
        durationMinutes: Number(duration),
        endTime,
      });

      setSuccess('Session created! Redirecting...');
      setTimeout(() => router.push('/dashboard/lecturer'), 1500);
    } catch (err) {
      setError(
        friendlyError(
          err,
          'Could not create the session. Check your location permission and connection, then try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <PageHeader
        title="Create Lecture Session"
        sub="Your current location is captured as the classroom anchor."
      />
      <div className={`card animate-pop ${styles.formCard}`}>
        <form onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <div className="form-group">
              <label>Lecture Title</label>
              <input
                placeholder="e.g. Data Structures & Algorithms"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Course Code / Name</label>
              <input
                placeholder="e.g. CS301"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className="form-group">
              <label>Geo-Radius (meters)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                min={10}
                required
              />
              <p className={styles.hint}>Default 50 m around the class.</p>
            </div>
            <div className="form-group">
              <label>Attendance Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={5}
                required
              />
              <p className={styles.hint}>Window is auto-closed afterwards.</p>
            </div>
          </div>

          <div className="form-group">
            <label>Class Location {locationNote ? '' : '(optional — shown to students)'}</label>
            <input
              type="text"
              placeholder="e.g. Block B, Room 204, Engineering Building"
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className="form-group">
              <label>Level (optional — All levels if blank)</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">All Levels</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Department (optional — All departments if blank)</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <div className={styles.submitRow}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              <Icon name="plus" size={16} />
              {submitting ? 'Creating...' : 'Create Session'}
            </button>
            {locationNote && (
              <p className={styles.anchorNote}>
                <Icon name="pin" size={14} />
                {locationNote}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}