import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../utils/roles';

const ROLE_ICON = {
  PATIENT: '🧑‍🦽', DOCTOR: '🩺', NURSE: '💉', RECEPTIONIST: '🗂️',
  WARD_BOY: '🛏️', PHARMACIST: '💊', LAB_TECHNICIAN: '🧪', ADMIN: '📊',
};

function initials(user) {
  const f = user?.firstName?.[0] || '';
  const l = user?.lastName?.[0] || '';
  return (f + l).toUpperCase() || '?';
}

export default function DashboardLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        className="hms-sidebar"
        style={{
          width: 240,
          background: 'linear-gradient(195deg, var(--color-primary-dark) 0%, var(--color-primary-darker) 100%)',
          color: '#fff',
          padding: '26px 20px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(47,184,166,0.35)',
          }}>
            ⚕
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, lineHeight: 1.2 }}>
            Smart Hospital<br /><span style={{ opacity: 0.65, fontWeight: 600 }}>Management</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            {ROLE_ICON[user?.role] || '•'} {ROLE_LABEL[user?.role] || user?.role}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 6 }}>
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0,
            }}>
              {initials(user)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.6 }}>@{user?.username}</div>
            </div>
          </div>
          <button className="hms-btn hms-btn-subtle" onClick={logout} style={{ width: '100%' }}>
            Log out
          </button>
        </div>
      </aside>

      <main className="hms-main" style={{ flex: 1, padding: '32px 40px', maxWidth: 1280, width: '100%' }}>
        <div className="hms-fade-in" style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 25, marginBottom: subtitle ? 4 : 0 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 13.5, color: 'var(--color-text-muted)' }}>{subtitle}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
