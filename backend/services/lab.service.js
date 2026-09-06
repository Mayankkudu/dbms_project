const pool = require('../config/db');

async function orderTest({ patientId, orderedBy, testName }) {
  const [result] = await pool.query(
    `INSERT INTO lab_tests (patient_id, ordered_by, test_name) VALUES (?, ?, ?)`,
    [patientId, orderedBy, testName]
  );
  const [rows] = await pool.query(`SELECT * FROM lab_tests WHERE lab_test_id = ?`, [result.insertId]);
  return rows[0];
}

/**
 * Shape matches LabDashboard.jsx exactly: lab_test_id, test_name,
 * patient_name, ordered_by_doctor.
 */
async function listPendingTests() {
  const [rows] = await pool.query(
    `SELECT lt.lab_test_id, lt.test_name, lt.ordered_at,
            CONCAT(pp.first_name,' ',pp.last_name) AS patient_name,
            CONCAT(dp.first_name,' ',dp.last_name) AS ordered_by_doctor
     FROM lab_tests lt
     JOIN persons pp ON pp.person_id = lt.patient_id
     JOIN persons dp ON dp.person_id = lt.ordered_by
     WHERE lt.status = 'PENDING'
     ORDER BY lt.ordered_at ASC`
  );
  return rows;
}

/**
 * Creates the lab_reports row and flips the parent lab_tests.status to
 * COMPLETED, as one transaction.
 */
async function submitReport({ labTestId, performedBy, resultSummary, fileUrl = null, isCritical = false }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const deadlineClause = isCritical ? 'DATE_ADD(NOW(), INTERVAL 30 MINUTE)' : 'NULL';
    await conn.query(
      `INSERT INTO lab_reports (lab_test_id, performed_by, result_summary, file_url, is_critical, sla_deadline) VALUES (?, ?, ?, ?, ?, ${deadlineClause})`,
      [labTestId, performedBy, resultSummary, fileUrl, isCritical]
    );
    await conn.query(`UPDATE lab_tests SET status = 'COMPLETED' WHERE lab_test_id = ?`, [labTestId]);

    await conn.commit();

    const [rows] = await conn.query(
      `SELECT lt.*, lr.result_summary, lr.file_url, lr.completed_at
       FROM lab_tests lt JOIN lab_reports lr ON lr.lab_test_id = lt.lab_test_id
       WHERE lt.lab_test_id = ?`,
      [labTestId]
    );
    return rows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function acknowledgeCriticalLab(labReportId) {
  await pool.query(`UPDATE lab_reports SET acknowledged_at = NOW() WHERE lab_report_id = ?`, [labReportId]);
}

module.exports = { orderTest, listPendingTests, submitReport, acknowledgeCriticalLab };
