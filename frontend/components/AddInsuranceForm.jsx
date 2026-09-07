import { useState } from 'react';
import { insuranceApi } from '../services/resources';
import { Button, ErrorState } from './Common';
import { PatientSearch } from './PatientSearch';

const POLICY_TYPES = ['INDIVIDUAL', 'FAMILY', 'CORPORATE', 'GOVERNMENT'];

export function AddInsuranceForm({ onDone }) {
  const [patient, setPatient] = useState(null);
  const [providerName, setProviderName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyType, setPolicyType] = useState('INDIVIDUAL');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [coveragePercent, setCoveragePercent] = useState('80');
  const [validFrom, setValidFrom] = useState('');
  const [validTill, setValidTill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!patient || !providerName || !policyNumber || !coverageAmount || !validFrom || !validTill) {
      setError('Please fill in every field, including selecting a patient.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await insuranceApi.add({
        patientId: patient.patient_id,
        providerName,
        policyNumber,
        policyType,
        coverageAmount: Number(coverageAmount),
        coveragePercent: Number(coveragePercent),
        validFrom,
        validTill,
      });
      onDone && onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the policy. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!patient) {
    return (
      <div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
          Search for the patient this policy belongs to.
        </div>
        <PatientSearch onSelect={setPatient} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 13, marginBottom: 14, padding: '8px 10px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)' }}>
        Adding a policy for <strong>{patient.first_name} {patient.last_name}</strong>{' '}
        <button type="button" onClick={() => setPatient(null)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 12.5, textDecoration: 'underline' }}>
          (change)
        </button>
      </div>

      {error && <div style={{ marginBottom: 12 }}><ErrorState message={error} /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Provider name">
          <input className="hms-input" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="e.g. Star Health" />
        </Field>
        <Field label="Policy number">
          <input className="hms-input" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="e.g. SH-2026-00123" />
        </Field>
        <Field label="Policy type">
          <select className="hms-input" value={policyType} onChange={(e) => setPolicyType(e.target.value)}>
            {POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Coverage % (of bill)">
          <input className="hms-input" type="number" min="0" max="100" value={coveragePercent} onChange={(e) => setCoveragePercent(e.target.value)} />
        </Field>
        <Field label="Coverage amount (₹)">
          <input className="hms-input" type="number" min="0" step="0.01" value={coverageAmount} onChange={(e) => setCoverageAmount(e.target.value)} placeholder="e.g. 500000" />
        </Field>
        <div />
        <Field label="Valid from">
          <input className="hms-input" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </Field>
        <Field label="Valid till">
          <input className="hms-input" type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} />
        </Field>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Policy'}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
      {label}
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}
