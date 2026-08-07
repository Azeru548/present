'use client';
import { useEffect, useRef, useState } from 'react';
import {
  loadModels,
  startCamera,
  stopCamera,
  captureDescriptor,
  saveEnrollment,
  drawDetections,
  probeFrame,
} from '@/lib/face';
import styles from './FaceEnrollment.module.css';

const SAMPLES = 3;
const SAMPLE_FRAMES = 6;
const SAMPLE_GAP = 250;

const qualityMessages = {
  good: 'Face detected — capture it now',
  'too-small': 'Move closer so your face fills the oval',
  blurry: 'Hold still and make sure the lighting is good',
  'no-face': 'Center your face in the oval',
  loading: 'Face recognition models are still loading...',
  error: 'Face scanner is warming up...',
};

export default function FaceEnrollment({ userId, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stage, setStage] = useState('starting'); // starting | ready | capturing | success | error
  const [message, setMessage] = useState('');
  const [modelProgress, setModelProgress] = useState(null);
  const [quality, setQuality] = useState(null);
  const [sample, setSample] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadModels({
          onProgress: setModelProgress,
        });
        setModelProgress(null);
        if (cancelled) return;
        const stream = await startCamera(videoRef.current);
        streamRef.current = stream;
        if (!cancelled) setStage('ready');
      } catch (err) {
        if (!cancelled) {
          setStage('error');
          setMessage(err.message || 'Could not start camera.');
        }
      }
    })();
    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stage !== 'ready') return;
    let cancelled = false;
    let timer = null;
    const poll = async () => {
      if (cancelled || !videoRef.current) return;
      const result = await probeFrame(videoRef.current);
      if (!cancelled) setQuality(result);
      timer = setTimeout(poll, 400);
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [stage]);

  async function handleCapture() {
    setStage('capturing');
    setMessage('');
    setSample(0);
    try {
      const descriptors = [];
      for (let i = 0; i < SAMPLES; i += 1) {
        setSample(i + 1);
        const { descriptor, detection } = await captureDescriptor(
          videoRef.current,
          { samples: SAMPLE_FRAMES }
        );
        descriptors.push(descriptor);
        if (i === 0) drawDetections(canvasRef.current, detection);
        if (i < SAMPLES - 1) {
          await new Promise((resolve) => setTimeout(resolve, SAMPLE_GAP));
        }
      }
      await saveEnrollment(userId, descriptors);
      setStage('success');
      stopCamera(streamRef.current);
      streamRef.current = null;
      if (onComplete) onComplete();
    } catch (err) {
      setStage('ready');
      setMessage(err.message || 'Face capture failed. Please try again.');
    }
  }

  function restartCamera() {
    setStage('starting');
    setMessage('');
    (async () => {
      try {
        const stream = await startCamera(videoRef.current);
        streamRef.current = stream;
        setStage('ready');
      } catch (err) {
        setStage('error');
        setMessage(err.message || 'Could not start camera.');
      }
    })();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.videoBox}>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.guide} aria-hidden="true">
          <div className={styles.guideOval} />
        </div>
        {stage === 'starting' && (
          <div className={styles.scrim}>
            {modelProgress !== null ? (
              <>
                <span className={styles.spinner} />
                <p className={styles.muted}>
                  Loading face recognition models...
                </p>
                <div className={styles.progressTrack} role="progressbar" aria-valuenow={modelProgress} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className={styles.progressBar}
                    style={{ width: `${modelProgress}%` }}
                  />
                </div>
                <p className={styles.progressPct}>{modelProgress}%</p>
              </>
            ) : (
              <>
                <span className={styles.spinner} />
                <p className={styles.muted}>Starting camera...</p>
              </>
            )}
          </div>
        )}
        {stage === 'capturing' && (
          <div className={styles.scrim}>
            <span className={styles.spinner} />
            <p className={styles.muted}>
              Capturing sample {sample}/{SAMPLES} — keep still...
            </p>
          </div>
        )}
        {stage === 'ready' && quality?.status === 'loading' && (
          <div className={styles.scrim} role="status">
            <span className={styles.spinner} />
            <p className={styles.muted}>Loading face recognition models...</p>
          </div>
        )}
      </div>

      {stage === 'ready' && quality?.status === 'good' && (
        <div className={styles.qualityGood}>
          <span aria-hidden="true">✓</span> {qualityMessages.good}
        </div>
      )}
      {stage === 'ready' && quality?.status === 'too-small' && (
        <div className={styles.qualityHint}>
          <span aria-hidden="true">•</span> Face is {Math.round(quality.boxWidth)}px
          wide (need ≥ {Math.round(quality.minWidth)}px) — move closer.
        </div>
      )}
      {stage === 'ready' &&
        quality?.status &&
        quality.status !== 'good' &&
        quality.status !== 'too-small' &&
        quality.status !== 'loading' && (
          <div className={styles.qualityHint}>
            <span aria-hidden="true">•</span>{' '}
            {qualityMessages[quality.status] || qualityMessages.error}
          </div>
        )}

      {stage === 'ready' && message && <p className="error">{message}</p>}

      {stage === 'ready' && (
        <>
          <p className={styles.instruction}>
            Center your face on the oval and look straight at the camera. {SAMPLES}{' '}
            samples are captured so verification works in more lighting and angles.
          </p>
          <button className="btn-success" onClick={handleCapture}>
            Capture Face
          </button>
        </>
      )}

      {stage === 'success' && (
        <div className={styles.center}>
          <span className={styles.check} aria-hidden="true">
            ✓
          </span>
          <h3 className={styles.successTitle}>Face Enrolled Successfully</h3>
          <p className={styles.muted}>
            Your face is now registered for attendance verification.
          </p>
        </div>
      )}

      {stage === 'error' && (
        <div className={styles.center}>
          <p className="error">{message}</p>
          <button className="btn-primary" onClick={restartCamera}>
            Try Again
          </button>
        </div>
      )}

      {onCancel && stage !== 'success' && stage !== 'starting' && (
        <button className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}
