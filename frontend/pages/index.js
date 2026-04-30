import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

const API = 'http://localhost:8000';

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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter your full name.');
    if (!age || Number(age) < 1 || Number(age) > 120) return setError('Please enter a valid age.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    if (!dob) return setError('Please enter your date of birth.');
    if (!address.trim()) return setError('Please enter your address.');
    if (!idFile) return setError('Please upload an ID document.');

    setLoading(true);
    try {
      // Step 1: Register user
      const regForm = new FormData();
      regForm.append('name', name.trim());
      regForm.append('age', age);
      regForm.append('email', email.trim());
      regForm.append('password', password);
      regForm.append('phone', phone.trim());
      regForm.append('dob', dob);
      regForm.append('address', address.trim());

      const res = await fetch(`${API}/register`, { method: 'POST', body: regForm });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Registration failed. Please try again.');
      }
      const data = await res.json();
      const userId = data.id;

      // Step 2: Upload ID document
      const idForm = new FormData();
      idForm.append('file', idFile);
      const idRes = await fetch(`${API}/upload-id/${userId}`, { method: 'POST', body: idForm });
      if (!idRes.ok) {
        const idData = await idRes.json().catch(() => ({}));
        throw new Error(idData.detail || 'ID upload failed. Please try again.');
      }

      router.push(`/webcam?id=${userId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up – IDentix</title>
        <meta name="description" content="Create your digital identity profile on IDentix." />
      </Head>

      <main className="page">
        <div className="card">
          <div className="wordmark">
            <div className="wordmark-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 6v4c0 3.9 2.9 7.5 7 8.5 4.1-1 7-4.6 7-8.5V6L10 2z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="wordmark-text">IDentix</span>
          </div>

          <StepBar current={1} />

          <h1 className="page-title">Create your identity</h1>
          <p className="page-subtitle">Fill in all details to secure your digital presence.</p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Aisha Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  placeholder="e.g. 25"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="aisha@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Create Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="phone">Mobile Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="address">Permanent Address</label>
              <textarea
                id="address"
                placeholder="Street, City, State, ZIP"
                value={address}
                onChange={e => setAddress(e.target.value)}
                disabled={loading}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="field">
              <label>Upload ID Document</label>
              <div className="file-input-wrapper">
                <label className={`file-input-label ${idFile ? 'has-file' : ''}`}>
                  {idFile ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {idFile.name}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v9M4 7l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Click to upload (JPG, PNG, PDF)
                    </>
                  )}
                  <input
                    type="file"
                    id="id-file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => setIdFile(e.target.files[0] || null)}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              id="signup-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <><span className="spinner" />Creating Account…</> : 'Continue to Biometrics →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
              Already have an account? <a href="/login" style={{ color: '#0066FF', fontWeight: 600 }}>Sign In</a>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
