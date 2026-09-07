import { useState } from 'react';
import api from '../services/api';
import { PatientSearch } from './PatientSearch';

export function AddToQueueForm({ onSuccess }) {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [appointmentId, setAppointmentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return setError('Please select a patient first');
        
        setLoading(true); setError('');
        try {
            await api.post('/queue', { patientId: selectedPatient.patient_id, appointmentId: appointmentId || null });
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add to queue');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = { width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' };
    const btnStyle = { padding: '10px 15px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%', marginTop: 10 };

    return (
        <div style={{ padding: 10 }}>
            {!selectedPatient ? (
                <>
                    <h4 style={{ marginTop: 0 }}>Step 1: Search Patient</h4>
                    <PatientSearch onSelect={setSelectedPatient} />
                </>
            ) : (
                <form onSubmit={handleSubmit}>
                    <h4 style={{ marginTop: 0 }}>Step 2: Add to Queue</h4>
                    <div style={{ marginBottom: 15, padding: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                        <strong>Selected Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name} <br/>
                        <small>{selectedPatient.phone}</small>
                        <br/>
                        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedPatient(null); }} style={{ color: 'var(--color-primary)', fontSize: 13 }}>Change Patient</a>
                    </div>
                    
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Appointment ID (Optional)</label>
                    <input style={inputStyle} placeholder="E.g. 12" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} />
                    
                    {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 14 }}>{error}</div>}
                    <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Adding...' : 'Add to Waiting Queue'}</button>
                </form>
            )}
        </div>
    );
}
