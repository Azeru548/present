'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createSession } from '@/lib/firestore';
import { getCurrentPosition } from '@/lib/geo';
import Loading from '@/components/Loading';

export default function CreateSession() {
  const { user, role, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [radius, setRadius] = useState(50);
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (authLoading) return <Loading />;
  if (!user || role !== 'lecturer') {
    router.push('/login/lecturer');
    return null;
  }

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
        location: { lat: pos.lat, lng: pos.lng, radius: Number(radius) },
        durationMinutes: Number(duration),
        endTime,
      });

      setSuccess('Session created! Redirecting...');
      setTimeout(() => router.push('/dashboard/lecturer'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to create session. Check location permissions.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card animate-pop" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="auth-icon" aria-hidden="true">
        🗓️
      </div>
      <h1 className="page-title" style={{ textAlign: 'center' }}>
        Create Lecture Session
      </h1>
      <form onSubmit={handleSubmit}>
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
        <div className="form-group">
          <label>Geo-Radius (meters) — default 50m</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            min={10}
            required
          />
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
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting}
          style={{ width: '100%', marginTop: 8 }}
        >
          {submitting ? 'Creating...' : 'Create Session'}
        </button>
      </form>
      </div>
    </div>
  );
}