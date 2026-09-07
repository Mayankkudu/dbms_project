import { useState } from 'react';
import api from '../services/api';

export function RegisterPatientForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dob: '', gender: 'MALE',
        phone: '', email: '', username: '', password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/patients/register', formData);
            if (onSuccess) onSuccess(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = { width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' };
    const btnStyle = { padding: '10px 15px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' };

    return (
        <form onSubmit={handleSubmit} style={{ padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input style={inputStyle} name="firstName" placeholder="First Name" required value={formData.firstName} onChange={handleChange} />
                <input style={inputStyle} name="lastName" placeholder="Last Name" required value={formData.lastName} onChange={handleChange} />
                <input style={inputStyle} type="date" name="dob" required value={formData.dob} onChange={handleChange} />
                <select style={inputStyle} name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                </select>
                <input style={inputStyle} name="phone" placeholder="Phone" required value={formData.phone} onChange={handleChange} />
                <input style={inputStyle} type="email" name="email" placeholder="Email (Optional)" value={formData.email} onChange={handleChange} />
                <input style={inputStyle} name="username" placeholder="Username" required value={formData.username} onChange={handleChange} />
                <input style={inputStyle} type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} />
            </div>
            {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 14 }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Registering...' : 'Register Patient'}</button>
        </form>
    );
}
