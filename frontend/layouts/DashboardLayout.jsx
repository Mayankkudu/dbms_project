import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../utils/roles';

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220, background: 'var(--color-primary-dark)', color: '#fff',
          padding: '24px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, lineHeight: 1.25, marginBottom: 36 }}>
          Smart Hospital<br />Management
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 12 }}>{ROLE_LABEL[user?.role] || user?.role}</div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6, fontSize: 13, fontWeight: 600,
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 32px', maxWidth: 1200 }}>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>{title}</h1>
        {children}
      </main>
    </div>
  );
}
