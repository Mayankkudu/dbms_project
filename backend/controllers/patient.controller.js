const patientService = require('../services/patient.service');
const { hashPassword } = require('../services/auth.service');
const { writeAuditLog } = require('../services/audit.service');

async function getProfile(req, res) {
  // A patient can only view their own profile; staff can view any patient's.
  const targetId = req.params.id;
  if (req.user.role === 'PATIENT' && req.user.personId !== targetId) {
    return res.status(403).json({ error: 'Patients may only view their own profile' });
  }
  const profile = await patientService.getPatientProfile(targetId);
  if (!profile) return res.status(404).json({ error: 'Patient not found' });
  res.json(profile);
}

async function updateProfile(req, res) {
  const targetId = req.params.id;
  const allowedRoles = ['PATIENT', 'RECEPTIONIST', 'ADMIN'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Role not permitted to edit patient demographics' });
  }
  if (req.user.role === 'PATIENT' && req.user.personId !== targetId) {
    return res.status(403).json({ error: 'Patients may only edit their own profile' });
  }

  const updated = await patientService.updatePatientProfile(targetId, req.body);

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'UPDATE',
    tableName: 'persons/patients', recordId: targetId,
    fieldName: Object.keys(req.body).join(','), newValue: JSON.stringify(req.body),
  });

  res.json(updated);
}

async function getMedicalHistory(req, res) {
  const targetId = req.params.id;
  // Medical history is clinical data — patients can view their own,
  // ward boys and pharmacists are NOT in this list (Section 13/14: no
  // unnecessary exposure of sensitive medical information).
  const allowedStaffRoles = ['DOCTOR', 'NURSE', 'ADMIN'];
  const isSelf = req.user.role === 'PATIENT' && req.user.personId === targetId;
  if (!isSelf && !allowedStaffRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not permitted to view this medical history' });
  }
  res.json(await patientService.getPatientMedicalHistory(targetId));
}

async function search(req, res) {
  const { name, phone } = req.query;
  res.json(await patientService.searchPatients({ name, phone }));
}

async function register(req, res) {
  const { firstName, lastName, dob, gender, phone, email, username, password } = req.body;
  if (!firstName || !lastName || !dob || !gender || !phone || !username || !password) {
    return res.status(400).json({ error: 'firstName, lastName, dob, gender, phone, username, password are required' });
  }
  const passwordHash = await hashPassword(password);
  try {
    const patientId = await patientService.registerPatient({
      firstName, lastName, dob, gender, phone, email, username, passwordHash,
    });

    await writeAuditLog({
      userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
      tableName: 'patients', recordId: patientId,
    });

    res.status(201).json(await patientService.getPatientProfile(patientId));
  } catch (err) {
    // e.g. duplicate username or phone -> UNIQUE constraint violation
    res.status(409).json({ error: err.sqlMessage || err.message });
  }
}

module.exports = { getProfile, updateProfile, getMedicalHistory, search, register };
