const labService = require('../services/lab.service');
const { writeAuditLog } = require('../services/audit.service');

async function orderTest(req, res) {
  const { patientId, testName } = req.body;
  if (!patientId || !testName) {
    return res.status(400).json({ error: 'patientId and testName are required' });
  }
  const test = await labService.orderTest({ patientId, orderedBy: req.user.personId, testName });

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
    tableName: 'lab_tests', recordId: test.lab_test_id,
  });

  res.status(201).json(test);
}

async function listPending(req, res) {
  res.json(await labService.listPendingTests());
}

async function submitReport(req, res) {
  const { resultSummary, fileUrl, isCritical } = req.body;
  if (!resultSummary) {
    return res.status(400).json({ error: 'resultSummary is required' });
  }

  try {
    const report = await labService.submitReport({
      labTestId: req.params.labTestId, performedBy: req.user.personId, resultSummary, fileUrl, isCritical
    });

    await writeAuditLog({
      userId: req.user.userId, roleName: req.user.role, action: 'UPDATE',
      tableName: 'lab_tests', recordId: req.params.labTestId,
      fieldName: 'status', oldValue: 'PENDING', newValue: 'COMPLETED',
    });

    res.status(201).json(report);
  } catch (err) {
    // e.g. duplicate report for a lab_test_id (UNIQUE constraint on lab_test_id)
    res.status(409).json({ error: err.sqlMessage || err.message });
  }
}

async function acknowledgeCriticalLab(req, res) {
  const { labReportId } = req.params;
  await labService.acknowledgeCriticalLab(labReportId);
  
  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'UPDATE',
    tableName: 'lab_reports', recordId: labReportId,
    fieldName: 'acknowledged_at', oldValue: null, newValue: 'NOW()',
  });

  res.status(200).json({ message: 'Critical lab acknowledged' });
}

module.exports = { orderTest, listPending, submitReport, acknowledgeCriticalLab };
