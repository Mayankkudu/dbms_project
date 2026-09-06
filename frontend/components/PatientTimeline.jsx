import React, { useState, useEffect } from 'react';

export default function PatientTimeline({ patientId, token }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clinical/timeline/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTimeline(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [patientId, token]);

  if (loading) return <div>Loading timeline...</div>;
  if (timeline.length === 0) return <div>No timeline events.</div>;

  return (
    <div className="timeline-container" style={{ margin: '20px 0', padding: '10px', borderLeft: '3px solid #007bff' }}>
      <h3 style={{ marginLeft: '15px' }}>Clinical Deterioration Timeline</h3>
      {timeline.map((event, idx) => (
        <div key={idx} style={{ marginBottom: '15px', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-18px', top: '5px', width: '12px', height: '12px',
            borderRadius: '50%', backgroundColor: event.type === 'ALERT' ? 'red' : '#007bff'
          }} />
          <div style={{ marginLeft: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <strong>{new Date(event.timestamp).toLocaleString()} - {event.type}</strong>
            <p style={{ margin: '5px 0 0 0' }}>{event.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
