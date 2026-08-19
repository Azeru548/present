'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireRole } from '@/lib/useRequireRole';
import { getSession, markAttendance, hasMarkedAttendance } from '@/lib/firestore';
import { getCurrentPosition, isWithinRange, assertUsableLocation } from '@/lib/geo';
import { authenticateFace, loadModels, probeFrame, stopCamera } from '@/lib/face';
import { friendlyError } from '@/lib/errors';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import styles from './page.module.css';

const verificationSteps = ['Location', 'Identity', 'Recorded'];

export default function SessionAttendance() {
  const { id } = useParams();
  const { user, userData, ready } = useRequireRole('student');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [session, setSession] = useState(null);
  const [step, setStep] = useState('loading'); // loading | geo | face | done | denied | error
  const [deniedReason, setDeniedReason] = useState(''); // profile | mismatch
  const [geoResult, setGeoResult] = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [faceScanning, setFaceScanning] = useState(false);
  const [modelProgress, setModelProgress] = useState(null); // null = not loading, 0-100 while loading
  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState('');
  const [geoChecking, setGeoChecking] = useState(false);
  const [geoHint, setGeoHint] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    loadSession();
  }, [id, user, userData, ready]);

  async function loadSession() {
    try {
      const s = await getSession(id);
      if (!s || !s.isActive) {
        setError('This session is not active or does not exist.');
        setStep('error');
        return;
      }
      setSession(s);

      const { level, department } = userData || {};
      const requiresProfile = (s.level && !level) || (s.department && !department);
      if (requiresProfile) {
        setDeniedReason('profile');
        setStep('denied');
        return;
      }
      if ((s.level && s.level !== level) || (s.department && s.department !== department)) {
        setDeniedReason('mismatch');
        setStep('denied');
        return;
      }

      const already = await hasMarkedAttendance(id, user.uid);
      if (already) {
        setStep('done');
        return;
      }

      setStep('geo');
    } catch (err) {
      setError(
        friendlyError(err, 'Could not load this session. Check your connection and try again.')
      );
      setStep('error');
    }
  }

  async function handleGeoCheck() {
    setError('');
    setGeoChecking(true);
    setGeoHint('Checking your location…');
    try {
      const pos = assertUsableLocation(
        await getCurrentPosition({
          onUpdate: (sample) =>
            setGeoHint(`Checking location… ±${Math.round(sample.accuracy)}m`),
        })
      );
      const result = isWithinRange(pos, session.location, session.location.radius);
      setGeoResult(result);
      if (result.within) {
        setStep('face');
      } else {
        setError(
          `About ${result.distance}m from the class pin (±${result.accuracy}m). You need to be within about ${result.allowed}m.`
        );
      }
    } catch (err) {
      setError(
        friendlyError(err, 'Could not get your location. Allow location access and try again.')
      );
    } finally {
      setGeoChecking(false);
      setGeoHint('');
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

  if (!ready) return <Loading />;

  const stepIndex =
    step === 'geo' ? 1 : step === 'face' ? 2 : step === 'done' ? 3 : 0;

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
          <h1 className={styles.sessionTitle}>{session.title}</h1>
          <p className={styles.sessionCourse}>{session.course}</p>
          {(session.level || session.department) && (
            <span className={styles.sessionTag}>
              {[session.level && `${session.level} Level`, session.department]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}

          {stepIndex > 0 && (
            <div className={styles.stepper} aria-label="Verification progress">
              {verificationSteps.map((label, i) => {
                const n = i + 1;
                const isDone = n < stepIndex;
                const isActive = n === stepIndex;
                return (
                  <Fragment key={label}>
                    {i > 0 && (
                      <span
                        className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`}
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className={`${styles.step} ${isDone ? styles.stepDone : ''} ${
                        isActive ? styles.stepActive : ''
                      }`}
                    >
                      <span className={styles.stepIdx}>
                        {isDone ? (
                          <Icon name="check" size={12} strokeWidth={2.5} />
                        ) : (
                          n
                        )}
                      </span>
                      <span className={styles.stepLabel}>{label}</span>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}

          {step === 'denied' && (
            <div className={styles.stateWrap}>
              <span className={styles.stateIcon} aria-hidden="true">
                <Icon name="shield" size={30} strokeWidth={1.5} />
              </span>
              <h2 className={styles.stateTitle}>
                {deniedReason === 'profile'
                  ? 'Complete your profile first'
                  : 'You are not eligible for this session'}
              </h2>
              {deniedReason === 'profile' ? (
                <p className={styles.stateText}>
                  This session is for{' '}
                  <b>
                    {[session.level && `${session.level} Level`, session.department]
                      .filter(Boolean)
                      .join(' · ') || 'a specific level/department'}
                  </b>
                  . Set your level and department in your profile to mark
                  attendance here.
                </p>
              ) : (
                <p className={styles.stateText}>
                  This session is for{' '}
                  <b>
                    {[session.level && `${session.level} Level`, session.department]
                      .filter(Boolean)
                      .join(' · ')}
                  </b>
                  , but you are{' '}
                  <b>
                    {userData?.level} Level · {userData?.department}
                  </b>
                  . Only students in the right class can verify and mark
                  attendance.
                </p>
              )}
              <div className={styles.stateActions}>
                {deniedReason === 'profile' ? (
                  <button
                    className="btn-primary"
                    onClick={() => router.push('/dashboard/student')}
                  >
                    Complete My Profile
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => router.push('/dashboard/lectures')}
                  >
                    Back to Lectures
                  </button>
                )}
              </div>
            </div>
          )}
          {session.locationNote && (
            <p className={styles.locationNote}>
              <Icon name="pin" size={14} />
              {session.locationNote}
            </p>
          )}

          {step === 'geo' && (
            <>
              <div className={styles.verifyIntro}>
                <span className={styles.verifyIcon} aria-hidden="true">
                  <Icon name="pin" size={18} />
                </span>
                <div>
                  <p className={styles.verifyLabel}>Step 1 · Verify your location</p>
                  <p className={styles.verifyText}>
                    Confirm you are near the classroom pin the lecturer placed
                    (about <b>{session.location.radius}m</b>, plus your phone’s
                    GPS uncertainty).
                  </p>
                </div>
              </div>
              {geoHint && !error && (
                <p className={styles.verifyText}>{geoHint}</p>
              )}
              {error && <p className="error">{error}</p>}
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleGeoCheck}
                disabled={geoChecking}
              >
                <Icon name="navigate" size={16} />
                {geoChecking ? 'Locating…' : 'Verify Location'}
              </button>
            </>
          )}

          {step === 'face' && (
            <>
              <div className={styles.chipGeo}>
                <Icon name="check" size={12} strokeWidth={2.5} />
                Location verified — about {geoResult?.distance}m from the class pin
                {geoResult?.accuracy ? ` (±${geoResult.accuracy}m)` : ''}
              </div>

              <div className={styles.verifyIntro}>
                <span className={styles.verifyIcon} aria-hidden="true">
                  <Icon name="face" size={18} />
                </span>
                <div>
                  <p className={styles.verifyLabel}>Step 2 · Verify your face</p>
                  <p className={styles.verifyText}>
                    When you start the scan, a camera window will open. Center
                    your face in the reticle and keep still.
                  </p>
                </div>
              </div>

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
                    <p className={styles.scrimHint}>
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
                  <div className={styles.guide} aria-hidden="true">
                    <div className={styles.reticle}>
                      <span className={`${styles.tick} ${styles.tickTL}`} />
                      <span className={`${styles.tick} ${styles.tickTR}`} />
                      <span className={`${styles.tick} ${styles.tickBL}`} />
                      <span className={`${styles.tick} ${styles.tickBR}`} />
                      <div className={styles.guideOval} />
                      <div className={styles.scanline} />
                    </div>
                  </div>
                  <div className={styles.scanPill}>
                    <span className={styles.spinnerSmall} aria-hidden="true" />
                    <span className={styles.scanText}>Scanning your face...</span>
                  </div>
                  {scanStatus ? (
                    <p className={styles.scanOverlayWarn}>{scanStatus}</p>
                  ) : (
                    <p className={styles.scanOverlay}>
                      Keep your face inside the reticle and stay still.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {error && <p className="error">{error}</p>}
                  <button
                    className="btn-success"
                    style={{ width: '100%' }}
                    onClick={handleFaceCheck}
                  >
                    <Icon name="scan" size={16} />
                    Start Face Scan
                  </button>
                </>
              )}
            </>
          )}

          {step === 'done' && (
            <div className={styles.doneWrap}>
              <div className={styles.doneStamp}>Present</div>
              <h2 className={styles.doneTitle}>Attendance marked</h2>
              <p className={styles.doneText}>
                {userData?.name || user?.displayName || 'Student'} — your face
                matched the enrolled profile.
              </p>
              <div className={styles.doneMeta}>
                {typeof faceResult?.distance === 'number' && (
                  <span>
                    Face match distance {faceResult.distance.toFixed(2)} ·
                    threshold {process.env.NEXT_PUBLIC_FACE_THRESHOLD || 0.6}
                  </span>
                )}
                {geoResult && (
                  <span>Location · {geoResult.distance}m from class</span>
                )}
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={() => router.push('/dashboard/lectures')}
              >
                <Icon name="chevronRight" size={16} />
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
