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

async function getOperationsMetrics() {
  const [[{ avgTurnaroundHours }]] = await pool.query(
    `SELECT AVG(TIMESTAMPDIFF(HOUR, cleaning_started_at, available_at)) as avgTurnaroundHours 
     FROM beds WHERE available_at IS NOT NULL AND cleaning_started_at IS NOT NULL`
  );

  const [[{ slaBreachCount }]] = await pool.query(
    `SELECT COUNT(*) as slaBreachCount FROM critical_alerts WHERE escalation_level > 0`
  );

  return { avgTurnaroundHours: avgTurnaroundHours || 0, slaBreachCount };
}

async function getBedCommandCenter() {
  const [rows] = await pool.query(
    `SELECT b.bed_id, b.bed_no, b.status, r.room_no, w.name as ward_name, 
            a.admission_id, p.first_name, p.last_name, a.predicted_discharge_date
     FROM beds b
     JOIN rooms r ON b.room_id = r.room_id
     JOIN wards w ON r.ward_id = w.ward_id
     LEFT JOIN admissions a ON a.bed_id = b.bed_id AND a.status = 'ACTIVE'
     LEFT JOIN patients pt ON a.patient_id = pt.patient_id
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

async function getOperationsMetrics() {
  const [[{ avgTurnaroundHours }]] = await pool.query(
    `SELECT AVG(TIMESTAMPDIFF(HOUR, cleaning_started_at, available_at)) as avgTurnaroundHours 
     FROM beds WHERE available_at IS NOT NULL AND cleaning_started_at IS NOT NULL`
  );

  const [[{ slaBreachCount }]] = await pool.query(
    `SELECT COUNT(*) as slaBreachCount FROM critical_alerts WHERE escalation_level > 0`
  );

  return { avgTurnaroundHours: avgTurnaroundHours || 0, slaBreachCount };
}

async function getBedCommandCenter() {
  const [rows] = await pool.query(
    `SELECT b.bed_id, b.bed_no, b.status, r.room_no, w.name as ward_name, 
            a.admission_id, p.first_name, p.last_name, a.predicted_discharge_date
     FROM beds b
     JOIN rooms r ON b.room_id = r.room_id
     JOIN wards w ON r.ward_id = w.ward_id
     LEFT JOIN admissions a ON a.bed_id = b.bed_id AND a.status = 'ACTIVE'
     LEFT JOIN patients pt ON a.patient_id = pt.patient_id
     LEFT JOIN persons p ON pt.patient_id = p.person_id
     ORDER BY w.name, r.room_no, b.bed_no`
  );
  return rows;
}

async function getList(type) {
  if (type === 'patients') {
    return (await pool.query(`SELECT p.first_name, p.last_name, pt.* FROM patients pt JOIN persons p ON p.person_id = pt.patient_id ORDER BY pt.registered_at DESC`))[0];
  } else if (type === 'available-beds') {
    return (await pool.query(`SELECT b.*, r.room_no, w.name as ward_name FROM beds b JOIN rooms r ON b.room_id = r.room_id JOIN wards w ON r.ward_id = w.ward_id WHERE b.status = 'AVAILABLE'`))[0];
  } else if (type === 'active-admissions') {
    return (await pool.query(`SELECT * FROM admissions WHERE status = 'ACTIVE'`))[0];
  } else if (type === 'todays-appointments') {
    return (await pool.query(`SELECT * FROM appointments WHERE CAST(scheduled_at AS DATE) = CURRENT_DATE`))[0];
  } else if (type === 'open-alerts') {
    return (await pool.query(`SELECT * FROM critical_alerts WHERE status = 'OPEN'`))[0];
  } else if (type === 'staff') {
    return (await pool.query(`SELECT p.first_name, p.last_name, s.* FROM staff s JOIN persons p ON p.person_id = s.staff_id`))[0];
  } else if (type === 'pending-labs') {
    return (await pool.query(`SELECT * FROM lab_tests WHERE status = 'PENDING'`))[0];
  } else if (type === 'pending-bills') {
    return (await pool.query(`SELECT * FROM bills WHERE status IN ('PENDING', 'PARTIAL')`))[0];
  }
  return [];
}

module.exports = { 
  getSummaryStats, getRegistrationsByDay, getPatientsByDepartment, 
  getAlertsOverTime, getAuditLogs, getOperationsMetrics, getBedCommandCenter, getList
};
