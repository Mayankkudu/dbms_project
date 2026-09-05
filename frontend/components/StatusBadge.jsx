const TONE_MAP = {
  // risk / severity
  NORMAL: 'success', MONITOR: 'warning', HIGH: 'warning', CRITICAL: 'critical',
  // beds
  AVAILABLE: 'success', OCCUPIED: 'critical', CLEANING: 'warning', MAINTENANCE: 'muted',
  // admissions / alerts / bills / lab / dispensing
  ACTIVE: 'primary', DISCHARGED: 'muted',
  OPEN: 'critical', ACKNOWLEDGED: 'success',
  PENDING: 'warning', PARTIAL: 'warning', PAID: 'success', COMPLETED: 'success',
  DISPENSED: 'success', UNAVAILABLE: 'critical',
  SCHEDULED: 'primary', CANCELLED: 'muted', NO_SHOW: 'muted',
  ADMITTED: 'primary', OUTPATIENT: 'muted',
};

const TONE_STYLES = {
  primary: { bg: 'var(--color-primary-light)', fg: 'var(--color-primary)' },
  success: { bg: 'var(--color-success-light)', fg: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-light)', fg: '#8a6414' },
  critical: { bg: 'var(--color-critical-light)', fg: 'var(--color-critical)' },
  muted: { bg: '#EEF1F2', fg: 'var(--color-text-muted)' },
};

export default function StatusBadge({ status }) {
  const tone = TONE_STYLES[TONE_MAP[status] || 'muted'];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: tone.bg,
        color: tone.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}
