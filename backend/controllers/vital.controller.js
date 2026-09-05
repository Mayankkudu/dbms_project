const vitalService = require('../services/vital.service');
const { explainAlert } = require('../services/ai.service');
const { writeAuditLog } = require('../services/audit.service');

async function createVital(req, res) {
  // recorded_by must be the acting staff member's own person_id, not
  // something the client can spoof.
  const vital = await vitalService.recordVital(req.user.personId, req.body);

  if (vital.risk_level === 'HIGH' || vital.risk_level === 'CRITICAL') {
    await writeAuditLog({
      userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
      tableName: 'vital_records', recordId: vital.vital_id,
      fieldName: 'risk_level', newValue: vital.risk_level,
    });
  }

  res.status(201).json(vital);
}

async function listForPatient(req, res) {
  const { patientId } = req.params;
  if (req.user.role === 'PATIENT' && req.user.personId !== patientId) {
    return res.status(403).json({ error: 'Patients may only view their own vitals' });
  }
  res.json(await vitalService.getVitalsForPatient(patientId));
}

async function listOpenAlerts(req, res) {
  res.json(await vitalService.getOpenCriticalAlerts());
}

/**
 * Returns the same alert data plus an explanation field. Works identically
 * whether or not AI_EXPLANATION_ENABLED is set — the deterministic
 * rule-based reason is always the fallback, so this endpoint never
 * depends on the AI layer being available (Section 18).
 */
async function explainOpenAlert(req, res) {
  const alerts = await vitalService.getOpenCriticalAlerts();
  const alert = alerts.find((a) => String(a.alert_id) === req.params.alertId);
  if (!alert) return res.status(404).json({ error: 'Open alert not found' });
  const { explanation, source } = await explainAlert(alert);
  res.json({ ...alert, explanation, explanation_source: source });
}

async function acknowledgeAlert(req, res) {
  const alert = await vitalService.acknowledgeAlert(req.params.alertId, req.user.personId);
  if (!alert) return res.status(404).json({ error: 'Alert not found or already acknowledged' });

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'UPDATE',
    tableName: 'critical_alerts', recordId: alert.alert_id,
    fieldName: 'status', oldValue: 'OPEN', newValue: 'ACKNOWLEDGED',
  });

  res.json(alert);
}

module.exports = { createVital, listForPatient, listOpenAlerts, explainOpenAlert, acknowledgeAlert };
