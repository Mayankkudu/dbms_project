import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';
import { labApi } from '../services/resources';

export default function LabDashboard() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    labApi.listPending().then((r) => setTests(r.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function submitReport(e) {
    e.preventDefault();
    if (!selected || !summary) return;
    setSubmitting(true);
    try {
      await labApi.submitReport(selected.lab_test_id, { resultSummary: summary });
      setMsg(`Report submitted for ${selected.test_name}.`);
      setSummary('');
      setSelected(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Lab Technician Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title={`Pending Tests (${tests.length})`}>
          {loading ? <LoadingState /> : tests.length === 0 ? <EmptyState message="No pending tests." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tests.map((t) => (
                <button key={t.lab_test_id} onClick={() => { setSelected(t); setMsg(''); }}
                  style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                    border: `1px solid ${selected?.lab_test_id === t.lab_test_id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: selected?.lab_test_id === t.lab_test_id ? 'var(--color-primary-light)' : '#fff',
                  }}>
                  <div style={{ fontWeight: 600 }}>{t.test_name}</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{t.patient_name} · ordered by {t.ordered_by_doctor}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Enter Report">
          {!selected ? <EmptyState message="Select a pending test to enter its report." /> : (
            <form onSubmit={submitReport}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{selected.test_name} — {selected.patient_name}</div>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5}
                placeholder="Result summary…"
                style={{ width: '100%', padding: 10, border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }} />
              <button type="submit" disabled={submitting}
                style={{ marginTop: 10, padding: '9px 18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </form>
          )}
          {msg && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-success)' }}>{msg}</div>}
        </Card>
      </div>
    </DashboardLayout>
  );
}
