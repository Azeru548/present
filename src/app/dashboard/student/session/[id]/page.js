'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSession, markAttendance, hasMarkedAttendance } from '@/lib/firestore';
import { getCurrentPosition, isWithinRange } from '@/lib/geo';
import { authenticateFace } from '@/lib/face';
import Loading from '@/components/Loading';

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
    <div className="card" style={{ maxWidth: 500, margin: '40px auto' }}>
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
          <p style={{ color: '#888', marginBottom: 20 }}>{session.course}</p>

          {step === 'geo' && (
            <>
              <p style={{ marginBottom: 16 }}>
                Step 1: Verify your location to confirm you are in class.
              </p>
              {error && <p className="error">{error}</p>}
              <button className="btn-primary" onClick={handleGeoCheck}>
                Verify Location
              </button>
            </>
          )}

          {step === 'face' && (
            <>
              <p style={{ color: '#1b9e5a', marginBottom: 8 }}>
                Location verified — {geoResult?.distance}m from class ✓
              </p>
              <p style={{ marginBottom: 16 }}>
                Step 2: Facial verification to confirm your identity.
              </p>
              {error && <p className="error">{error}</p>}
              <button className="btn-success" onClick={handleFaceCheck}>
                Verify Face
              </button>
            </>
          )}

          {step === 'done' && (
            <>
              <h2 style={{ color: '#1b9e5a', marginBottom: 12 }}>✓ Attendance Marked</h2>
              {geoResult && <p>Location: {geoResult.distance}m from class</p>}
              {faceResult && <p>Face verified successfully</p>}
              <p style={{ color: '#888', marginTop: 16 }}>
                You have successfully marked attendance for this session.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => router.push('/dashboard/student')}
              >
                Back to Sessions
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
