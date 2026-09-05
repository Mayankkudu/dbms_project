export function Card({ title, action, children, style }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 20,
        ...style,
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          {title && <h3 style={{ fontSize: 16 }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, tone = 'primary' }) {
  const colorMap = {
    primary: 'var(--color-primary)', critical: 'var(--color-critical)',
    warning: 'var(--color-warning)', success: 'var(--color-success)',
  };
  return (
    <Card style={{ minWidth: 140 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: colorMap[tone], marginTop: 4 }}>
        {value}
      </div>
    </Card>
  );
}

export function EmptyState({ message }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      {message}
    </div>
  );
}

export function LoadingState() {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      Loading…
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, background: 'var(--color-critical-light)', color: 'var(--color-critical)', fontSize: 14 }}>
      {message || 'Something went wrong.'}
    </div>
  );
}
