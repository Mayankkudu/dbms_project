import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';

export default function AdminList() {
  const { type } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/list/${type}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) return <DashboardLayout title={`List: ${type}`}><LoadingState /></DashboardLayout>;

  return (
    <DashboardLayout title={`List: ${type}`}>
      <Card title={`Data for ${type}`}>
        {data.length === 0 ? <EmptyState message="No records found." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="hms-table">
              <thead>
                <tr>
                  {Object.keys(data[0]).map(k => <th key={k} style={{ textAlign: 'left', padding: '8px' }}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => <td key={j} style={{ padding: '8px', borderTop: '1px solid var(--color-border)' }}>{String(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
