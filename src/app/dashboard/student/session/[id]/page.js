'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSession, markAttendance, hasMarkedAttendance } from '@/lib/firestore';
import { getCurrentPosition, isWithinRange } from '@/lib/geo';
import { authenticateFace } from '@/lib/face';
import Loading from '@/components/Loading';

const checkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 600,
  marginBottom: 6,
};

export default function SessionAttendance() {
  const { id } = useParams();
  const { user, role, loading: authLoading } = useAuth();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState('loading'); // loading | geo | face | done | error
  const [geoResult, setGeoResult] = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== 'student') {
      router.push('/login/student');
      return;
    }
    loadSession();
  }, [id, user, role, authLoading]);

  async function loadSession() {
    const s = await getSession(id);
    if (!s || !s.isActive) {
      setError('This session is not active or does not exist.');
      setStep('error');
      return;
    }
    setSession(s);

    const already = await hasMarkedAttendance(id, user.uid);
    if (already) {
      setStep('done');
      return;
    }

    setStep('geo');
  }

  async function handleGeoCheck() {
    setError('');
    try {
      const pos = await getCurrentPosition();
      const result = isWithinRange(pos, session.location, session.location.radius);
      setGeoResult(result);
      if (result.within) {
        setStep('face');
      } else {
        setError(`You are ${result.distance}m away. Must be within ${session.location.radius}m of the class.`);
      }
    } catch (err) {
      setError('Could not get your location. Please enable GPS.');
    }
  }

  async function handleFaceCheck() {
    setError('');
    try {
      await authenticateFace(user.uid);
      setFaceResult({ verified: true });

      await markAttendance(id, user.uid, true, true);
      setStep('done');
    } catch (err) {
      setError('Face verification failed. Please try again.');
    }
  }

  if (authLoading) return <Loading />;

  return (
    <div className="container">
      <div className="card animate-pop" style={{ maxWidth: 520, margin: '40px auto' }}>
      {step === 'loading' && <Loading text="Loading session..." />}

      {step === 'error' && (
        <>
          <h1 className="page-title">Error</h1>
          <p className="error">{error}</p>
        </>
      )}

      {session && step !== 'error' && (
        <>
          <h1 className="page-title">{session.title}</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: 24 }}>
            {session.course}
          </p>

          {step === 'geo' && (
            <>
              <p style={checkStyle}>
                <span aria-hidden="true">📍</span>
                Step 1 · Verify your location
              </p>
              <p style={{ marginBottom: 18, color: 'var(--ink-2)', fontSize: '0.92rem' }}>
                Confirm you are within {session.location.radius}m of the class to
                proceed.
              </p>
              {error && <p className="error">{error}</p>}
              <button className="btn-primary" onClick={handleGeoCheck}>
                Verify Location
              </button>
            </>
          )}

          {step === 'face' && (
            <>
              <p style={{ ...checkStyle, color: 'var(--brand-600)' }}>
                <span aria-hidden="true">✅</span>
                Location verified — {geoResult?.distance}m from class
              </p>
              <p style={checkStyle}>
                <span aria-hidden="true">😀</span>
                Step 2 · Verify your face
              </p>
              <p style={{ marginBottom: 18, color: 'var(--ink-2)', fontSize: '0.92rem' }}>
                Look at the camera to confirm your identity.
              </p>
              {error && <p className="error">{error}</p>}
              <button className="btn-success" onClick={handleFaceCheck}>
                Verify Face
              </button>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  margin: '0 auto 18px',
                  borderRadius: '50%',
                  background: 'var(--brand-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  animation: 'popIn 0.5s cubic-bezier(.4,0,.2,1)',
                }}
                aria-hidden="true"
              >
                🎉
              </div>
              <h2 style={{ color: 'var(--brand-600)', marginBottom: 10 }}>
                Attendance Marked
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: '0.95rem' }}>
                {geoResult && `Location: ${geoResult.distance}m from class`}
                {geoResult && faceResult && ' · '}
                {faceResult && 'Face verified successfully'}
              </p>
              <p style={{ color: 'var(--ink-3)', marginTop: 10, fontSize: '0.88rem' }}>
                You have successfully marked attendance for this session.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => router.push('/dashboard/student')}
              >
                Back to Sessions
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}