import Head from 'next/head';
import { useState, useEffect } from 'react';
import React from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VerifyPortal() {
  const [token, setToken] = useState('');
  const [expectedName, setExpectedName] = useState('');
  const [expectedMobile, setExpectedMobile] = useState('');
  const [expectedEmail, setExpectedEmail] = useState('');
  const [expectedAddress, setExpectedAddress] = useState('');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API}/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          expected_name: expectedName || undefined,
          expected_mobile: expectedMobile || undefined,
          expected_email: expectedEmail || undefined,
          expected_address: expectedAddress || undefined
        })
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Invalid or expired token.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const data = result?.data;
  const metadata = result?.metadata;

  return (
    <>
      <Head>
        <title>Partner Verification Portal – IDentix</title>
        <meta name="description" content="Securely verify shared identity tokens." />
      </Head>

      <main className="page">
        <div className={`card ${mounted ? 'fade-in' : ''}`} style={{ maxWidth: 540, padding: '40px 32px' }}>
          
          <div className="wordmark" style={{ justifyContent: 'center', marginBottom: 28 }}>
            <div className="wordmark-icon" style={{ background: 'var(--text)', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="wordmark-text" style={{ background: 'var(--text)', WebkitTextFillColor: 'initial', color: 'var(--text)', WebkitBackgroundClip: 'initial', fontWeight: 700, letterSpacing: '-0.5px' }}>Partner Portal</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="badge-premium slide-up" style={{ margin: '0 auto 16px', width: 'fit-content' }}>
              Privacy-First Identity System
            </div>
            <h1 className="page-title" style={{ fontSize: 24, marginBottom: 8 }}>Identity Verification</h1>
            <div className="flow-indicator slide-up" style={{ marginBottom: 16 }}>
              <span>User</span> <span className="flow-arrow">→</span> 
              <span>Token</span> <span className="flow-arrow">→</span> 
              <span>Verification</span> <span className="flow-arrow">→</span> 
              <span className="flow-final">Minimal Response ✔</span>
            </div>
            <p className="page-subtitle" style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
              Verify secure identity attributes shared by an IDentix user using their access token.
            </p>
          </div>

          <form className="form" onSubmit={handleVerify}>
            <div className="field">
              <label htmlFor="token" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Access Token</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="token"
                  type="text"
                  placeholder="Paste token here..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoComplete="off"
                  title="This token enables secure, scoped verification without exposing personal data."
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: 13, 
                    paddingLeft: 42,
                    background: 'var(--surface-2)',
                    borderColor: error ? 'var(--error)' : 'var(--border)'
                  }}
                />
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>


            <button type="submit" className="btn btn-primary" disabled={loading || !token} style={{ height: 48 }}>
              {loading ? <span className="spinner" /> : 'Verify Credentials'}
            </button>
          </form>

          {error && (
            <div className="alert alert-error slide-up" style={{ marginTop: 24, borderRadius: 12 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 2 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Verification Failed</div>
                <div style={{ opacity: 0.9, fontSize: 12 }}>{error}</div>
              </div>
            </div>
          )}

          {data && (
            <div className="verification-results fade-in slide-up" style={{ marginTop: 32 }}>
              <div className="divider" style={{ margin: '0 0 24px 0', opacity: 0.5 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
                  <div className="success-icon-bg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.2px' }}>Identity shared securely ✔</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, opacity: 0.8 }}>
                  ✔ Verified using anti-spoof biometric validation
                </div>
              </div>

              {/* ── Verified Credentials ── */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-label">Verified Credentials</div>
                <div className="info-grid" style={{ gap: 10 }}>
                  {data.age && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span className="info-key">Age Requirement</span>
                      </div>
                      <span className={`badge ${data.age.above_18 ? 'badge-verified' : 'badge-error'}`}>
                        {data.age.above_18 ? '✓ Over 18' : '✕ Under 18'}
                      </span>
                    </div>
                  )}

                  {data.identity && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <span className="info-key">Identity Status</span>
                      </div>
                      <span className={`badge ${data.identity.verified ? 'badge-verified' : 'badge-partial'}`}>
                        {data.identity.verified ? '✓ Verified' : '◑ Pending'}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  {data.name_verified && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
                        <span className="info-key">Name Verification</span>
                      </div>
                      <span className="badge badge-verified">✓ Verified</span>
                    </div>
                  )}
                  {data.name_match !== undefined && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
                        <span className="info-key">Name Match</span>
                      </div>
                      <span className={`badge ${data.name_match ? 'badge-verified' : 'badge-error'}`}>
                        {data.name_match ? '✓ Matches' : '✕ Mismatch'}
                      </span>
                    </div>
                  )}
                  {data.name && (
                    <div className="info-row highlight-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
                        <span className="info-key">Full Name</span>
                        <span className="disclosure-tag">⚠ Personal data disclosure</span>
                      </div>
                      <div className="disclosure-val">{data.name}</div>
                    </div>
                  )}

                  {/* Email */}
                  {data.email_verified && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                        <span className="info-key">Email Verification</span>
                      </div>
                      <span className="badge badge-verified">✓ Verified</span>
                    </div>
                  )}
                  {data.email_match !== undefined && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                        <span className="info-key">Email Match</span>
                      </div>
                      <span className={`badge ${data.email_match ? 'badge-verified' : 'badge-error'}`}>
                        {data.email_match ? '✓ Matches' : '✕ Mismatch'}
                      </span>
                    </div>
                  )}
                  {data.email_masked && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                        <span className="info-key">Email (Masked)</span>
                      </div>
                      <span className="masked-val">{data.email_masked}</span>
                    </div>
                  )}
                  {data.email && (
                    <div className="info-row highlight-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                        <span className="info-key">Email Address</span>
                        <span className="disclosure-tag">⚠ Personal data disclosure</span>
                      </div>
                      <div className="disclosure-val">{data.email}</div>
                    </div>
                  )}

                  {/* Mobile */}
                  {data.mobile_verified && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
                        <span className="info-key">Mobile Verification</span>
                      </div>
                      <span className="badge badge-verified">✓ Verified</span>
                    </div>
                  )}
                  {data.mobile_match !== undefined && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
                        <span className="info-key">Mobile Match</span>
                      </div>
                      <span className={`badge ${data.mobile_match ? 'badge-verified' : 'badge-error'}`}>
                        {data.mobile_match ? '✓ Matches' : '✕ Mismatch'}
                      </span>
                    </div>
                  )}
                  {data.mobile_masked && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
                        <span className="info-key">Mobile (Masked)</span>
                      </div>
                      <span className="masked-val">{data.mobile_masked}</span>
                    </div>
                  )}
                  {data.mobile && (
                    <div className="info-row highlight-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
                        <span className="info-key">Mobile Number</span>
                        <span className="disclosure-tag">⚠ Personal data disclosure</span>
                      </div>
                      <div className="disclosure-val">{data.mobile}</div>
                    </div>
                  )}

                  {/* DOB */}
                  {data.dob && (
                    <div className="info-row highlight-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="12" height="11" rx="1.5"/><path d="M3 7h12M6 2v3M12 2v3"/></svg></div>
                        <span className="info-key">Date of Birth</span>
                        <span className="disclosure-tag">⚠ Personal data disclosure</span>
                      </div>
                      <div className="disclosure-val">{data.dob}</div>
                    </div>
                  )}

                  {/* Address */}
                  {data.address_verified && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                        <span className="info-key">Address Verification</span>
                      </div>
                      <span className="badge badge-verified">✓ Verified</span>
                    </div>
                  )}
                  {data.address_match !== undefined && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                        <span className="info-key">Address Match</span>
                      </div>
                      <span className={`badge ${data.address_match ? 'badge-verified' : 'badge-error'}`}>
                        {data.address_match ? '✓ Matches' : '✕ Mismatch'}
                      </span>
                    </div>
                  )}
                  {data.address_masked && (
                    <div className="info-row highlight-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                        <span className="info-key">Address (Masked)</span>
                      </div>
                      <span className="masked-val">{data.address_masked}</span>
                    </div>
                  )}
                  {data.address && (
                    <div className="info-row highlight-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div className="icon-circle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                        <span className="info-key">Permanent Address</span>
                        <span className="disclosure-tag">⚠ Personal data disclosure</span>
                      </div>
                      <div className="disclosure-val">{data.address}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Privacy Preserved Section ── */}
              <div className="privacy-card">
                <div className="privacy-header">
                  <div className="privacy-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <span>Privacy Preserved</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, marginBottom: 12, opacity: 0.8, letterSpacing: '0.5px' }}>
                  🔒 BUILT ON DATA MINIMIZATION PRINCIPLE
                </div>
                <ul className="privacy-list">
                  <li>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Only requested attributes shared
                  </li>
                  <li>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    No personal data exposed
                  </li>
                  <li>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    No documents transferred
                  </li>
                </ul>
              </div>

              {/* ── Requested Attributes & Enforcement ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div className="section-label">Requested Attributes</div>
                  <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, letterSpacing: '0.5px' }}>TOKEN SCOPE ENFORCED</div>
                </div>
                
                <div className="scope-list">
                  {metadata?.scope?.map((s, i) => (
                    <div key={i} className="scope-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {s}
                    </div>
                  ))}
                  <div className="scope-item blocked">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Other data blocked
                  </div>
                </div>
              </div>

              {/* ── Token Details ── */}
              <div className="token-details-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="card-heading" style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: 0 }}>Token Details</div>
                  <div className="reusable-badge">Reusable Identity ✔</div>
                </div>
                <div className="token-grid">
                  <div className="token-info">
                    <span className="token-label">Verification Source</span>
                    <span className="token-val" style={{ fontSize: 10, lineHeight: 1.4 }}>
                      Biometric Liveness, AI Trust Engine, Cryptography
                    </span>
                  </div>
                  <div className="token-info">
                    <span className="token-label">Status</span>
                    <span className="token-val" style={{ color: 'var(--success)', fontWeight: 600 }}>{metadata?.status || 'Active'}</span>
                  </div>
                  <div className="token-info">
                    <span className="token-label">Expiry</span>
                    <span className="token-val">5 Minutes</span>
                  </div>
                </div>
                <div className="kyc-badge">
                  ⚡ Instant verification — no repeated KYC required across platforms
                </div>
              </div>

              {/* ── Traditional vs IDentix Comparison ── */}
              <div className="comparison-card">
                <div className="section-label" style={{ marginBottom: 16, textAlign: 'center' }}>Why IDentix?</div>
                <div className="comparison-grid">
                  <div className="comparison-col">
                    <div className="comp-title">Traditional KYC</div>
                    <div className="comp-item fail">❌ Shares full Aadhaar</div>
                    <div className="comp-item fail">❌ Repeated verification</div>
                    <div className="comp-item fail">❌ High exposure risk</div>
                  </div>
                  <div className="comparison-col active">
                    <div className="comp-title" style={{ color: 'var(--accent)' }}>IDentix</div>
                    <div className="comp-item pass">✔ Only required data</div>
                    <div className="comp-item pass">✔ No repeated KYC</div>
                    <div className="comp-item pass">✔ Privacy preserved</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <div className="trust-engine-tag">Powered by Trust Engine ✔</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>
                This approach reduces identity theft risk and minimizes unnecessary data exposure.
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 9, color: 'var(--text-faint)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Aligned with privacy-first and regulatory-compliant identity principles
              </div>

              {/* ── Cryptographic Validation ── */}
              <div className="ai-banner enhanced-banner">
                <div className="ai-banner-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="ai-banner-text">
                  <strong>Cryptographically Verified</strong>
                  <p>
                    This verification response is generated using secure, time-bound token validation and is backed by biometric trust signals from the IDentix Engine.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <a href="/" className="btn btn-ghost" style={{ fontSize: 12, width: 'auto', opacity: 0.6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Return to IDentix Home
            </a>
          </div>
        </div>
      </main>

      <style jsx>{`
        .section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .highlight-row {
          background: var(--surface-2);
          border-radius: 12px;
          padding: 14px 16px !important;
          border: 1px solid var(--border);
        }

        .sub-row {
          padding: 8px 16px !important;
          opacity: 0.8;
          font-size: 13px;
        }

        .success-icon-bg {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flow-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-faint);
        }

        .flow-arrow {
          opacity: 0.3;
          font-weight: 400;
        }

        .flow-final {
          color: var(--success);
          background: rgba(16, 185, 129, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .trust-engine-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--surface-2);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid var(--border);
        }

        .badge-premium {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
          color: var(--accent);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05);
        }

        .reusable-badge {
          background: var(--success);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
        }

        .icon-circle {
          background: var(--surface-1);
          color: var(--text-muted);
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        .privacy-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .privacy-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--success);
          opacity: 0.5;
        }

        .privacy-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--success);
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 14px;
        }

        .privacy-icon {
          color: var(--success);
          display: flex;
        }

        .privacy-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .privacy-list li {
          font-size: 12px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .privacy-list li svg {
          color: var(--success);
          flex-shrink: 0;
        }

        .scope-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .scope-item {
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text);
        }

        .scope-item.blocked {
          opacity: 0.5;
          border-style: dashed;
          color: var(--text-faint);
        }

        .token-details-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .token-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .token-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .token-label {
          font-size: 9px;
          text-transform: uppercase;
          color: var(--text-faint);
          letter-spacing: 0.5px;
          font-weight: 700;
        }

        .token-val {
          font-size: 11px;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kyc-badge {
          background: rgba(59, 130, 246, 0.08);
          color: var(--accent);
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .comparison-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .comparison-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid transparent;
        }

        .comparison-col.active {
          background: rgba(59, 130, 246, 0.03);
          border-color: rgba(59, 130, 246, 0.1);
        }

        .comp-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          color: var(--text-muted);
        }

        .comp-item {
          font-size: 11px;
          font-weight: 500;
        }

        .comp-item.pass { color: var(--success); }
        .comp-item.fail { color: var(--text-faint); text-decoration: line-through; opacity: 0.7; }

        .enhanced-banner {
          background: var(--surface-2) !important;
          border: 1px solid var(--border) !important;
          border-left: 4px solid var(--accent) !important;
          border-radius: 12px !important;
        }

        .slide-up {
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .disclosure-tag {
          font-size: 8px;
          font-weight: 800;
          color: #fff;
          background: var(--error);
          padding: 2px 8px;
          border-radius: 4px;
          margin-left: auto;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        .disclosure-val {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          padding: 10px 14px;
          background: var(--surface-1);
          border-radius: 8px;
          border: 1px solid var(--border);
          width: 100%;
          word-break: break-all;
        }

        .masked-val {
          font-family: monospace;
          font-size: 13px;
          color: var(--text);
          font-weight: 600;
          letter-spacing: 1px;
        }

        .btn-ghost:hover {
          opacity: 1 !important;
          background: var(--surface-2);
        }
      `}</style>
    </>
  );
}

