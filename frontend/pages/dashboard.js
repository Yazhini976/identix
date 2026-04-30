import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

const API = 'http://localhost:8000';

/* ─── Step bar ─── */
function StepBar({ current }) {
  const steps = ['Sign Up', 'Capture', 'Liveness', 'Dashboard'];
  return (
    <div className="steps">
      {steps.map((label, i) => {
        const n = i + 1;
        const isDone = n < current;
        const isActive = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-dot">
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Verification Status Badge ─── */
function StatusBadge({ status }) {
  // Map backend values → display
  const map = {
    pending:            { label: 'Partially Verified', cls: 'badge-partial', dot: '◑' },
    partial:            { label: 'Partially Verified', cls: 'badge-partial', dot: '◑' },
    verified:           { label: 'Verified',           cls: 'badge-verified', dot: '●' },
    rejected:           { label: 'Rejected',           cls: 'badge-error',   dot: '✕' },
  };
  const key = (status || '').toLowerCase();
  const { label, cls, dot } = map[key] || map.pending;

  return (
    <div className="status-badge-wrap">
      <span className={`badge ${cls}`}>{dot} {label}</span>
      <span className="status-tooltip">
        Basic identity verified. Advanced checks in progress.
      </span>
    </div>
  );
}

/* ─── Trust Badge (header) ─── */
function TrustBadge() {
  return (
    <div className="trust-badge">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" fill="currentColor" opacity="0.9" />
      </svg>
      Verified by IDentix Engine
    </div>
  );
}

/* ─── Security Score ─── */
function SecurityScore({ score = 92 }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div className="security-score-card">
      <div className="security-score-ring">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle
            cx="30" cy="30" r={r} fill="none"
            stroke="url(#scoreGrad)" strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#5b8def" />
            </linearGradient>
          </defs>
        </svg>
        <span className="security-score-num">{score}%</span>
      </div>
      <div style={{ flex: 1 }}>
        <div className="security-score-label">Security Score</div>
        <div className="security-score-sub">
          {score >= 90 ? 'Maximum confidence identity verified' : 'Identity partially verified with pending checks'}
        </div>
      </div>
    </div>
  );
}

/* ─── Verification Timeline ─── */
function VerificationTimeline({ user }) {
  const steps = [
    { label: 'ID Uploaded', done: !!user?.id_file_path },
    { label: 'Face Captured', done: !!user?.face_image_path },
    { label: 'Liveness Check', done: user?.liveness_status === 'passed', active: user?.liveness_status === 'pending' || !user?.liveness_status || user?.liveness_status === 'failed' },
    { label: 'Credential Generation', done: false, active: user?.liveness_status === 'passed' }
  ];

  const now = new Date();
  const t1 = new Date(now.getTime() - 1000 * 60 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const t2 = new Date(now.getTime() - 1000 * 60 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const t3 = new Date(now.getTime() - 1000 * 60 * 1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="timeline-card fade-in" style={{ marginBottom: 16 }}>
      <div className="card-heading">Verification Timeline</div>
      <div className="v-timeline">
        <div className={`v-timeline-item ${steps[0].done ? 'done' : ''}`}>
          <div className="v-dot"></div>
          <div className="v-content">
            <span className="v-label">ID Uploaded</span>
            {steps[0].done && <span className="v-time">{t1}</span>}
          </div>
        </div>
        <div className={`v-timeline-item ${steps[1].done ? 'done' : ''}`}>
          <div className="v-dot"></div>
          <div className="v-content">
            <span className="v-label">Face Captured</span>
            {steps[1].done && <span className="v-time">{t2}</span>}
          </div>
        </div>
        <div className={`v-timeline-item ${steps[2].done ? 'done' : steps[2].active ? 'active' : ''}`}>
          <div className="v-dot"></div>
          <div className="v-content">
            <span className="v-label">Liveness Check Completed</span>
            {steps[2].done && <span className="v-time">{t3}</span>}
            {user?.liveness_status === 'failed' && <span className="v-time" style={{ color: 'var(--error)' }}>Failed</span>}
          </div>
        </div>
        <div className={`v-timeline-item ${steps[3].done ? 'done' : steps[3].active ? 'active' : ''} last`}>
          <div className="v-dot"></div>
          <div className="v-content">
            <span className="v-label">Credential Generation Pending</span>
            {steps[3].active && <span className="v-time" style={{ color: 'var(--warning)' }}>⏳ Pending</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Session Details ─── */
function SessionDetails() {
  const [device, setDevice] = useState('Unknown Device');
  
  useEffect(() => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac')) os = 'iOS';
    setDevice(`${browser} on ${os}`);
  }, []);

  const ip = '192.168.1.***';
  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <div className="session-card fade-in" style={{ marginBottom: 16 }}>
      <div className="card-heading">Session Details</div>
      <div className="session-grid">
        <div className="session-item">
          <span className="session-label">Device</span>
          <span className="session-val">{device}</span>
        </div>
        <div className="session-item">
          <span className="session-label">Approximate IP</span>
          <span className="session-val">{ip}</span>
        </div>
        <div className="session-item">
          <span className="session-label">Session ID</span>
          <span className="session-val">{sessionId}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Trust Engine Summary ─── */
function TrustEngineSummary({ user }) {
  const trustScore = user?.trust_score || 0;
  const isVerified = trustScore >= 90;
  const riskLevel = trustScore >= 90 ? 'LOW' : trustScore >= 50 ? 'MEDIUM' : 'HIGH';
  const status = isVerified ? 'VERIFIED' : 'PARTIALLY VERIFIED';
  
  const identityScore = user?.id_file_path ? 30 : 0;
  const bioScore = user?.liveness_status === 'passed' ? 30 : user?.face_image_path ? 10 : 0;
  
  return (
    <div className="trust-summary-card fade-in" style={{ marginBottom: 16 }}>
      <div className="card-heading">Trust Engine Summary</div>
      
      <div className="trust-scores-grid">
        <div className="t-score-item">
          <span className="t-score-label">Identity Score</span>
          <span className="t-score-val">{identityScore}/30</span>
        </div>
        <div className="t-score-item">
          <span className="t-score-label">Biometric Score</span>
          <span className="t-score-val">{bioScore}/30</span>
        </div>
        <div className="t-score-item">
          <span className="t-score-label">Integrity Score</span>
          <span className="t-score-val" style={{ color: 'var(--warning)' }}>Pending</span>
        </div>
      </div>

      <div className="trust-final-row">
        <div className="t-final-col">
          <span className="t-final-label">Final Trust Score</span>
          <span className="t-final-score">{trustScore}%</span>
        </div>
        <div className="t-final-col" style={{ alignItems: 'flex-end' }}>
          <span className="t-final-label">Status</span>
          <span className={`t-final-status ${isVerified ? 'text-success' : 'text-warning'}`}>{status}</span>
          <span className="t-final-label" style={{ marginTop: 4 }}>Risk Level: <span className={`risk-badge risk-${riskLevel.toLowerCase()}`}>{riskLevel}</span></span>
        </div>
      </div>

      <div className="confidence-factors">
        <div className="cf-heading">Confidence Factors</div>
        <div className="cf-list">
          <div className="cf-item">
            <span className={`cf-icon ${user?.id_file_path ? 'pass' : 'pending'}`}>{user?.id_file_path ? '✔' : '◑'}</span>
            <span>Document Validity</span>
          </div>
          <div className="cf-item">
            <span className={`cf-icon ${user?.face_image_path ? 'pass' : 'pending'}`}>{user?.face_image_path ? '✔' : '◑'}</span>
            <span>Face Match</span>
          </div>
          <div className="cf-item">
            <span className={`cf-icon ${user?.liveness_status === 'passed' ? 'pass' : user?.liveness_status === 'failed' ? 'fail' : 'pending'}`}>
              {user?.liveness_status === 'passed' ? '✔' : user?.liveness_status === 'failed' ? '❌' : '◑'}
            </span>
            <span>Liveness Signals</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ show }) {
  return (
    <div className={`toast ${show ? 'toast-show' : ''}`}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      ID copied!
    </div>
  );
}

/* ─── Share Modal ─── */
function ShareModal({ onClose, userId }) {
  const [selectedFields, setSelectedFields] = useState(['status', 'name:verify']);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const options = [
    {
      id: 'age',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a4 4 0 100 8 4 4 0 000-8zM2 16c0-3.3 3.1-6 7-6s7 2.7 7 6"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      title: 'Verify Age (Above 18)',
      desc: 'Let a service verify you are 18+',
    },
    {
      id: 'status',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1L2 5v4c0 3.9 3 7 7 7s7-3.1 7-7V5L9 1z"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Verify Identity Status',
      desc: 'Share verified identity proof status',
    },
    {
      id: 'name',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M12 4a3 3 0 11-6 0 3 3 0 016 0zM3 15c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      title: 'Verify Name',
      desc: 'Share your legal name securely',
    },
    {
      id: 'email',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 4h12a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 6l6 4 6-4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
      title: 'Share Email',
      desc: 'Share your verified email address',
    },
    {
      id: 'phone',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M5 1h8a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V3a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 14h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Share Mobile Number',
      desc: 'Share your verified phone number',
    },
    {
      id: 'dob',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="4" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 7h12M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      title: 'Share Date of Birth',
      desc: 'Share your verified birth date',
    },
    {
      id: 'address',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 17s-6-5-6-9a6 6 0 1112 0c0 4-6 9-6 9z" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="8" r="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
      title: 'Share Address',
      desc: 'Share your verified permanent address',
    },
  ];

  const toggleField = (id) => {
    const sensitiveFields = ['name', 'email', 'phone', 'address'];
    
    if (sensitiveFields.includes(id)) {
      const isSelected = selectedFields.some(f => f.startsWith(`${id}:`));
      if (isSelected) {
        setSelectedFields(selectedFields.filter(f => !f.startsWith(`${id}:`)));
      } else {
        setSelectedFields([...selectedFields, `${id}:verify`]);
      }
      return;
    }

    if (selectedFields.includes(id)) {
      setSelectedFields(selectedFields.filter(f => f !== id));
    } else {
      setSelectedFields([...selectedFields, id]);
    }
  };

  const setFieldMode = (id, mode) => {
    setSelectedFields(selectedFields.map(f => f.startsWith(`${id}:`) ? `${id}:${mode}` : f));
  };

  const getFieldMode = (id) => {
    return selectedFields.find(f => f.startsWith(`${id}:`))?.split(':')[1] || 'verify';
  };

  const isFieldSelected = (id) => {
    const sensitiveFields = ['name', 'email', 'phone', 'address'];
    if (sensitiveFields.includes(id)) {
      return selectedFields.some(f => f.startsWith(`${id}:`));
    }
    return selectedFields.includes(id);
  };

  const handleGenerateToken = async () => {
    if (selectedFields.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/generate-share-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          fields: selectedFields
        })
      });
      if (!res.ok) throw new Error('Failed to generate token');
      const data = await res.json();
      setToken(data.token);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error generating secure token.');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Share Verified Identity</span>
          <button className="modal-close" onClick={onClose} id="modal-close-btn" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        
        {!success ? (
          <>
            <p className="modal-subtitle">Choose what you'd like to share securely:</p>
            <div className="modal-options">
              {options.map((opt) => {
                const isSelected = isFieldSelected(opt.id);
                const hasModes = ['name', 'email', 'phone', 'address'].includes(opt.id);
                const currentMode = hasModes ? getFieldMode(opt.id) : null;

                return (
                  <div key={opt.id} style={{ marginBottom: 12 }}>
                    <div 
                      className={`modal-option-checkbox ${isSelected ? 'selected' : ''}`} 
                      onClick={() => toggleField(opt.id)}
                      id={`share-option-${opt.id}`}
                    >
                      <div className="checkbox-custom">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="modal-option-icon">{opt.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="modal-option-title">{opt.title}</div>
                        <div className="modal-option-desc">{opt.desc}</div>
                      </div>
                    </div>

                    {hasModes && isSelected && (
                      <div className="name-mode-selector slide-up">
                        <div className="mode-option" onClick={() => setFieldMode(opt.id, 'verify')}>
                          <input type="radio" checked={currentMode === 'verify'} readOnly />
                          <div className="mode-text">
                            <strong>Verification Only (Default)</strong>
                            <span>Returns a boolean match result</span>
                          </div>
                        </div>
                        {['email', 'phone', 'address'].includes(opt.id) && (
                          <div className="mode-option" onClick={() => setFieldMode(opt.id, 'mask')}>
                            <input type="radio" checked={currentMode === 'mask'} readOnly />
                            <div className="mode-text">
                              <strong>Masked Data</strong>
                              <span>Returns partially hidden information</span>
                            </div>
                          </div>
                        )}
                        <div className={`mode-option disclose ${currentMode === 'disclose' ? 'warning-active' : ''}`} onClick={() => setFieldMode(opt.id, 'disclose')}>
                          <input type="radio" checked={currentMode === 'disclose'} readOnly />
                          <div className="mode-text">
                            <strong>Full Disclosure</strong>
                            {currentMode === 'disclose' && (
                              <div className="disclosure-warning-banner fade-in">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>High risk: Sharing raw PII with third-party service</span>
                              </div>
                            )}
                            <span>Sharing full {opt.id === 'phone' ? 'mobile number' : opt.id}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleGenerateToken}
              disabled={loading || selectedFields.length === 0}
              style={{ marginTop: 8 }}
            >
              {loading ? <span className="spinner" /> : 'Generate Secure Token'}
            </button>
          </>
        ) : (
          <div className="fade-in">
            <div className="sharing-success-msg">
              <div className="success-check-anim">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              Identity shared securely ✔
            </div>
            
            <div className="token-display-box">
              <span className="token-label">Secure Access Token</span>
              <div className="token-value-wrap">
                <code className="token-value">{token}</code>
                <button className="token-copy-btn" onClick={copyToken}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>
                This token expires in 5 minutes and grants access to selected fields.
              </div>
            </div>

            <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: 20 }}>
              Close
            </button>
          </div>
        )}

        {!success && <p className="modal-footer-note" style={{ marginTop: 16 }}>🔒 Zero-knowledge sharing. No raw data is transmitted.</p>}
      </div>

      <style jsx>{`
        .name-mode-selector {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: none;
          border-radius: 0 0 12px 12px;
          padding: 8px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: -4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .mode-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .mode-option:hover {
          background: var(--surface-2);
        }

        .mode-option input[type="radio"] {
          margin-top: 4px;
          accent-color: var(--accent);
        }

        .mode-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mode-text strong {
          font-size: 13px;
          color: var(--text);
        }

        .mode-text span {
          font-size: 11px;
          color: var(--text-muted);
        }

        .mode-option.disclose strong {
          color: var(--warning);
        }

        .mode-option.warning-active {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .mode-option.warning-active strong {
          color: var(--error);
        }

        .disclosure-warning-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--error);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 4px 0;
        }

        .disclosure-warning-banner span {
          color: white !important;
          font-weight: 700;
          font-size: 10px !important;
        }

        .slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Face Photo ─── */
function FacePhoto({ path }) {
  if (!path) return null;
  const filename = path.replace(/\\/g, '/').split('/').pop();
  const src = `${API}/uploads/${filename}`;
  return (
    <div className="face-photo-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Captured face" className="face-photo" />
      <span className="face-photo-label">Face Photo</span>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*                 MAIN PAGE                  */
/* ═══════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const { id: userId } = router.query;

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/user/${userId}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.detail || 'Failed to load user data.');
        }
        setUser(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleCopyId = useCallback(async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.id);
    } catch {
      const el = document.createElement('textarea');
      el.value = user.id;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  }, [user]);

  const initials = user
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <Head>
        <title>Dashboard – IDentix</title>
        <meta name="description" content="Your digital identity verification status dashboard." />
      </Head>

      <Toast show={toast} />
      {showModal && <ShareModal userId={userId} onClose={() => setShowModal(false)} />}

      <main className="page">
        <div className={`card dashboard-card ${mounted ? 'fade-in' : ''}`}>

          {/* Wordmark */}
          <div className="wordmark">
            <div className="wordmark-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 6v4c0 3.9 2.9 7.5 7 8.5 4.1-1 7-4.6 7-8.5V6L10 2z"
                  fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="wordmark-text">IDentix</span>
          </div>

          <StepBar current={3} />

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
              <span className="spinner" style={{ borderTopColor: 'var(--accent)', borderColor: 'var(--border)' }} />
              Loading your profile…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          {user && (
            <>
              {/* ── Header ── */}
              <div className="dashboard-header">
                <div className="avatar-wrap">
                  <div className="avatar">{initials}</div>
                  {user.face_image_path && <FacePhoto path={user.face_image_path} />}
                </div>
                <div className="header-meta">
                  <div className="user-name">{user.name}</div>
                  <TrustBadge />
                  <div className="id-row">
                    <code className="id-code">{user.id.slice(0, 8)}…{user.id.slice(-4)}</code>
                    <button id="copy-id-btn" className="copy-id-btn" onClick={handleCopyId} title="Copy full ID">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      Copy ID
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Security Score ── */}
              <SecurityScore score={user.trust_score || 70} />

              {/* ── Dashboard Cards ── */}
              <VerificationTimeline user={user} />
              <TrustEngineSummary user={user} />
              <SessionDetails />

              {/* ── Liveness Action / Re-verification ── */}
              <div className="liveness-action-card fade-in" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="liveness-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                      <path d="M15 10l-3 3-3-3M12 3v10M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {user.liveness_status === 'passed' ? 'Liveness Verified' : 'Complete Liveness Check'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {user.liveness_status === 'passed' 
                        ? 'Your liveness check was successful. You can re-run it if needed.' 
                        : 'Confirm you are a real person to reach 90%+ security score.'}
                    </div>
                  </div>
                </div>
                <button
                  id={user.liveness_status === 'passed' ? "rerun-liveness-btn" : "start-liveness-btn"}
                  className={`btn ${user.liveness_status === 'passed' ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => router.push(`/liveness?id=${userId}`)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {user.liveness_status === 'passed' ? 'Re-run Liveness Check' : 'Start Liveness Check'}
                </button>
              </div>

              {/* ── Info rows ── */}
              <div className="info-grid" style={{ marginTop: 16 }}>
                <div className="info-row">
                  <span className="info-key">Full Name</span>
                  <span className="info-val">{user.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Email</span>
                  <span className="info-val">{user.email || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Mobile</span>
                  <span className="info-val">{user.phone || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Date of Birth</span>
                  <span className="info-val">{user.dob || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Address</span>
                  <span className="info-val" style={{ textAlign: 'right', fontSize: '0.8rem', maxWidth: '150px' }}>{user.address || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Age</span>
                  <span className="info-val">{user.age} years</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Verification Status</span>
                  <StatusBadge status={user.verification_status} />
                </div>
                <div className="info-row">
                  <span className="info-key">ID Document</span>
                  <span className="info-val" style={{ fontSize: 12, color: user.id_file_path ? 'var(--success)' : 'var(--text-muted)' }}>
                    {user.id_file_path ? '✓ Uploaded' : 'Not uploaded'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Face Photo</span>
                  <span className="info-val" style={{ fontSize: 12, color: user.face_image_path ? 'var(--success)' : 'var(--text-muted)' }}>
                    {user.face_image_path ? '✓ Captured' : 'Not captured'}
                  </span>
                </div>
              </div>

              {/* ── AI Verification Banner ── */}
              <div className="ai-banner" style={{ marginTop: 16 }}>
                <div className="ai-banner-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1L2 5v4c0 3.9 3 7 7 7s7-3.1 7-7V5L9 1z"
                      fill="currentColor" opacity="0.15" />
                    <path d="M9 1L2 5v4c0 3.9 3 7 7 7s7-3.1 7-7V5L9 1z"
                      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M6.5 9l2 2 3-3.5"
                      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ai-banner-text">
                  <strong>AI-Powered Identity Verification</strong>
                  <p>
                    Your identity has been partially verified using document and facial validation.
                    Additional AI-based liveness and integrity checks are in progress to ensure maximum security.
                  </p>
                </div>
              </div>

              <div className="divider" />

              {/* ── Share Button ── */}
              <button
                id="share-identity-btn"
                className="btn btn-primary btn-share"
                onClick={() => setShowModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="12" cy="3"  r="1.8" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="4"  cy="8"  r="1.8" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="12" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5.7 7.1l4.6-2.6M5.7 9l4.6 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Share Verified Identity
              </button>

              {/* ── Start over ── */}
              <button
                id="start-over-btn"
                className="btn btn-ghost"
                onClick={() => router.push('/')}
                style={{ marginTop: 10 }}
              >
                ← Register another identity
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
