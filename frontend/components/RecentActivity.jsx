
import { useState, useEffect } from 'react';
import api from '../services/api';
import { LoadingState, EmptyState } from './Common';

export function RecentActivity() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/audit-logs?limit=10').then(res => setLogs(res.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if(loading) return <LoadingState />;
    if(logs.length === 0) return <EmptyState message="No recent activity." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logs.map(log => (
                <div key={log.log_id} style={{ padding: 10, borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{new Date(log.action_timestamp).toLocaleString()}</div>
                    <div><strong>{log.username}</strong> ({log.role_name}): {log.action_type} on {log.table_name}</div>
                </div>
            ))}
        </div>
    );
}
