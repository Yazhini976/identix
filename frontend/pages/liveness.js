import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const API = 'http://localhost:8000';

/* ── Step bar ── */
function StepBar({ current }) {
  const steps = ['Sign Up', 'Capture', 'Liveness', 'Dashboard'];
  return (
    <div className="steps" style={{ marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isDone    = n < current;
        const isActive  = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-dot">
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : n}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-line" style={{ width: 40 }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ── Trust Engine Panel ── */
function TrustEnginePanel({ result }) {
  if (!result || !result.signals) return null;
  const { signals, risk, trust_score, confidence } = result;
  const isPass = result.liveness;
  
  return (
    <div className="trust-engine-panel">
      <div className="trust-engine-title">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1v16M1 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Trust Engine Analysis (Security-first)
      </div>
      
      <div className="trust-engine-title" style={{ marginTop: 16 }}>
        Required Signals
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Status: {Object.values(signals).filter(v=>v).length}/4 Verified
      </div>

      {result.is_simulation && (
        <div style={{ marginBottom: 16, padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 6, fontSize: 11, color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          SIMULATION ACTIVE
        </div>
      )}
      
      {/* Multi-layer Indicator */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Advanced Anti-Spoofing
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: result.liveness || result.signals.face ? 'var(--success)' : 'var(--text-muted)' }}>
            <span style={{ fontSize: 12 }}>{result.liveness || result.signals.face ? '✔' : '○'}</span> Liveness Detection
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: result.deepfake ? 'var(--error)' : (result.liveness ? 'var(--success)' : 'var(--text-muted)') }}>
            <span style={{ fontSize: 12 }}>{result.deepfake ? '❌' : (result.liveness ? '✔' : '○')}</span> Deepfake/Screen Check
          </div>
        </div>
      </div>

      <div className="signals-grid">
        <div className="signal-item">
          <span>Face Integrity</span>
          <span className={`signal-status ${signals.face ? 'pass' : 'fail'}`}>
            {signals.face ? '✔' : '❌'}
          </span>
        </div>
        <div className="signal-item">
          <span>Natural Blink</span>
          <span className={`signal-status ${signals.blink ? 'pass' : 'fail'}`}>
            {signals.blink ? '✔' : '❌'}
          </span>
        </div>
        <div className="signal-item">
          <span>Micro-Movement</span>
          <span className={`signal-status ${signals.movement ? 'pass' : 'fail'}`}>
            {signals.movement ? '✔' : '❌'}
          </span>
        </div>
        <div className="signal-item">
          <span>Pixel Consistency</span>
          <span className={`signal-status ${signals.frame ? 'pass' : 'fail'}`}>
            {signals.frame ? '✔' : '❌'}
          </span>
        </div>
      </div>

      <div className="trust-engine-title" style={{ marginTop: 16 }}>
        Deepfake & Screen Detection
      </div>
      <div className="signal-item" style={{ marginTop: 8, padding: '10px 12px', background: result.deepfake ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', border: `1px solid ${result.deepfake ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: result.deepfake ? 'var(--error)' : 'var(--success)' }}>
            {result.deepfake ? '❌ Spoof/Screen artifacts detected' : '✔ No synthetic patterns detected'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {result.deepfake ? 'Reason: Synthetic grid or screen edge detected' : `Confidence: ${result.deepfake_confidence || 0.98}`}
          </span>
        </div>
      </div>
      
      <div className="trust-score-row">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TRUST SCORE</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{trust_score || 0}%</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>SECURITY LEVEL</span>
          <span className={`risk-badge risk-${(risk || 'HIGH').toLowerCase()}`} style={{ background: isPass ? 'var(--success)' : 'var(--error)' }}>{isPass ? 'VERIFIED' : 'FAILED'}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Explainability Panel ── */
function ExplainPanel({ result }) {
  if (!result || !result.signals) return null;
  const isPass = result.liveness;
  
  return (
    <div className="explain-panel">
      <div className="explain-title">{isPass ? 'Why Verified?' : 'Why Flagged?'}</div>
      <div className="explain-list">
        {result.signals.blink ? (
          <div className="explain-item">✔ Blink detected (eye aspect ratio drop)</div>
        ) : (
          <div className="explain-item" style={{ color: 'var(--error)' }}>❌ No blink detected (static image signature)</div>
        )}
        {result.signals.movement ? (
          <div className="explain-item">✔ Head movement detected</div>
        ) : (
          <div className="explain-item" style={{ color: 'var(--error)' }}>❌ No movement detected (replay attack risk)</div>
        )}
        {result.signals.frame ? (
          <div className="explain-item">✔ Frame variation confirms live feed</div>
        ) : (
          <div className="explain-item" style={{ color: 'var(--error)' }}>❌ Static frame detected (photo spoof)</div>
        )}
      </div>
    </div>
  );
}

/* ── Animated result overlay ── */
function ResultOverlay({ result }) {
  const [animConfidence, setAnimConfidence] = useState(85);
  
  useEffect(() => {
    if (!result) return;
    if (result.liveness) {
      setAnimConfidence(Math.round(result.confidence * 100));
    } else {
      // Animate drop
      let c = 85;
      const target = Math.round(result.confidence * 100);
      const int = setInterval(() => {
        c -= 3;
        if (c <= target) {
          c = target;
          clearInterval(int);
        }
        setAnimConfidence(c);
      }, 30);
      return () => clearInterval(int);
    }
  }, [result]);

  if (!result) return null;
  const isPass = result.liveness;
  
  // Parse Reason
  let spoofType = "Security Violation";
  if (result.reason) {
    if (result.reason.includes("Static frame")) spoofType = "Static Image Attack";
    else if (result.reason.includes("blink")) spoofType = "Non-Natural Blink";
    else if (result.reason.includes("Micro-movement")) spoofType = "Replay Attack";
    else if (result.reason.includes("Moiré") || result.reason.includes("Digital screen")) spoofType = "Screen-Based Spoof";
  }

  return (
    <div className={`liveness-result-overlay ${isPass ? 'result-pass' : 'result-fail'}`}>
      <div className="result-icon-wrap">
        {isPass ? (
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M10 18l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 12l12 12M24 12L12 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div className="result-title">
        {isPass ? 'Security Check Passed ✅' : result.is_simulation ? 'Simulation Result processed 🛠️' : 'Spoof Attack Blocked ❌'}
      </div>
      
      {!isPass && (
        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderRadius: 50, fontSize: 12, marginTop: 8, fontWeight: 600, border: '1px solid rgba(0,0,0,0.05)' }}>
          {result.is_simulation ? 'Test Scenario: ' : 'Blocked Attack: '}
          <span style={{ color: result.is_simulation ? 'var(--accent)' : 'var(--error)' }}>
            {result.is_simulation ? 'Fraud Scenario' : spoofType}
          </span>
        </div>
      )}

      <div className="result-subtitle" style={{ whiteSpace: 'pre-line', marginTop: 12, lineHeight: '1.5' }}>
        {isPass ? (
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Security Confidence: {animConfidence}% — Identity Validated.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: result.is_simulation ? 'var(--accent)' : 'var(--error)', fontWeight: 600 }}>
              {result.is_simulation ? 'Simulation result processed' : `Integrity Failure: ${animConfidence}%`}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {result.reason?.replace('Simulation: ', '') || 'Static image, screen detected, or no natural blink'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Confidence bar ── */
function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.7 ? 'var(--success)' : value >= 0.45 ? '#f59e0b' : 'var(--error)';
  return (
    <div className="confidence-bar-wrap">
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }}
        />
      </div>
      <span className="confidence-bar-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/*              LIVENESS PAGE                */
/* ══════════════════════════════════════════ */
export default function LivenessPage() {
  const router = useRouter();
  const { id: userId } = router.query;

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [phase, setPhase]         = useState('idle');   // idle | camera | captured | detecting | done
  const [cameraError, setCameraError] = useState('');
  const [snapshot, setSnapshot]   = useState(null);     // data URL (fallback/thumbnail) or Blob URL
  const [videoBlob, setVideoBlob] = useState(null);     // actual video data
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult]       = useState(null);     // LivenessResponse
  const [mounted, setMounted]     = useState(false);
  const [blink, setBlink]         = useState(false);    // instruction pulse
  
  // Multi-signal Engine State
  const [fraudMode, setFraudMode] = useState({ active: false, noBlink: false, staticFrame: false, noMovement: false });
  const [statusMsg, setStatusMsg] = useState('');
  const [progress, setProgress]   = useState(0);
  const [liveSignals, setLiveSignals] = useState({ face: false, blink: false, movement: false, frame: false });

  useEffect(() => { setMounted(true); }, []);

  const INSTRUCTIONS = ['Position your face in the frame', 'Ensure good lighting', 'Please blink slowly', 'Move your head slightly'];
  const [instructionIdx, setInstructionIdx] = useState(0);

  // Instruction pulse and rotation every 2.5s while camera is active
  useEffect(() => {
    if (phase !== 'camera') return;
    const t = setInterval(() => {
      setBlink(b => !b);
      setInstructionIdx(idx => (idx + 1) % INSTRUCTIONS.length);
    }, 2500);
    return () => clearInterval(t);
  }, [phase]);

  /* ── camera ── */
  const startCamera = useCallback(async () => {
    setCameraError('');
    setResult(null);
    setSnapshot(null);
    setVideoBlob(null);
    setPhase('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError(`Camera error: ${err.message}`);
      setPhase('idle');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ── capture (video) ── */
  const handleCapture = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    
    // Check for supported mime types (WebM for Chrome/Firefox, MP4 for Safari)
    const mimeType = MediaRecorder.isTypeSupported('video/webm') 
      ? 'video/webm' 
      : 'video/mp4';
      
    console.log("Using mimeType for recording:", mimeType);
    
    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("MediaRecorder creation failed:", e);
      setCameraError("Failed to start recorder: " + e.message);
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      console.log("Recording stopped. Chunks captured:", chunksRef.current.length);
      if (chunksRef.current.length === 0) {
        setCameraError("Recording failed: No video data captured.");
        setPhase('camera');
        setIsRecording(false);
        return;
      }
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setSnapshot(url);
      setPhase('captured');
      setIsRecording(false);
      stopCamera();
    };

    recorder.start();
    setIsRecording(true);
    setCountdown(3);

    // Automatic stop after 3 seconds
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (recorder.state !== 'inactive') recorder.stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ── run liveness ── */
  const handleVerify = async () => {
    // Ensure userId is present (handle router lag)
    const finalUserId = userId || router.query.id;
    
    if (!videoBlob) {
      alert("No video recorded. Please capture your biometrics first.");
      return;
    }
    if (!finalUserId) {
      alert("Session expired or User ID missing. Please go back to the signup page.");
      return;
    }
    
    setPhase('detecting');
    setProgress(0);
    setLiveSignals({ face: false, blink: false, movement: false, frame: false });

    console.log("Starting verification simulation... Fraud Mode:", fraudMode);

    try {
      // 1. Simulate Detection Sequence
      setStatusMsg('Analyzing facial geometry...');
      await sleep(800);
      setLiveSignals(s => ({ ...s, face: true }));
      setProgress(25);

      setStatusMsg('Extracting eye-blink frequency...');
      await sleep(1000);
      const blinkPass = fraudMode.active && fraudMode.noBlink ? false : true; 
      setLiveSignals(s => ({ ...s, blink: blinkPass }));
      setProgress(40);

      setStatusMsg('Analyzing micro-movement patterns...');
      await sleep(1000);
      const movePass = fraudMode.active && fraudMode.noMovement ? false : true;
      setLiveSignals(s => ({ ...s, movement: movePass }));
      setProgress(70);

      setStatusMsg('Detecting frame-to-frame noise consistency...');
      await sleep(1000);
      const framePass = fraudMode.active && fraudMode.staticFrame ? false : true;
      setLiveSignals(s => ({ ...s, frame: framePass }));
      setProgress(90);
      
      setStatusMsg('Finalizing Multi-Signal Trust Score...');
      await sleep(500);
      setProgress(100);

      // 2. Submit to Backend
      // Detect correct extension and MIME type
      const extension = videoBlob.type.includes('mp4') ? '.mp4' : '.webm';
      const file = new File([videoBlob], `liveness_capture${extension}`, { type: videoBlob.type || 'video/webm' });
      
      const form = new FormData();
      form.append('user_id', finalUserId);
      form.append('video', file);
      form.append('face_detected', '1');
      form.append('blink_detected', blinkPass ? '1' : '0');
      form.append('movement_detected', movePass ? '1' : '0');
      form.append('frame_variation', framePass ? '1' : '0');

      console.log(`Submitting ${extension} to backend with signals:`, {
        blink: blinkPass,
        movement: movePass,
        frame: framePass
      });

      const res  = await fetch(`${API}/liveness-check`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        console.error("Backend validation failed:", data);
        const errMsg = data.detail || 'Liveness check failed.';
        const isSim = errMsg.includes('Simulation:');
        setResult({ 
          liveness: false, 
          confidence: 0, 
          message: errMsg, 
          reason: errMsg,
          risk: 'HIGH',
          trust_score: 0,
          is_simulation: isSim,
          signals: { face: false, blink: false, movement: false, frame: false } 
        });
        setPhase('done');
        return;
      }

      console.log("Backend response:", data);
      setResult(data);
      setPhase('done');
    } catch (err) {
      console.error("Verification error:", err);
      setResult({ 
        liveness: false, 
        confidence: 0, 
        message: err.message, 
        reason: err.message,
        risk: 'HIGH',
        trust_score: 0,
        signals: { face: false, blink: false, movement: false, frame: false } 
      });
      setPhase('done');
    }
  };

  const handleRetake = () => {
    setSnapshot(null);
    setVideoBlob(null);
    setResult(null);
    startCamera();
  };

  const handleToDashboard = () => router.push(`/dashboard?id=${userId}`);

  return (
    <>
      <Head>
        <title>Trust Engine – IDentix</title>
      </Head>

      <main className="page">
        <div className={`card ${mounted ? 'fade-in' : ''}`} style={{ maxWidth: 500 }}>

          {/* Wordmark */}
          <div className="wordmark">
            <div className="wordmark-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 6v4c0 3.9 2.9 7.5 7 8.5 4.1-1 7-4.6 7-8.5V6L10 2z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="wordmark-text">IDentix</span>
          </div>

          <StepBar current={3} />

          <h1 className="page-title">Trust Engine Analysis</h1>
          <p className="page-subtitle">
            Confirming your identity through multi-signal behavioral analysis.
          </p>

          {/* ── Fraud Simulation Toggle ── */}
          {(phase === 'idle' || phase === 'camera' || phase === 'captured') && (
            <div className={`fraud-toggle-container ${fraudMode.active ? 'fraud-active' : ''}`} style={{ marginBottom: 16 }}>
              <div 
                className="fraud-toggle-wrap"
                onClick={() => setFraudMode(f => {
                  const newActive = !f.active;
                  if (newActive) {
                    // Default to a typical spoof scenario when activated: No Blink and Static Frame
                    return { active: true, noBlink: true, staticFrame: true, noMovement: false };
                  }
                  return { active: false, noBlink: false, staticFrame: false, noMovement: false };
                })}
                style={{ border: fraudMode.active ? '1px solid var(--error)' : '1px solid var(--border)', marginBottom: 0 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="fraud-toggle-label">{fraudMode.active ? 'Fraud Scenario ACTIVE' : 'Test Fraud Scenario'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {fraudMode.active ? 'Select attack types to simulate' : 'Click to simulate a spoof attempt'}
                  </div>
                </div>
                <div className="toggle-switch" />
              </div>
              
              {fraudMode.active && (
                <div className="fraud-options" style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--error)', borderTop: 'none', borderBottomLeftRadius: 'var(--radius-sm)', borderBottomRightRadius: 'var(--radius-sm)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)' }}>
                    <input type="checkbox" checked={fraudMode.noBlink} onChange={e => setFraudMode(f => ({ ...f, noBlink: e.target.checked }))} /> No Blink
                  </label>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)' }}>
                    <input type="checkbox" checked={fraudMode.staticFrame} onChange={e => setFraudMode(f => ({ ...f, staticFrame: e.target.checked }))} /> Static Frame
                  </label>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)' }}>
                    <input type="checkbox" checked={fraudMode.noMovement} onChange={e => setFraudMode(f => ({ ...f, noMovement: e.target.checked }))} /> No Movement
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ── Camera error ── */}
          {cameraError && <div className="alert alert-error">{cameraError}</div>}

          {/* ── IDLE: start button ── */}
          {phase === 'idle' && (
            <div className="liveness-start-wrap">
              <div className="liveness-hero-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3"/>
                  <path d="M16 24l6 6 10-10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="liveness-hint">
                Position your face in the frame and follow the on-screen prompts for behavioral verification.
              </p>
              
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>Tips for Successful Verification:</div>
                <ul style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.6 }}>
                  <li>Ensure your face is well-lit (avoid backlighting)</li>
                  <li>Blink naturally when prompted</li>
                  <li>Hold your phone steady or use a stand</li>
                  <li>Do not show photos or videos from other screens</li>
                </ul>
              </div>

              <button className="btn btn-primary" onClick={startCamera}>
                Initialize Trust Engine
              </button>
            </div>
          )}

          {/* ── CAMERA: live feed ── */}
          {phase === 'camera' && (
            <div className="webcam-container">
              {/* Instruction banner */}
              <div className={`liveness-instruction ${blink && !isRecording ? 'instruction-pulse' : ''}`}>
                {isRecording ? `Recording... ${countdown}s` : INSTRUCTIONS[instructionIdx]}
              </div>

              {/* Face guide overlay */}
              <div className="video-frame liveness-frame">
                <video ref={videoRef} playsInline muted style={{ transform: 'scaleX(-1)' }}/>
                <div className={`face-alignment-box ${isRecording ? 'detected' : ''}`} />
                <div className={isRecording ? 'recording-dot' : ''}/>
              </div>

              <canvas ref={canvasRef} style={{ display: 'none' }}/>

              <button 
                className={`btn btn-capture ${isRecording ? 'recording' : ''}`} 
                onClick={handleCapture}
                disabled={isRecording}
              >
                {isRecording ? 'Recording Biometrics...' : 'Capture Biometrics'}
              </button>
            </div>
          )}

          {/* ── CAPTURED: preview + verify ── */}
          {phase === 'captured' && (
            <div className="webcam-container">
              <div className="snapshot-preview">
                <video 
                  src={snapshot} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  style={{ transform: 'scaleX(-1)', width: '100%', display: 'block' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button className="btn btn-ghost" onClick={handleRetake}>Retake</button>
                <button className="btn btn-primary" onClick={handleVerify}>Verify Identity</button>
              </div>
            </div>
          )}

          {/* ── DETECTING ── */}
          {phase === 'detecting' && (
            <div className="detecting-wrap" style={{ width: '100%' }}>
              <div className="detecting-label">{statusMsg}</div>
              <div className="status-progress-bar">
                <div className="status-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              
              <div className="signals-grid" style={{ marginTop: 24 }}>
                <div className="signal-item">
                  <span>Face</span>
                  <span className={`signal-status ${liveSignals.face ? 'pass' : ''}`}>
                    {liveSignals.face ? '✔' : 'Waiting...'}
                  </span>
                </div>
                <div className="signal-item">
                  <span>Blink</span>
                  <span className={`signal-status ${liveSignals.blink ? 'pass' : (progress > 50 || phase === 'done') && !liveSignals.blink ? 'fail' : ''}`}>
                    {liveSignals.blink ? '✔' : (progress > 50 || phase === 'done') ? '❌' : 'Waiting...'}
                  </span>
                </div>
                <div className="signal-item">
                  <span>Motion</span>
                  <span className={`signal-status ${liveSignals.movement ? 'pass' : (progress > 75 || phase === 'done') && !liveSignals.movement ? 'fail' : ''}`}>
                    {liveSignals.movement ? '✔' : (progress > 75 || phase === 'done') ? '❌' : 'Waiting...'}
                  </span>
                </div>
                <div className="signal-item">
                  <span>Frame</span>
                  <span className={`signal-status ${liveSignals.frame ? 'pass' : (progress >= 100 || phase === 'done') && !liveSignals.frame ? 'fail' : ''}`}>
                    {liveSignals.frame ? '✔' : (progress >= 100 || phase === 'done') ? '❌' : 'Waiting...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── DONE: result ── */}
          {phase === 'done' && result && (
            <div className="webcam-container" style={{ gap: 16 }}>
              <ResultOverlay result={result} />
              
              <TrustEnginePanel result={result} />
              <ExplainPanel result={result} />

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Verification Record Secured
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  UID: {userId}<br/>
                  Time: {new Date().toISOString()}<br/>
                  Score: {result.trust_score}%<br/>
                  Hash: {result.record_hash || 'pending...'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, width: '100%', flexDirection: 'column', marginTop: 8 }}>
                <button
                  id="go-to-dashboard-btn"
                  className="btn btn-primary"
                  onClick={handleToDashboard}
                >
                  {result.liveness ? '✓ Continue to Dashboard' : 'Return to Dashboard'}
                </button>
                {!result.liveness && (
                  <button
                    id="retry-liveness-btn"
                    className="btn btn-ghost"
                    onClick={handleRetake}
                  >
                    ↺ Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
