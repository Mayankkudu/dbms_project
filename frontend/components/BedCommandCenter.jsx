import React, { useState, useEffect } from 'react';

export default function BedCommandCenter({ token }) {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/bed-command-center`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBeds(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  if (loading) return <div>Loading command center...</div>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'AVAILABLE': return '#28a745';
      case 'OCCUPIED': return '#dc3545';
      case 'CLEANING': return '#ffc107';
      case 'MAINTENANCE': return '#6c757d';
      default: return '#000';
    }
  };

  return (
    <div className="bed-command-center" style={{ margin: '20px 0' }}>
      <h2>Smart Bed Command Center</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {beds.map(bed => (
          <div key={bed.bed_id} style={{
            border: `2px solid ${getStatusColor(bed.status)}`,
            borderRadius: '8px', padding: '10px', width: '250px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: getStatusColor(bed.status) }}>
              Ward {bed.ward_name} - Rm {bed.room_no} - Bed {bed.bed_no}
            </h4>
            <p style={{ margin: 0 }}><strong>Status:</strong> {bed.status}</p>
            {bed.status === 'OCCUPIED' && (
              <>
                <p style={{ margin: '5px 0' }}><strong>Patient:</strong> {bed.first_name} {bed.last_name}</p>
                <p style={{ margin: 0 }}><strong>Exp. Discharge:</strong> {bed.predicted_discharge_date ? new Date(bed.predicted_discharge_date).toLocaleDateString() : 'TBD'}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
