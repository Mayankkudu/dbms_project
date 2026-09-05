const pool = require('../config/db');

/**
 * Calls admit_patient(), which does the bed-locking + admission-insert +
 * status-flip as a single transaction inside the database (see
 * database/procedures.sql). We grab one dedicated connection so the
 * session variable @out_id set by CALL is visible to the SELECT that reads
 * it back — a connection pulled fresh per-query from the pool would not
 * share that session state.
 */
async function admitPatient({ patientId, bedId, doctorId, reason }) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CALL admit_patient(?, ?, ?, ?, @out_id)`, [patientId, bedId, doctorId, reason]);
    const [rows] = await conn.query(`SELECT @out_id AS admissionId`);
    return rows[0].admissionId;
  } finally {
    conn.release();
  }
}

async function dischargePatient(admissionId) {
  await pool.query(`CALL discharge_patient(?)`, [admissionId]);
}

async function assignBed(admissionId, newBedId) {
  await pool.query(`CALL assign_bed(?, ?)`, [admissionId, newBedId]);
}

async function getAvailableBeds() {
  const [rows] = await pool.query(`SELECT * FROM available_beds_view`);
  return rows;
}

async function getBedOccupancySummary() {
  const [rows] = await pool.query(`SELECT * FROM bed_occupancy_summary_view`);
  return rows;
}

async function getActiveAdmissionForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT a.*, b.bed_no, r.room_no, w.name AS ward_name
     FROM admissions a
     JOIN beds b ON b.bed_id = a.bed_id
     JOIN rooms r ON r.room_id = b.room_id
     JOIN wards w ON w.ward_id = r.ward_id
     WHERE a.patient_id = ? AND a.status = 'ACTIVE'`,
    [patientId]
  );
  return rows[0] || null;
}

module.exports = { admitPatient, dischargePatient, assignBed, getAvailableBeds, getBedOccupancySummary, getActiveAdmissionForPatient };
