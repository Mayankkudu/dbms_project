const insuranceService = require('../services/insurance.service');
const { writeAuditLog } = require('../services/audit.service');

async function getActivePolicy(req, res) {
  const targetId = req.params.patientId;
  // Same access rule as patient profile/history: a patient can only see
  // their own policy; staff handling registration/billing can see any.
  const isSelf = req.user.role === 'PATIENT' && req.user.personId === targetId;
  const allowedStaffRoles = ['RECEPTIONIST', 'ADMIN'];
  if (!isSelf && !allowedStaffRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not permitted to view this insurance policy' });
  }

  const policy = await insuranceService.getActivePolicy(targetId);
  if (!policy) return res.status(404).json({ error: 'No active insurance policy on file' });
  res.json(policy);
}

async function getHistory(req, res) {
  const targetId = req.params.patientId;
  const isSelf = req.user.role === 'PATIENT' && req.user.personId === targetId;
  const allowedStaffRoles = ['RECEPTIONIST', 'ADMIN'];
  if (!isSelf && !allowedStaffRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not permitted to view this insurance history' });
  }
  res.json(await insuranceService.getPolicyHistory(targetId));
}

async function addPolicy(req, res) {
  const { patientId, providerName, policyNumber, policyType, coverageAmount, coveragePercent, validFrom, validTill } = req.body;

  if (!patientId || !providerName || !policyNumber || !coverageAmount || !validFrom || !validTill) {
    return res.status(400).json({
      error: 'patientId, providerName, policyNumber, coverageAmount, validFrom, validTill are required',
    });
  }

  try {
    const policyId = await insuranceService.addPolicy({
      patientId,
      providerName,
      policyNumber,
      policyType: policyType || 'INDIVIDUAL',
      coverageAmount,
      coveragePercent: coveragePercent || 80,
      validFrom,
      validTill,
    });

    await writeAuditLog({
      userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
      tableName: 'insurance_policies', recordId: policyId,
      fieldName: 'policy_number', newValue: policyNumber,
    });

    res.status(201).json(await insuranceService.getPolicyById(policyId));
  } catch (err) {
    // e.g. duplicate policy_number -> UNIQUE constraint violation
    res.status(409).json({ error: err.sqlMessage || err.message });
  }
}

module.exports = { getActivePolicy, getHistory, addPolicy };
