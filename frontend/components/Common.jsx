import { Link } from 'react-router-dom';

export function Card({ title, subtitle, action, children, style, className = '' }) {
  return (
    <div className={`hms-card hms-fade-in ${className}`} style={style}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
          <div>
            {title && <h3 style={{ fontSize: 16.5, margin: 0 }}>{title}</h3>}
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 3 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const TONE_COLORS = {
  primary: { fg: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  critical: { fg: 'var(--color-critical)', bg: 'var(--color-critical-light)' },
  warning: { fg: '#8a6414', bg: 'var(--color-warning-light)' },
  success: { fg: 'var(--color-success)', bg: 'var(--color-success-light)' },
  info: { fg: 'var(--color-info)', bg: 'var(--color-info-light)' },
};

export function StatCard({ label, value, tone = 'primary', icon, hint, to, onClick }) {
  const c = TONE_COLORS[tone] || TONE_COLORS.primary;
  const content = (
    <>
      <div style={{
        position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: '50%',
        background: c.bg, opacity: 0.7,
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: c.fg, marginTop: 6, lineHeight: 1 }}>
            {value}
          </div>
          {hint && <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 6 }}>{hint}</div>}
        </div>
        {icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 11, background: c.bg, color: c.fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </>
  );

  const style = { minWidth: 150, position: 'relative', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'block', outline: 'none', cursor: (to || onClick) ? 'pointer' : 'default' };

  if (to) {
    return (
      <Link to={to} className="hms-card hms-fade-in stat-card-link" style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`hms-card hms-fade-in ${(to || onClick) ? 'stat-card-link' : ''}`} style={style} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={(e) => { if(onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}>
      {content}
    </div>
  );
}

export function Button({ children, variant = 'primary', style, ...props }) {
  const cls = variant === 'ghost' ? 'hms-btn-ghost' : variant === 'subtle' ? 'hms-btn-subtle' : 'hms-btn-primary';
  return (
    <button className={`hms-btn ${cls}`} style={style} {...props}>
      {children}
    </button>
  );
}

export function EmptyState({ message, icon }) {
  return (
    <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>{icon || '◌'}</div>
      <div style={{ fontSize: 13.5 }}>{message}</div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="hms-skeleton" style={{ height: 16, width: '40%' }} />
      <div className="hms-skeleton" style={{ height: 52, width: '100%' }} />
      <div className="hms-skeleton" style={{ height: 52, width: '100%' }} />
      <div className="hms-skeleton" style={{ height: 52, width: '70%' }} />
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--color-critical-light)',
      color: 'var(--color-critical)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>⚠</span>
      {message || 'Something went wrong.'}
    </div>
  );
}
