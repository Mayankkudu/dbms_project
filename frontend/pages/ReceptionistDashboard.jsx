import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';
import StatusBadge from '../components/StatusBadge';
import { patientApi, appointmentApi, admissionApi } from '../services/resources';
import api from '../services/api';
import BedCommandCenter from '../components/BedCommandCenter';

export default function ReceptionistDashboard() {
  const [beds, setBeds] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [apptDoctorId, setApptDoctorId] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptReason, setApptReason] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitDoctorId, setAdmitDoctorId] = useState('');
  const [admitReason, setAdmitReason] = useState('');
  const [msg, setMsg] = useState('');

  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', dob: '', gender: 'MALE', phone: '', email: '', username: '', password: '' });
  const [regMsg, setRegMsg] = useState('');

  function loadAll() {
    Promise.all([admissionApi.availableBeds(), admissionApi.occupancySummary(), appointmentApi.listDoctors()])
      .then(([b, o, d]) => { setBeds(b.data); setOccupancy(o.data); setDoctors(d.data); })
      .finally(() => setLoading(false));
  }
  useEffect(loadAll, []);

  async function doSearch(name) {
    setSearchName(name);
    if (!name) { setSearchResults([]); return; }
    const { data } = await patientApi.search({ name });
    setSearchResults(data);
  }

  async function bookAppointment(e) {
    e.preventDefault();
    setMsg('');
    await appointmentApi.book({
      patientId: selectedPatient.patient_id, doctorId: apptDoctorId,
      scheduledAt: apptTime, reason: apptReason,
    });
    setMsg('Appointment booked.');
    alert('Appointment booked successfully!');
    setApptTime(''); setApptReason('');
  }

  async function admitPatient(e) {
    e.preventDefault();
    setMsg('');
    try {
      await admissionApi.admit({
        patientId: selectedPatient.patient_id, bedId: Number(admitBedId),
        doctorId: admitDoctorId, reason: admitReason,
      });
      setMsg('Patient admitted.');
      alert('Admitted successfully!');
      setAdmitBedId(''); setAdmitReason('');
      loadAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Admission failed.');
    }
  }

  async function registerPatient(e) {
    e.preventDefault();
    setRegMsg('');
    try {
      const p = await patientApi.register(regForm);
      setRegMsg(`Registered ${p.data.first_name} ${p.data.last_name}.`);
      alert('Registered successfully!');
      setRegForm({ firstName: '', lastName: '', dob: '', gender: 'MALE', phone: '', email: '', username: '', password: '' });
    } catch (err) {
      setRegMsg(err.response?.data?.error || 'Registration failed.');
    }
  }

  if (loading) return <DashboardLayout title="Receptionist Dashboard"><LoadingState /></DashboardLayout>;

  return (
    <DashboardLayout title="Receptionist Dashboard">
      <Card title="Register New Patient" style={{ marginBottom: 20 }}>
        <form onSubmit={registerPatient} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, alignItems: 'end' }}>
          <RegField label="First name" value={regForm.firstName} onChange={(v) => setRegForm({ ...regForm, firstName: v })} required />
          <RegField label="Last name" value={regForm.lastName} onChange={(v) => setRegForm({ ...regForm, lastName: v })} required />
          <RegField label="Date of birth" type="date" value={regForm.dob} onChange={(v) => setRegForm({ ...regForm, dob: v })} required />
          <label style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>Gender</div>
            <select value={regForm.gender} onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })} style={selectStyle}>
              <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
            </select>
          </label>
          <RegField label="Phone" value={regForm.phone} onChange={(v) => setRegForm({ ...regForm, phone: v })} required />
          <RegField label="Email" value={regForm.email} onChange={(v) => setRegForm({ ...regForm, email: v })} />
          <RegField label="Username" value={regForm.username} onChange={(v) => setRegForm({ ...regForm, username: v })} required />
          <RegField label="Temp password" type="password" value={regForm.password} onChange={(v) => setRegForm({ ...regForm, password: v })} required />
          <button type="submit" style={{ ...btnStyle, marginTop: 0 }}>Register</button>
        </form>
        {regMsg && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-primary)' }}>{regMsg}</div>}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Bed Occupancy">
          <table>
            <thead><tr><Th>Ward</Th><Th>Occupied</Th><Th>Available</Th></tr></thead>
            <tbody>
              {occupancy.map((w) => (
                <tr key={w.ward_id}>
                  <Td>{w.ward_name}</Td><Td>{w.occupied_beds}</Td><Td>{w.available_beds}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={`Available Beds (${beds.length})`}>
          {beds.length === 0 ? <EmptyState message="No beds available." /> : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {beds.map((b) => (
                <span key={b.bed_id} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                  {b.ward_name} · {b.room_no}{b.bed_no}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Patient Actions">
        <input
          placeholder="Search patient by name…" value={searchName}
          onChange={(e) => doSearch(e.target.value)}
          style={{ width: 280, padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, marginBottom: 12 }}
        />
        {searchResults.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {searchResults.map((p) => (
              <button key={p.patient_id} onClick={() => { setSelectedPatient(p); setMsg(''); }}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: selectedPatient?.patient_id === p.patient_id ? 'var(--color-primary-light)' : '#fff', fontSize: 13 }}>
                {p.first_name} {p.last_name} <StatusBadge status={p.current_status} />
              </button>
            ))}
          </div>
        )}

        {selectedPatient && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <form onSubmit={bookAppointment}>
              <h4>Book Appointment</h4>
              <select value={apptDoctorId} onChange={(e) => setApptDoctorId(e.target.value)} required style={selectStyle}>
                <option value="">Select doctor…</option>
                {doctors.map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialization}</option>)}
              </select>
              <input type="datetime-local" value={apptTime} onChange={(e) => setApptTime(e.target.value)} required style={selectStyle} />
              <input placeholder="Reason" value={apptReason} onChange={(e) => setApptReason(e.target.value)} style={selectStyle} />
              <button type="submit" style={btnStyle}>Book</button>
            </form>

            <form onSubmit={admitPatient}>
              <h4>Admit Patient</h4>
              <select value={admitDoctorId} onChange={(e) => setAdmitDoctorId(e.target.value)} required style={selectStyle}>
                <option value="">Admitting doctor…</option>
                {doctors.map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
              </select>
              <select value={admitBedId} onChange={(e) => setAdmitBedId(e.target.value)} required style={selectStyle}>
                <option value="">Select bed…</option>
                {beds.map((b) => <option key={b.bed_id} value={b.bed_id}>{b.ward_name} — {b.room_no}{b.bed_no}</option>)}
              </select>
              <input placeholder="Reason for admission" value={admitReason} onChange={(e) => setAdmitReason(e.target.value)} style={selectStyle} />
              <button type="submit" style={btnStyle}>Admit</button>
            </form>
          </div>
        )}
        )}
        {msg && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-primary)' }}>{msg}</div>}
      </Card>

      <BedCommandCenter token={localStorage.getItem('token')} />
    </DashboardLayout>
  );
}

const selectStyle = { width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, marginBottom: 8 };
const btnStyle = { marginTop: 4, padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13 };
function Th({ children }) { return <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px 8px 0' }}>{children}</th>; }
function Td({ children }) { return <td style={{ fontSize: 13, padding: '8px 8px 8px 0', borderTop: '1px solid var(--color-border)' }}>{children}</td>; }
function RegField({ label, value, onChange, type = 'text', required }) {
  return (
    <label style={{ fontSize: 12 }}>
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13 }} />
    </label>
  );
}
