const pool = require('../config/db');

/**
 * Inserts a vital record. Deliberately does NOT compute risk_score/risk_level
 * here — that logic lives in trg_vital_before_insert in the database, so
 * there is exactly one place the scoring rule is defined (avoids the classic
 * bug where the app and the DB trigger silently drift apart). We just insert
 * and then re-read the row to get back what the trigger computed.
 */
async function recordVital(recordedByStaffId, { patientId, admissionId = null, heartRate, systolicBp,
  diastolicBp, spo2, temperatureCelsius, respiratoryRate, bloodGlucose }) {

  const [result] = await pool.query(
    `INSERT INTO vital_records
      (patient_id, admission_id, recorded_by, heart_rate, systolic_bp, diastolic_bp,
       spo2, temperature_celsius, respiratory_rate, blood_glucose)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientId, admissionId, recordedByStaffId, heartRate, systolicBp, diastolicBp,
      spo2, temperatureCelsius, respiratoryRate, bloodGlucose]
  );

  const [rows] = await pool.query(`SELECT * FROM vital_records WHERE vital_id = ?`, [result.insertId]);
  return rows[0];
}

async function getVitalsForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT * FROM vital_records WHERE patient_id = ? ORDER BY recorded_at ASC`,
    [patientId]
  );
  return rows;
}

async function getOpenCriticalAlerts() {
  const [rows] = await pool.query(`SELECT * FROM critical_patients_view`);
  return rows;
}

async function acknowledgeAlert(alertId, staffId) {
  await pool.query(
    `UPDATE critical_alerts SET status = 'ACKNOWLEDGED', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE alert_id = ? AND status = 'OPEN'`,
    [staffId, alertId]
  );
  const [rows] = await pool.query(`SELECT * FROM critical_alerts WHERE alert_id = ?`, [alertId]);
  return rows[0] || null;
}

module.exports = { recordVital, getVitalsForPatient, getOpenCriticalAlerts, acknowledgeAlert };
