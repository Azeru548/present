'use client';
import { useEffect, useRef, useState } from 'react';
import {
  loadModels,
  startCamera,
  stopCamera,
  detectFace,
  saveEnrollment,
} from '@/lib/face';
import styles from './FaceEnrollment.module.css';

export default function FaceEnrollment({ userId, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stage, setStage] = useState('starting'); // starting | ready | capturing | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadModels();
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

  async function handleCapture() {
    setStage('capturing');
    setMessage('');
    try {
      const detection = await detectFace(videoRef.current);
      drawBox(detection);
      await saveEnrollment(userId, Array.from(detection.descriptor));
      setStage('success');
      stopCamera(streamRef.current);
      streamRef.current = null;
      if (onComplete) onComplete();
    } catch (err) {
      setStage('ready');
      setMessage(err.message || 'Face capture failed. Please try again.');
    }
  }

  function drawBox(detection) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (window.faceapi?.draw) {
      window.faceapi.draw.drawDetections(canvas, detection);
      window.faceapi.draw.drawFaceLandmarks(canvas, detection);
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
            <span className={styles.spinner} />
            <p className={styles.muted}>Preparing camera...</p>
          </div>
        )}
        {stage === 'capturing' && (
          <div className={styles.scrim}>
            <span className={styles.spinner} />
            <p className={styles.muted}>Analyzing your face...</p>
          </div>
        )}
      </div>

      {stage === 'ready' && message && <p className="error">{message}</p>}

      {stage === 'ready' && (
        <>
          <p className={styles.instruction}>
            Center your face on the oval, look straight at the camera, and make
            sure the lighting is good.
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
