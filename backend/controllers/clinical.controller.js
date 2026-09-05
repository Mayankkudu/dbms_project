const clinicalService = require('../services/clinical.service');
const { writeAuditLog } = require('../services/audit.service');

async function createDiagnosis(req, res) {
  const { patientId, admissionId, diagnosisText } = req.body;
  if (!patientId || !diagnosisText) {
    return res.status(400).json({ error: 'patientId and diagnosisText are required' });
  }
  // The diagnosing doctor is always the authenticated caller, never a
  // client-supplied value.
  const diagnosis = await clinicalService.createDiagnosis({
    patientId, doctorId: req.user.personId, admissionId, diagnosisText,
  });

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
    tableName: 'diagnoses', recordId: diagnosis.diagnosis_id,
  });

  res.status(201).json(diagnosis);
}

async function createPrescription(req, res) {
  const { patientId, diagnosisId, notes, items } = req.body;
  if (!patientId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'patientId and at least one item ({medicineId, dosage, durationDays}) are required' });
  }

  const prescription = await clinicalService.createPrescription({
    patientId, doctorId: req.user.personId, diagnosisId, notes, items,
  });

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
    tableName: 'prescriptions', recordId: prescription.prescription_id,
  });

  res.status(201).json(prescription);
}

async function pendingDispensing(req, res) {
  res.json(await clinicalService.getPendingDispensingItems());
}

async function updateDispensedStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'PARTIAL', 'DISPENSED', 'UNAVAILABLE'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${validStatuses.join(', ')}` });
  }

  const item = await clinicalService.updateDispensedStatus(req.params.itemId, status);
  if (!item) return res.status(404).json({ error: 'Prescription item not found' });

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'UPDATE',
    tableName: 'prescription_items', recordId: item.item_id,
    fieldName: 'dispensed_status', newValue: status,
  });

  res.json(item);
}

module.exports = { createDiagnosis, createPrescription, pendingDispensing, updateDispensedStatus };
