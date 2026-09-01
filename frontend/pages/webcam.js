import Head from 'next/head';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getToken } from '../lib/auth';
import StepBar from '../components/StepBar';
import Wordmark from '../components/Wordmark';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';



export default function WebcamPage() {
  const router = useRouter();
  const { id: userId } = router.query;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [snapshot, setSnapshot] = useState(null); // data URL
  const [cameraError, setCameraError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access was denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Capture snapshot
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSnapshot(dataUrl);
    stopCamera();
  };

  // Retake
  const handleRetake = () => {
    setSnapshot(null);
    setUploadError('');
    startCamera();
  };

  // Upload & proceed
  const handleUpload = async () => {
    if (!snapshot || !userId) return;
    setUploading(true);
    setUploadError('');
    try {
      // Convert dataURL → Blob
      const res = await fetch(snapshot);
      const blob = await res.blob();
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });

      const form = new FormData();
      form.append('file', file);

      const token = getToken();
      const uploadRes = await fetch(`${API}/upload-face/${userId}`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: form 
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Upload failed. Please try again.');
      }
      router.push(`/liveness?id=${userId}`);
    } catch (err) {
      setUploadError(err.message);
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Face Capture – IDentix</title>
        <meta name="description" content="Capture your face photo to complete identity verification." />
      </Head>

      <main className="page">
        <div className="card">
          <Wordmark />

          <StepBar current={2} />

          <h1 className="page-title">Face capture</h1>
          <p className="page-subtitle">
            {snapshot ? 'Looking good! Confirm your photo or retake.' : 'Position your face in the frame and press Capture.'}
          </p>

          <div className="webcam-container">
            {/* Camera error */}
            {cameraError && (
              <div className="alert alert-error" style={{ width: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {cameraError}
              </div>
            )}

            {/* Hidden canvas for snapshot */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Live feed */}
            {!snapshot && (
              <div className="video-frame">
                <video ref={videoRef} playsInline muted style={{ transform: 'scaleX(-1)' }} />
                {cameraReady && <div className="recording-dot" />}
                {!cameraReady && !cameraError && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-muted)',
                    fontSize: 14
                  }}>
                    <span className="spinner" style={{ borderTopColor: 'var(--accent)', borderColor: 'var(--border)' }} />
                    <span>Starting camera…</span>
                  </div>
                )}
              </div>
            )}

            {/* Snapshot preview */}
            {snapshot && (
              <div className="snapshot-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snapshot} alt="Captured face" style={{ transform: 'scaleX(-1)' }} />
              </div>
            )}

            {/* Controls */}
            {!snapshot ? (
              <button
                id="capture-btn"
                className="btn btn-capture"
                onClick={handleCapture}
                disabled={!cameraReady}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.8" />
                  <circle cx="9" cy="9" r="4" fill="white" />
                </svg>
                Capture
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button
                  id="retake-btn"
                  className="btn btn-primary"
                  onClick={handleRetake}
                  disabled={uploading}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: 'none', color: 'var(--text)' }}
                >
                  Retake
                </button>
                <button
                  id="confirm-btn"
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? <><span className="spinner" />Uploading…</> : 'Confirm & Continue →'}
                </button>
              </div>
            )}

            {uploadError && (
              <div className="alert alert-error" style={{ width: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {uploadError}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
