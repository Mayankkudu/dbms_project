import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';
import StatusBadge from '../components/StatusBadge';
import { clinicalApi } from '../services/resources';

export default function PharmacistDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  function load() {
    clinicalApi.pendingDispensing().then((r) => setItems(r.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function updateStatus(itemId, status) {
    setUpdatingId(itemId);
    try {
      await clinicalApi.updateDispensedStatus(itemId, status);
      load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardLayout title="Pharmacist Dashboard">
      <Card title={`Pending Prescriptions (${items.length})`}>
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="Nothing pending — all caught up." /> : (
          <table>
            <thead><tr><Th>Patient</Th><Th>Medicine</Th><Th>Dosage</Th><Th>Duration</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.item_id}>
                  <Td>{it.patient_name}</Td>
                  <Td>{it.medicine_name}</Td>
                  <Td>{it.dosage}</Td>
                  <Td>{it.duration_days} days</Td>
                  <Td><StatusBadge status={it.dispensed_status} /></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button disabled={updatingId === it.item_id} onClick={() => updateStatus(it.item_id, 'DISPENSED')} style={smallBtn('var(--color-success)')}>Dispense</button>
                      <button disabled={updatingId === it.item_id} onClick={() => updateStatus(it.item_id, 'UNAVAILABLE')} style={smallBtn('var(--color-critical)')}>Unavailable</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </DashboardLayout>
  );
}

function smallBtn(color) {
  return { fontSize: 12, padding: '5px 10px', borderRadius: 6, border: `1px solid ${color}`, background: '#fff', color };
}
function Th({ children }) { return <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px 8px 0' }}>{children}</th>; }
function Td({ children }) { return <td style={{ fontSize: 13, padding: '8px 8px 8px 0', borderTop: '1px solid var(--color-border)' }}>{children}</td>; }
