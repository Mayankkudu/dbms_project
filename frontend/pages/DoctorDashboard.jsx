import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState, ErrorState } from '../components/Common';
import StatusBadge from '../components/StatusBadge';
import CriticalAlertCard from '../components/CriticalAlertCard';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, vitalApi, patientApi, clinicalApi, labApi } from '../services/resources';
import PatientTimeline from '../components/PatientTimeline';
import ShiftHandoff from '../components/ShiftHandoff';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ackingId, setAckingId] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [patientHistory, setPatientHistory] = useState(null);
  const [diagText, setDiagText] = useState('');
  const [labTestName, setLabTestName] = useState('');
  const [formMsg, setFormMsg] = useState('');

  function load() {
    setLoading(true);
    Promise.all([appointmentApi.listForDoctor(), vitalApi.listOpenAlerts()])
      .then(([a, al]) => { setAppointments(a.data); setAlerts(al.data); })
      .catch(() => setError('Could not load dashboard.'))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function acknowledge(alertId) {
    setAckingId(alertId);
    try {
      await vitalApi.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
    } finally {
      setAckingId(null);
    }
  }

  async function doSearch(name) {
    if (!name) { setSearchResults([]); return; }
    const { data } = await patientApi.search({ name });
    setSearchResults(data);
  }

  async function selectPatient(id) {
    setSelectedPatientId(id);
    setFormMsg('');
    const { data } = await patientApi.getHistory(id);
    setPatientHistory(data);
  }

  async function submitDiagnosis(e) {
    e.preventDefault();
    if (!diagText) return;
    await clinicalApi.createDiagnosis({ patientId: selectedPatientId, diagnosisText: diagText });
    setDiagText('');
    setFormMsg('Diagnosis recorded.');
    selectPatient(selectedPatientId);
  }

  async function submitLabOrder(e) {
    e.preventDefault();
    if (!labTestName) return;
    await labApi.orderTest({ patientId: selectedPatientId, testName: labTestName });
    setLabTestName('');
    setFormMsg('Lab test ordered.');
    selectPatient(selectedPatientId);
  }

  if (loading) return <DashboardLayout title="Doctor Dashboard"><LoadingState /></DashboardLayout>;
  if (error) return <DashboardLayout title="Doctor Dashboard"><ErrorState message={error} /></DashboardLayout>;

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }} className="hms-fade-in">
        <Card title={`Open Critical Alerts (${alerts.length})`}>
          {alerts.length === 0 ? <EmptyState message="No open alerts." /> :
            alerts.map((a) => (
              <CriticalAlertCard key={a.alert_id} alert={a} onAcknowledge={acknowledge} acknowledging={ackingId === a.alert_id} />
            ))}
        </Card>

        <Card title="My Appointments">
          {appointments.length === 0 ? <EmptyState message="No appointments." /> : (
            <table className="hms-table">
              <thead><tr><Th>Patient</Th><Th>When</Th><Th>Status</Th></tr></thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.appointment_id}>
                    <Td>{a.patient_name}</Td>
                    <Td>{new Date(a.scheduled_at).toLocaleString()}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="Patient Lookup & Clinical Notes">
        <input
          className="hms-input"
          placeholder="Search patient by name…"
          onChange={(e) => doSearch(e.target.value)}
          style={{ maxWidth: 320, marginBottom: 14 }}
        />
        {searchResults.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {searchResults.map((p) => (
              <button key={p.patient_id} onClick={() => selectPatient(p.patient_id)}
                className={p.patient_id === selectedPatientId ? 'hms-btn hms-btn-primary' : 'hms-btn hms-btn-ghost'}
                style={{ padding: '7px 14px' }}>
                {p.first_name} {p.last_name}
              </button>
            ))}
          </div>
        )}

        {patientHistory && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4>Medical Timeline</h4>
              {patientHistory.diagnoses.length === 0 ? <EmptyState message="No diagnoses yet." /> : (
                <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                  {patientHistory.diagnoses.map((d) => <li key={d.diagnosis_id}>{new Date(d.diagnosed_at).toLocaleDateString()}: {d.diagnosis_text}</li>)}
                </ul>
              )}
              <h4 style={{ marginTop: 16 }}>Lab Reports</h4>
              {patientHistory.labReports.length === 0 ? <EmptyState message="No lab tests." /> : (
                <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                  {patientHistory.labReports.map((l) => (
                    <li key={l.lab_test_id}>
                      {l.test_name} — <StatusBadge status={l.status} /> {l.result_summary && `— ${l.result_summary}`}
                    </li>
                  ))}
                </ul>
              )}
              
              <PatientTimeline patientId={selectedPatientId} token={localStorage.getItem('token')} />
              <ShiftHandoff patientId={selectedPatientId} token={localStorage.getItem('token')} />
            </div>
            <div>
              <form onSubmit={submitDiagnosis} style={{ marginBottom: 20 }}>
                <h4>Add Diagnosis</h4>
                <textarea className="hms-textarea" value={diagText} onChange={(e) => setDiagText(e.target.value)} rows={3} />
                <button type="submit" className="hms-btn hms-btn-primary" style={{ marginTop: 10 }}>Save diagnosis</button>
              </form>
              <form onSubmit={submitLabOrder}>
                <h4>Order Lab Test</h4>
                <input className="hms-input" value={labTestName} onChange={(e) => setLabTestName(e.target.value)} placeholder="e.g. Troponin-I" />
                <button type="submit" className="hms-btn hms-btn-primary" style={{ marginTop: 10 }}>Order test</button>
              </form>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const alertId = prompt("Enter Alert ID:");
                const notes = prompt("Enter Intervention Notes:");
                if(alertId && notes) {
                   await fetch('/api/clinical/interventions', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                     body: JSON.stringify({ alertId: parseInt(alertId), notes })
                   });
                   alert('Intervention logged.');
                   selectPatient(selectedPatientId);
                }
              }}>
                <h4>Log Intervention</h4>
                <button type="submit" className="hms-btn hms-btn-ghost" style={{ marginTop: 10 }}>Add Note for Alert</button>
              </form>
              {formMsg && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-success)' }}>{formMsg}</div>}
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

function Th({ children }) { return <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px 8px 0' }}>{children}</th>; }
function Td({ children }) { return <td style={{ fontSize: 13, padding: '8px 8px 8px 0', borderTop: '1px solid var(--color-border)' }}>{children}</td>; }
