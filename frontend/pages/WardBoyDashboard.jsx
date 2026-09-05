import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';
import { admissionApi } from '../services/resources';

export default function WardBoyDashboard() {
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admissionApi
      .occupancySummary()
      .then((response) => {
        setOccupancy(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Ward Boy Dashboard">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ward Boy Dashboard">
      <Card title="Ward / Room / Bed Status">
        {occupancy.length === 0 ? (
          <EmptyState message="No ward data available." />
        ) : (
          <table>
            <thead>
              <tr>
                <Th>Ward</Th>
                <Th>Total Beds</Th>
                <Th>Occupied</Th>
                <Th>Available</Th>
              </tr>
            </thead>

            <tbody>
              {occupancy.map((ward) => (
                <tr key={ward.ward_id}>
                  <Td>{ward.ward_name}</Td>
                  <Td>{ward.total_beds}</Td>
                  <Td>{ward.occupied_beds}</Td>
                  <Td>{ward.available_beds}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}
      >
        Ward boys can view ward, room, and bed occupancy status only. No
        patient medical information is shown on this dashboard.
      </div>
    </DashboardLayout>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        fontSize: 12,
        color: 'var(--color-text-muted)',
        padding: '4px 8px 8px 0',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td
      style={{
        fontSize: 13,
        padding: '8px 8px 8px 0',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {children}
    </td>
  );
}