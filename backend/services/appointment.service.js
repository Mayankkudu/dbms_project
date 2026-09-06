const pool = require('../config/db');

async function bookAppointment({ patientId, doctorId, departmentId = null, scheduledAt, reason }) {
  const [result] = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, reason) VALUES (?, ?, ?, ?, ?)`,
    [patientId, doctorId, departmentId, scheduledAt, reason]
  );
  const [rows] = await pool.query(`SELECT * FROM appointments WHERE appointment_id = ?`, [result.insertId]);
  return rows[0];
}

async function listForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT a.*, CONCAT(dp.first_name,' ',dp.last_name) AS doctor_name, d.specialization
     FROM appointments a
     JOIN doctors d ON d.doctor_id = a.doctor_id
     JOIN persons dp ON dp.person_id = d.doctor_id
     WHERE a.patient_id = ? ORDER BY a.scheduled_at DESC`,
    [patientId]
  );
  return rows;
}

async function listForDoctor(doctorId) {
  const [rows] = await pool.query(
    `SELECT a.*, CONCAT(pp.first_name,' ',pp.last_name) AS patient_name
     FROM appointments a
     JOIN persons pp ON pp.person_id = a.patient_id
     WHERE a.doctor_id = ? ORDER BY a.scheduled_at ASC`,
    [doctorId]
  );
  return rows;
}

async function listDoctors() {
  const [rows] = await pool.query(
    `SELECT d.doctor_id, CONCAT(p.first_name,' ',p.last_name) AS name, d.specialization, dep.name AS department_name
     FROM doctors d
     JOIN persons p ON p.person_id = d.doctor_id
     LEFT JOIN staff s ON s.staff_id = d.doctor_id
     LEFT JOIN departments dep ON dep.department_id = s.department_id
     ORDER BY name`
  );
  return rows;
}

async function updateStatus(appointmentId, status) {
  await pool.query(`UPDATE appointments SET status = ? WHERE appointment_id = ?`, [status, appointmentId]);
  const [rows] = await pool.query(`SELECT * FROM appointments WHERE appointment_id = ?`, [appointmentId]);
  return rows[0] || null;
}

module.exports = { bookAppointment, listForPatient, listForDoctor, listDoctors, updateStatus };

async function getTodayAppointments() {
  const [rows] = await pool.query(`
    SELECT a.*, p.first_name, p.last_name, d.first_name as doc_first, d.last_name as doc_last
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    JOIN persons d ON a.doctor_id = d.person_id
    WHERE CAST(a.scheduled_at AS DATE) = CURRENT_DATE
    ORDER BY a.scheduled_at ASC
  `);
  return rows;
}
module.exports.getTodayAppointments = getTodayAppointments;
