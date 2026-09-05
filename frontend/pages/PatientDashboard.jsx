import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState, ErrorState } from '../components/Common';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { patientApi, appointmentApi, billingApi, notificationApi } from '../services/resources';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      patientApi.getProfile(user.personId),
      patientApi.getHistory(user.personId),
      appointmentApi.listForPatient(user.personId),
      billingApi.listForPatient(user.personId),
      notificationApi.list(),
    ])
      .then(([p, h, a, b, n]) => {
        if (!mounted) return;
        setProfile(p.data); setHistory(h.data); setAppointments(a.data);
        setBills(b.data); setNotifications(n.data);
      })
      .catch(() => mounted && setError('Could not load your dashboard. Please try again.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [user.personId]);

  if (loading) return <DashboardLayout title="My Dashboard"><LoadingState /></DashboardLayout>;
  if (error) return <DashboardLayout title="My Dashboard"><ErrorState message={error} /></DashboardLayout>;

  return (
    <DashboardLayout title={`Welcome, ${profile.first_name}`}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="My Information">
          <InfoRow label="Status" value={<StatusBadge status={profile.current_status} />} />
          <InfoRow label="Phone" value={profile.phone} />
          <InfoRow label="Email" value={profile.email || '—'} />
          <InfoRow label="Blood group" value={profile.blood_group || '—'} />
          <InfoRow label="City" value={profile.city || '—'} />
        </Card>

        <Card title="Notifications">
          {notifications.length === 0 ? <EmptyState message="No notifications yet." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.slice(0, 6).map((n) => (
                <div key={n.notification_id} style={{ fontSize: 13, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 600 }}>{n.type.replace('_', ' ')}</span> — {n.message}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Appointments">
          {appointments.length === 0 ? <EmptyState message="No appointments." /> : (
            <table>
              <thead><tr><Th>Doctor</Th><Th>When</Th><Th>Status</Th></tr></thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.appointment_id}>
                    <Td>{a.doctor_name}</Td>
                    <Td>{new Date(a.scheduled_at).toLocaleString()}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Bills">
          {bills.length === 0 ? <EmptyState message="No bills." /> : (
            <table>
              <thead><tr><Th>Bill #</Th><Th>Date</Th><Th>Status</Th></tr></thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.bill_id}>
                    <Td>#{b.bill_id}</Td>
                    <Td>{new Date(b.generated_at).toLocaleDateString()}</Td>
                    <Td><StatusBadge status={b.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Recent Vitals" style={{ gridColumn: '1 / -1' }}>
          {history.vitals.length === 0 ? <EmptyState message="No vitals recorded." /> : (
            <table>
              <thead><tr><Th>Recorded</Th><Th>HR</Th><Th>BP</Th><Th>SpO2</Th><Th>Risk</Th></tr></thead>
              <tbody>
                {history.vitals.slice(-8).reverse().map((v) => (
                  <tr key={v.vital_id}>
                    <Td>{new Date(v.recorded_at).toLocaleString()}</Td>
                    <Td>{v.heart_rate}</Td>
                    <Td>{v.systolic_bp}/{v.diastolic_bp}</Td>
                    <Td>{v.spo2}%</Td>
                    <Td>{v.risk_level && <StatusBadge status={v.risk_level} />}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Prescriptions" style={{ gridColumn: '1 / -1' }}>
          {history.prescriptions.length === 0 ? <EmptyState message="No prescriptions." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.prescriptions.map((p) => (
                <div key={p.prescription_id} style={{ fontSize: 13, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{new Date(p.prescribed_at).toLocaleDateString()} — {p.notes}</div>
                  {(typeof p.items === 'string' ? JSON.parse(p.items) : p.items || []).map((it, i) => (
                    <div key={i}>{it.medicine} — {it.dosage} ({it.duration_days} days) <StatusBadge status={it.status} /></div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
function Th({ children }) { return <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px 8px 0' }}>{children}</th>; }
function Td({ children }) { return <td style={{ fontSize: 13, padding: '8px 8px 8px 0', borderTop: '1px solid var(--color-border)' }}>{children}</td>; }
