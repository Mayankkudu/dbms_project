import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, StatCard, LoadingState, EmptyState } from '../components/Common';
import { adminApi } from '../services/resources';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.analytics(), adminApi.auditLogs(30)])
      .then(([a, l]) => { setData(a.data); setAuditLogs(l.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Admin Dashboard"><LoadingState /></DashboardLayout>;

  const { summary, registrations, byDepartment, alertsOverTime } = data;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Patients" value={summary.totalPatients} />
        <StatCard label="Active Admissions" value={summary.activeAdmissions} tone="primary" />
        <StatCard label="Available Beds" value={summary.availableBeds} tone="success" />
        <StatCard label="Today's Appointments" value={summary.todaysAppointments} />
        <StatCard label="Critical Alerts (Open)" value={summary.openCriticalAlerts} tone="critical" />
        <StatCard label="Total Staff" value={summary.totalStaff} />
        <StatCard label="Pending Lab Tests" value={summary.pendingLabTests} tone="warning" />
        <StatCard label="Pending Bills" value={summary.pendingBills} tone="warning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Patient Registrations Over Time">
          {registrations.length === 0 ? <EmptyState message="No data yet." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Patients by Department">
          {byDepartment.length === 0 ? <EmptyState message="No data yet." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="patient_count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Critical Alerts Over Time" style={{ gridColumn: '1 / -1' }}>
          {alertsOverTime.length === 0 ? <EmptyState message="No alerts recorded yet." /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-critical)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card title="Recent Audit Log">
        {auditLogs.length === 0 ? <EmptyState message="No audit entries yet." /> : (
          <table>
            <thead><tr><Th>Time</Th><Th>User</Th><Th>Action</Th><Th>Table</Th><Th>Record</Th><Th>Field</Th><Th>Change</Th></tr></thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.audit_id}>
                  <Td>{new Date(log.logged_at).toLocaleString()}</Td>
                  <Td>{log.username || log.role_name || '—'}</Td>
                  <Td>{log.action}</Td>
                  <Td>{log.table_name}</Td>
                  <Td>{log.record_id}</Td>
                  <Td>{log.field_name || '—'}</Td>
                  <Td>{log.old_value ? `${log.old_value} → ${log.new_value}` : (log.new_value || '—')}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </DashboardLayout>
  );
}

function Th({ children }) { return <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px 8px 0' }}>{children}</th>; }
function Td({ children }) { return <td style={{ fontSize: 12, padding: '7px 8px 7px 0', borderTop: '1px solid var(--color-border)' }}>{children}</td>; }
