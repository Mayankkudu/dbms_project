import { useState, useEffect } from 'react';
import api from '../services/api';
import { PatientSearch } from './PatientSearch';

export function AssignBedForm({ onSuccess }) {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [beds, setBeds] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({ bedId: '', doctorId: '', reason: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admissions/beds/available').then(res => setBeds(res.data)).catch(console.error);
        api.get('/appointments/doctors').then(res => setDoctors(res.data)).catch(console.error);
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return setError('Please select a patient first');
        
        setLoading(true); setError('');
        try {
            await api.post('/admissions', { 
                patientId: selectedPatient.patient_id, 
                bedId: formData.bedId,
                doctorId: formData.doctorId,
                reason: formData.reason
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign bed');
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
                    <h4 style={{ marginTop: 0 }}>Step 2: Assign Bed</h4>
                    <div style={{ marginBottom: 15, padding: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                        <strong>Selected Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name} <br/>
                        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedPatient(null); }} style={{ color: 'var(--color-primary)', fontSize: 13 }}>Change Patient</a>
                    </div>
                    
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Select Available Bed</label>
                    <select style={inputStyle} name="bedId" required value={formData.bedId} onChange={handleChange}>
                        <option value="">-- Choose Bed --</option>
                        {beds.map(b => <option key={b.bed_id} value={b.bed_id}>{b.ward_name} - Room {b.room_no} - Bed {b.bed_no}</option>)}
                    </select>

                    <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Admitting Doctor</label>
                    <select style={inputStyle} name="doctorId" required value={formData.doctorId} onChange={handleChange}>
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>Dr. {d.name}</option>)}
                    </select>

                    <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Reason for Admission</label>
                    <input style={inputStyle} placeholder="E.g. Observation" name="reason" value={formData.reason} onChange={handleChange} required />
                    
                    {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 14 }}>{error}</div>}
                    <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Assigning...' : 'Admit Patient'}</button>
                </form>
            )}
        </div>
    );
}
