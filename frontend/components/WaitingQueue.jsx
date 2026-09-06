
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Button, LoadingState, EmptyState, ErrorState } from './Common';

export function WaitingQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            const res = await api.get('/queue/today');
            setQueue(res.data);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);

    async function markServed(id) {
        await api.post(`/queue/${id}/serve`);
        load();
    }
    async function remove(id) {
        await api.delete(`/queue/${id}`);
        load();
    }

    if(loading) return <LoadingState />;
    if(queue.length === 0) return <EmptyState message="Queue is empty." />;

    return (
        <table className="hms-table">
            <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Wait Time</th><th>Action</th></tr></thead>
            <tbody>
                {queue.map(q => {
                    const waitMins = Math.floor((new Date() - new Date(q.checkin_time)) / 60000);
                    return (
                        <tr key={q.queue_id}>
                            <td><strong>{q.queue_number}</strong></td>
                            <td>{q.first_name} {q.last_name}</td>
                            <td>{q.doc_first ? `Dr. ${q.doc_first} ${q.doc_last}` : 'N/A'}</td>
                            <td style={{ color: waitMins > 30 ? 'var(--color-critical)' : 'inherit' }}>{waitMins} min</td>
                            <td style={{ display: 'flex', gap: 5 }}>
                                {q.status === 'WAITING' && <Button onClick={() => markServed(q.queue_id)}>Serve</Button>}
                                {q.status === 'WAITING' && <Button variant="ghost" onClick={() => remove(q.queue_id)}>Remove</Button>}
                                {q.status !== 'WAITING' && <span>{q.status}</span>}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    );
}
