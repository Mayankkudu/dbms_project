import StatusBadge from './StatusBadge';

// Mirrors the DEMO thresholds in database/triggers.sql — used here only to
// visually attribute the already-computed risk_score to its contributing
// factors; the score itself always comes from the backend/DB, never from
// this component.
const FACTORS = [
  { key: 'spo2', label: 'SpO2', points: 3, test: (v) => v.spo2 != null && v.spo2 < 92, color: '#1F6FEB' },
  { key: 'heart_rate', label: 'Heart rate', points: 2, test: (v) => v.heart_rate != null && (v.heart_rate > 110 || v.heart_rate < 50), color: '#D64545' },
  { key: 'bp', label: 'Blood pressure', points: 2, test: (v) => v.systolic_bp != null && (v.systolic_bp > 160 || v.systolic_bp < 90), color: '#8A4FE2' },
  { key: 'temp', label: 'Temperature', points: 1, test: (v) => v.temperature_celsius != null && (v.temperature_celsius > 38.5 || v.temperature_celsius < 35.0), color: '#E2A33D' },
  { key: 'rr', label: 'Respiratory rate', points: 2, test: (v) => v.respiratory_rate != null && (v.respiratory_rate > 24 || v.respiratory_rate < 10), color: '#2F9E63' },
];

function ExplainabilityStrip({ vitals, riskScore }) {
  const active = FACTORS.filter((f) => f.test(vitals));
  const totalPoints = active.reduce((s, f) => s + f.points, 0) || 1;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: '#EEF1F2' }}>
        {active.map((f) => (
          <div key={f.key} title={`${f.label}: +${f.points}`} style={{ width: `${(f.points / totalPoints) * 100}%`, background: f.color }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
        {active.map((f) => (
          <span key={f.key} style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: f.color, display: 'inline-block' }} />
            {f.label} (+{f.points})
          </span>
        ))}
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto', fontWeight: 600 }}>
          Score: {riskScore}
        </span>
      </div>
    </div>
  );
}

export default function CriticalAlertCard({ alert, onAcknowledge, acknowledging }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid var(--color-critical)`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{alert.patient_name}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
            SpO2 {alert.spo2}% · HR {alert.heart_rate} bpm · BP {alert.systolic_bp}/{alert.diastolic_bp}
          </div>
        </div>
        <StatusBadge status={alert.severity} />
      </div>

      <ExplainabilityStrip vitals={alert} riskScore={alert.risk_score} />

      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, fontStyle: 'italic' }}>
        Demo/educational thresholds only — not a medical diagnosis.
      </div>

      {onAcknowledge && (
        <button
          onClick={() => onAcknowledge(alert.alert_id)}
          disabled={acknowledging}
          style={{
            marginTop: 12, padding: '8px 16px', background: 'var(--color-primary)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 13,
          }}
        >
          {acknowledging ? 'Acknowledging…' : 'Acknowledge alert'}
        </button>
      )}
    </div>
  );
}
