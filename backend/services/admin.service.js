const pool = require('../config/db');

async function getSummaryStats() {
  const [[{ totalPatients }]] = await pool.query(`SELECT COUNT(*) AS totalPatients FROM patients`);
  const [[{ activeAdmissions }]] = await pool.query(`SELECT COUNT(*) AS activeAdmissions FROM admissions WHERE status='ACTIVE'`);
  const [[{ availableBeds }]] = await pool.query(`SELECT COUNT(*) AS availableBeds FROM beds WHERE status='AVAILABLE'`);
  const [[{ todaysAppointments }]] = await pool.query(
    `SELECT COUNT(*) AS todaysAppointments FROM appointments WHERE CAST(scheduled_at AS DATE) = CURRENT_DATE`
  );
  const [[{ openCriticalAlerts }]] = await pool.query(`SELECT COUNT(*) AS openCriticalAlerts FROM critical_alerts WHERE status='OPEN'`);
  const [[{ totalStaff }]] = await pool.query(`SELECT COUNT(*) AS totalStaff FROM staff`);
  const [[{ pendingLabTests }]] = await pool.query(`SELECT COUNT(*) AS pendingLabTests FROM lab_tests WHERE status='PENDING'`);
  const [[{ pendingBills }]] = await pool.query(`SELECT COUNT(*) AS pendingBills FROM bills WHERE status IN ('PENDING','PARTIAL')`);

  return {
    totalPatients, activeAdmissions, availableBeds, todaysAppointments,
    openCriticalAlerts, totalStaff, pendingLabTests, pendingBills,
  };
}

async function getRegistrationsByDay() {
  const [rows] = await pool.query(
    `SELECT CAST(pt.registered_at AS DATE) AS day, COUNT(*) AS count
     FROM patients pt GROUP BY CAST(pt.registered_at AS DATE) ORDER BY day`
  );
  return rows;
}

async function getPatientsByDepartment() {
  const [rows] = await pool.query(
    `SELECT d.name AS department, COUNT(DISTINCT a.patient_id) AS patient_count
     FROM appointments a JOIN departments d ON d.department_id = a.department_id
     GROUP BY d.name ORDER BY patient_count DESC`
  );
  return rows;
}

async function getAlertsOverTime() {
  const [rows] = await pool.query(
    `SELECT CAST(generated_at AS DATE) AS day, severity, COUNT(*) AS count
     FROM critical_alerts GROUP BY CAST(generated_at AS DATE), severity ORDER BY day`
  );
  return rows;
}

async function getAuditLogs({ limit = 100 } = {}) {
  const [rows] = await pool.query(
    `SELECT al.*, ua.username
     FROM audit_logs al LEFT JOIN user_accounts ua ON ua.user_id = al.user_id
     ORDER BY al.logged_at DESC LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

module.exports = { getSummaryStats, getRegistrationsByDay, getPatientsByDepartment, getAlertsOverTime, getAuditLogs };
