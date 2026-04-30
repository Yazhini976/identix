import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

const API = 'http://localhost:8000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.');
    if (!password) return setError('Please enter your password.');

    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      const data = await res.json();
      // In a real app, we'd store a token. Here we just redirect to dashboard with user_id.
      router.push(`/dashboard?id=${data.user_id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In – IDentix</title>
        <meta name="description" content="Sign in to your IDentix digital identity profile." />
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

          <h1 className="page-title">Welcome back</h1>
          <p className="page-subtitle">Sign in to manage your digital identity and verified documents.</p>

          <form className="form" onSubmit={handleLogin} noValidate>
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="e.g. aisha@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
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
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? <><span className="spinner" />Signing In…</> : 'Sign In →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
              Don't have an account? <a href="/" style={{ color: '#0066FF', fontWeight: 600 }}>Create Identity</a>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
