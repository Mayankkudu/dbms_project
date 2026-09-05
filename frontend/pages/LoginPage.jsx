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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-primary-dark)',
    }}>
      <div style={{ width: 380, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 36, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 4, color: 'var(--color-primary-dark)' }}>
          Smart Hospital Management
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
          Sign in to your dashboard
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Username</label>
          <input
            value={username} onChange={(e) => setUsername(e.target.value)} autoFocus
            style={inputStyle}
          />
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', margin: '16px 0 6px' }}>Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-critical)' }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 22, width: '100%', padding: '11px 0', background: 'var(--color-primary)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 14,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Demo accounts (password: <code>password123</code>): admin, dr.mehta, nurse.priya,
          reception1, wardboy1, pharmacist1, labtech1, rahul.sharma
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-body)',
};
