'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSession, markAttendance, hasMarkedAttendance } from '@/lib/firestore';
import { getCurrentPosition, isWithinRange } from '@/lib/geo';
import { authenticateFace, loadModels, probeFrame, stopCamera } from '@/lib/face';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import styles from './page.module.css';

const checkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 600,
  marginBottom: 6,
};

export default function SessionAttendance() {
  const { id } = useParams();
  const { user, role, userData, loading: authLoading } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [session, setSession] = useState(null);
  const [step, setStep] = useState('loading'); // loading | geo | face | done | error
  const [geoResult, setGeoResult] = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [faceScanning, setFaceScanning] = useState(false);
  const [modelProgress, setModelProgress] = useState(null); // null = not loading, 0-100 while loading
  const [scanStatus, setScanStatus] = useState('');
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

  function handleFaceCheck() {
    setError('');
    setModelProgress(0);
    (async () => {
      try {
        // Load models first so the user sees a progress bar instead of a
        // silent "scanning" state while the ~6MB of weights download.
        await loadModels({ onProgress: setModelProgress });
        setModelProgress(null);
        setFaceScanning(true);
      } catch (err) {
        setModelProgress(null);
        setError(
          'Could not load the face recognition models. Check your connection and try again.'
        );
      }
    })();
  }

  function friendlyFaceError(err) {
    const msg = err?.message || '';
    const name = err?.name || '';
    if (msg.includes('No enrolled face')) {
      return 'You have not enrolled your face yet. Please enroll from your dashboard before marking attendance.';
    }
    if (msg.includes('library failed to load')) {
      return 'Face recognition library could not be loaded. Check your internet connection and try again.';
    }
    if (msg.includes('still loading') || msg.includes('did not finish loading')) {
      return 'Face models are still downloading. Check your connection and try again in a moment.';
    }
    if (msg.includes('No face detected')) {
      return 'No face detected. Make sure your face is visible in the oval and the lighting is good.';
    }
    if (msg.includes('too small')) {
      return 'Your face was detected but appears too small. Move closer to the camera so your face fills the oval.';
    }
    if (msg.includes('blurry')) {
      return 'Your face was detected but is blurry. Hold still, remove glare, and make sure the lighting is good.';
    }
    if (msg.includes('does not match')) {
      return 'Your face does not match the one on file. If you look different now, update your face enrollment from your dashboard.';
    }
    if (name === 'NotAllowedError' || msg.toLowerCase().includes('denied')) {
      return 'Camera permission was denied. Please allow camera access in your browser, then try again.';
    }
    if (name === 'NotFoundError') {
      return 'No camera was found on this device.';
    }
    if (name === 'NotReadableError') {
      return 'Your camera is already in use by another application. Close it and try again.';
    }
    return msg
      ? `Face verification failed: ${msg}`
      : 'Face verification failed. Please try again.';
  }

  useEffect(() => {
    if (step !== 'face' || !faceScanning) return;
    let cancelled = false;

    (async () => {
      try {
        const result = await authenticateFace(user.uid, videoRef.current);
        if (cancelled) return;
        stopCamera(streamRef.current);
        streamRef.current = null;
        setFaceResult({ verified: true, distance: result.distance });
        await markAttendance(id, user.uid, true, true);
        if (!cancelled) setStep('done');
      } catch (err) {
        stopCamera(streamRef.current);
        streamRef.current = null;
        if (!cancelled) {
          setFaceScanning(false);
          setError(friendlyFaceError(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, [step, faceScanning, id, user?.uid]);

  useEffect(() => {
    if (step !== 'face' || !faceScanning) return;
    let cancelled = false;
    let timer = null;
    const poll = async () => {
      if (cancelled || !videoRef.current) return;
      const result = await probeFrame(videoRef.current);
      if (!cancelled) {
        setScanStatus(scanStatusText(result));
      }
      timer = setTimeout(poll, 400);
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [step, faceScanning]);

  function scanStatusText(result) {
    switch (result?.status) {
      case 'no-face':
        return 'No face detected — center your face in the oval.';
      case 'too-small':
        if (result.boxWidth != null) {
          return `Face too small (${Math.round(result.boxWidth)}px, need ≥ ${Math.round(
            result.minWidth
          )}px) — move closer.`;
        }
        return 'Face too small — move closer to the camera.';
      case 'blurry':
        return 'Blurry — hold still and improve the lighting.';
      case 'loading':
        return 'Loading face recognition models...';
      case 'good':
        return '';
      case 'error':
        return 'Scanning...';
      default:
        return '';
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
          <p style={{ color: 'var(--ink-2)', marginBottom: 4 }}>
            {session.course}
          </p>
          {session.locationNote && (
            <p
              style={{
                marginBottom: 20,
                color: 'var(--brand-600)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              📍 {session.locationNote}
            </p>
          )}

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

              {modelProgress !== null ? (
                <div className={styles.faceBox} role="status" aria-live="polite">
                  <div className={styles.loadScrim}>
                    <span className={styles.spinner} aria-hidden="true" />
                    <p className={styles.scanText}>
                      Loading face recognition models...
                    </p>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-valuenow={modelProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className={styles.progressBar}
                        style={{ width: `${modelProgress}%` }}
                      />
                    </div>
                    <p className={styles.progressPct}>{modelProgress}%</p>
                    <p className={styles.scanHint}>
                      One-time setup, only on the first scan.
                    </p>
                  </div>
                </div>
              ) : faceScanning ? (
                <div className={styles.faceBox} role="status" aria-live="polite">
                  <video
                    ref={videoRef}
                    className={styles.video}
                    autoPlay
                    muted
                    playsInline
                  />
                  <span className={styles.scanGuide} aria-hidden="true" />
                  <div className={styles.scanPill}>
                    <span className={styles.spinner} aria-hidden="true" />
                    <span className={styles.scanText}>Scanning your face...</span>
                  </div>
                  {scanStatus ? (
                    <p className={styles.scanHint} style={{ color: '#d97706' }}>
                      {scanStatus}
                    </p>
                  ) : (
                    <p className={styles.scanHint}>
                      Keep your face inside the oval and stay still.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: 18, color: 'var(--ink-2)', fontSize: '0.92rem' }}>
                    When you start the scan, a camera window will open. Center
                    your face in the oval and keep still.
                  </p>
                  {error && <p className="error">{error}</p>}
                  <button className="btn-success" onClick={handleFaceCheck}>
                    Start Face Scan
                  </button>
                </>
              )}
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
                {userData?.name || user?.displayName || 'Student'} — your face
                matched the enrolled profile.
              </p>
              {typeof faceResult?.distance === 'number' && (
                <p style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginTop: 4 }}>
                  Face match distance: {faceResult.distance.toFixed(2)} (threshold{' '}
                  {process.env.NEXT_PUBLIC_FACE_THRESHOLD || 0.6})
                </p>
              )}
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
                onClick={() => router.push('/dashboard/lectures')}
              >
                Back to Lectures
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
