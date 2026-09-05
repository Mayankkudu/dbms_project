const admissionService = require('../services/admission.service');
const { writeAuditLog } = require('../services/audit.service');

async function admit(req, res) {
  const { patientId, bedId, reason } = req.body;
  // The admitting doctor is a clinical decision, not necessarily the caller:
  // a receptionist creates the admission record but must name a real doctor;
  // a doctor calling this themselves can omit doctorId and it defaults to them.
  const doctorId = req.body.doctorId || (req.user.role === 'DOCTOR' ? req.user.personId : null);
  if (!doctorId) {
    return res.status(400).json({ error: 'doctorId is required when the caller is not a doctor' });
  }

  try {
    const admissionId = await admissionService.admitPatient({
      patientId, bedId, doctorId, reason,
    });

    await writeAuditLog({
      userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
      tableName: 'admissions', recordId: admissionId, newValue: 'ACTIVE',
    });

    res.status(201).json({ admissionId });
  } catch (err) {
    // SIGNAL from the stored procedure (e.g. "Bed is not available") surfaces here
    res.status(409).json({ error: err.sqlMessage || err.message });
  }
}

async function discharge(req, res) {
  await admissionService.dischargePatient(req.params.admissionId);
  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'UPDATE',
    tableName: 'admissions', recordId: req.params.admissionId, newValue: 'DISCHARGED',
  });
  res.json({ status: 'DISCHARGED' });
}

async function availableBeds(req, res) {
  res.json(await admissionService.getAvailableBeds());
}

async function occupancySummary(req, res) {
  res.json(await admissionService.getBedOccupancySummary());
}

module.exports = { admit, discharge, availableBeds, occupancySummary };
