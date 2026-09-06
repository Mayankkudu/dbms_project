export function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>
        <div className="hms-card hms-fade-in" style={{ width: '90%', maxWidth: 500, backgroundColor: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 10, marginBottom: 15 }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    );
}

export function QuickActionCard({ label, icon, onClick }) {
    return (
        <div onClick={onClick} className="hms-card hms-fade-in" style={{ cursor: 'pointer', textAlign: 'center', padding: '20px 10px', transition: 'all 0.2s' }}>
            <div style={{ fontSize: 32, color: 'var(--color-primary)', marginBottom: 10 }}>{icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>
        </div>
    );
}
