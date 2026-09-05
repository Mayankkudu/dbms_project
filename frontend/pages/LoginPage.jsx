import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/roles';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your username and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Hero panel */}
      <div
        style={{
          flex: 1.1,
          background: 'linear-gradient(160deg, var(--color-primary-darker) 0%, var(--color-primary-dark) 45%, #0f4a41 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hms-login-hero"
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 15% 20%, rgba(47,184,166,0.28), transparent 40%),
                             radial-gradient(circle at 85% 75%, rgba(47,184,166,0.16), transparent 45%)`,
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 6px 18px rgba(47,184,166,0.4)',
          }}>⚕</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19 }}>
            Smart Hospital Management
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 460 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, lineHeight: 1.15, marginBottom: 18, color: '#fff' }}>
            One system for every ward, role, and second that matters.
          </div>
          <p style={{ fontSize: 15, opacity: 0.78, lineHeight: 1.6 }}>
            Real-time vitals, transparent rule-based risk scoring, and a single
            source of truth across doctors, nurses, pharmacy, and the front desk.
          </p>
          <div style={{ display: 'flex', gap: 28, marginTop: 34 }}>
            <HeroStat value="8" label="role dashboards" />
            <HeroStat value="24/7" label="alert monitoring" />
            <HeroStat value="0" label="black-box scoring" />
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12.5, opacity: 0.55 }}>
          © {new Date().getFullYear()} Smart Hospital Management System — demo environment.
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div className="hms-fade-in" style={{ width: 380, maxWidth: '88vw' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, marginBottom: 4, color: 'var(--color-primary-darker)' }}>
            Welcome back
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--color-text-muted)', marginBottom: 30 }}>
            Sign in to your dashboard to continue.
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--color-text-muted)' }}>
              Username
            </label>
            <input
              className="hms-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />

            <label style={{ fontSize: 12.5, fontWeight: 700, display: 'block', margin: '18px 0 6px', color: 'var(--color-text-muted)' }}>
              Password
            </label>
            <input
              className="hms-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <div style={{
                marginTop: 16, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-critical-light)', color: 'var(--color-critical)',
                fontSize: 13, fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <button
              className="hms-btn hms-btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 24, width: '100%', padding: '12px 0', fontSize: 14 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{
            marginTop: 26, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px',
          }}>
            <strong style={{ color: 'var(--color-text)' }}>Demo accounts</strong> (password: <code>password123</code>):<br />
            admin · dr.mehta · nurse.priya · reception1 · wardboy1 · pharmacist1 · labtech1 · rahul.sharma
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .hms-login-hero { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function HeroStat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>{value}</div>
      <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>{label}</div>
    </div>
  );
}
