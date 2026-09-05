import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';
import CriticalAlertCard from '../components/CriticalAlertCard';
import StatusBadge from '../components/StatusBadge';
import { patientApi, vitalApi } from '../services/resources';

const emptyForm = { heartRate: '', systolicBp: '', diastolicBp: '', spo2: '', temperatureCelsius: '', respiratoryRate: '', bloodGlucose: '' };

export default function NurseDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ackingId, setAckingId] = useState(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submittedVital, setSubmittedVital] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function loadAlerts() {
    vitalApi.listOpenAlerts().then((r) => setAlerts(r.data)).finally(() => setLoading(false));
  }
  useEffect(loadAlerts, []);

  async function acknowledge(alertId) {
    // Nurses can view alerts but only doctors acknowledge (Section 11 vs 10) —
    // button intentionally omitted for this role; see CriticalAlertCard's
    // onAcknowledge prop left undefined below.
  }

  async function doSearch(name) {
    setQuery(name);
    if (!name) { setResults([]); return; }
    const { data } = await patientApi.search({ name });
    setResults(data);
  }

  async function submitVital(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedVital(null);
    try {
      const payload = { patientId: selectedPatient.patient_id };
      for (const [k, v] of Object.entries(form)) {
        payload[k] = v === '' ? null : Number(v);
      }
      const { data } = await vitalApi.create(payload);
      setSubmittedVital(data);
      setForm(emptyForm);
      loadAlerts();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Nurse Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Record Vitals">
          <input
            placeholder="Search patient by name…" value={query}
            onChange={(e) => doSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, marginBottom: 10 }}
          />
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {results.map((p) => (
                <button key={p.patient_id} onClick={() => { setSelectedPatient(p); setSubmittedVital(null); }}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: selectedPatient?.patient_id === p.patient_id ? 'var(--color-primary-light)' : '#fff', fontSize: 13 }}>
                  {p.first_name} {p.last_name}
                </button>
              ))}
            </div>
          )}

          {selectedPatient && (
            <form onSubmit={submitVital}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>{selectedPatient.first_name} {selectedPatient.last_name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Heart rate (bpm)" value={form.heartRate} onChange={(v) => setForm({ ...form, heartRate: v })} />
                <Field label="SpO2 (%)" value={form.spo2} onChange={(v) => setForm({ ...form, spo2: v })} />
                <Field label="Systolic BP" value={form.systolicBp} onChange={(v) => setForm({ ...form, systolicBp: v })} />
                <Field label="Diastolic BP" value={form.diastolicBp} onChange={(v) => setForm({ ...form, diastolicBp: v })} />
                <Field label="Temperature (°C)" value={form.temperatureCelsius} onChange={(v) => setForm({ ...form, temperatureCelsius: v })} />
                <Field label="Respiratory rate" value={form.respiratoryRate} onChange={(v) => setForm({ ...form, respiratoryRate: v })} />
                <Field label="Blood glucose" value={form.bloodGlucose} onChange={(v) => setForm({ ...form, bloodGlucose: v })} />
              </div>
              <button type="submit" disabled={submitting}
                style={{ marginTop: 14, padding: '9px 18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>
                {submitting ? 'Recording…' : 'Record vitals'}
              </button>
            </form>
          )}

          {submittedVital && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--color-bg)' }}>
              Risk assessed: <StatusBadge status={submittedVital.risk_level} /> (score {submittedVital.risk_score})
              {['HIGH', 'CRITICAL'].includes(submittedVital.risk_level) && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-critical)' }}>
                  A critical alert has been created and the assigned doctor notified.
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title={`Open Critical Alerts (${alerts.length})`}>
          {loading ? <LoadingState /> : alerts.length === 0 ? <EmptyState message="No open alerts." /> : (
            alerts.map((a) => <CriticalAlertCard key={a.alert_id} alert={a} />)
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label style={{ fontSize: 12 }}>
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '7px 9px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13 }} />
    </label>
  );
}
