
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Button, LoadingState, ErrorState, EmptyState } from './Common';

export function TodayAppointments() {
    const [appts, setAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load() {
        setLoading(true); setError('');
        try {
            const res = await api.get('/appointments/today');
            setAppts(res.data);
        } catch(e) {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);

    async function updateStatus(id, status) {
        try {
            await api.patch(`/appointments/${id}/status`, { status });
            load();
        } catch(e) {
            alert('Update failed');
        }
    }

    if(loading) return <LoadingState />;
    if(error) return <ErrorState message={error} />;
    if(appts.length === 0) return <EmptyState message="No appointments today." />;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="hms-table">
                <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    {appts.map(a => (
                        <tr key={a.appointment_id}>
                            <td>{new Date(a.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td>{a.first_name} {a.last_name}</td>
                            <td>Dr. {a.doc_first} {a.doc_last}</td>
                            <td>{a.status}</td>
                            <td style={{ display: 'flex', gap: 5 }}>
                                {a.status === 'SCHEDULED' && <Button variant="subtle" style={{background: 'var(--color-success)', color: 'white'}} onClick={() => updateStatus(a.appointment_id, 'COMPLETED')}>Check In</Button>}
                                {a.status === 'SCHEDULED' && <Button variant="ghost" onClick={() => updateStatus(a.appointment_id, 'CANCELLED')}>Cancel</Button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
