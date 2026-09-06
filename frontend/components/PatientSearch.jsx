
import { useState, useEffect } from 'react';
import { patientApi } from '../services/resources';
import { Button, ErrorState } from './Common';

export function PatientSearch({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!query) { setResults([]); return; }
        const delay = setTimeout(async () => {
            setLoading(true); setError('');
            try {
                const res = await patientApi.search({ name: query });
                setResults(res.data);
            } catch(e) {
                setError('Failed to search patients');
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [query]);

    return (
        <div>
            <input 
                type="text" 
                className="hms-input" 
                placeholder="Search by name, phone, or ID..." 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                style={{ marginBottom: 15 }}
            />
            {loading && <div>Loading...</div>}
            {error && <ErrorState message={error} />}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="hms-table">
                    <thead><tr><th>Name</th><th>Phone</th><th>Actions</th></tr></thead>
                    <tbody>
                        {results.map(p => (
                            <tr key={p.patient_id}>
                                <td>{p.first_name} {p.last_name}</td>
                                <td>{p.phone || 'N/A'}</td>
                                <td>
                                    <Button variant="ghost" onClick={() => onSelect(p)}>Select</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
