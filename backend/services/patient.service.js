const pool = require('../config/db');

async function getPatientProfile(patientId) {
  const [rows] = await pool.query(
    `SELECT pt.patient_id, pe.first_name, pe.last_name, pe.date_of_birth, pe.gender,
            pe.phone, pe.email, pe.address_line, pe.city, pe.state, pe.pincode,
            pt.blood_group, pt.current_status,
            pt.emergency_contact_name, pt.emergency_contact_phone
     FROM patients pt
     JOIN persons pe ON pe.person_id = pt.patient_id
     WHERE pt.patient_id = ?`,
    [patientId]
  );
  return rows[0] || null;
}

// Patients may edit their own demographic info — NOT medical fields
// (that restriction is enforced by which columns this function accepts).
const EDITABLE_PATIENT_FIELDS = ['phone', 'email', 'address_line', 'city', 'state', 'pincode',
  'emergency_contact_name', 'emergency_contact_phone'];

async function updatePatientProfile(patientId, updates) {
  const personFields = {};
  const patientFields = {};

  for (const [key, value] of Object.entries(updates)) {
    if (!EDITABLE_PATIENT_FIELDS.includes(key)) continue; // silently drop disallowed fields
    if (['emergency_contact_name', 'emergency_contact_phone'].includes(key)) {
      patientFields[key] = value;
    } else {
      personFields[key] = value;
    }
  }

  if (Object.keys(personFields).length) {
    const setClause = Object.keys(personFields).map((k) => `${k} = ?`).join(', ');
    await pool.query(`UPDATE persons SET ${setClause} WHERE person_id = ?`,
      [...Object.values(personFields), patientId]);
  }
  if (Object.keys(patientFields).length) {
    const setClause = Object.keys(patientFields).map((k) => `${k} = ?`).join(', ');
    await pool.query(`UPDATE patients SET ${setClause} WHERE patient_id = ?`,
      [...Object.values(patientFields), patientId]);
  }

  return getPatientProfile(patientId);
}

async function getPatientMedicalHistory(patientId) {
  const [diagnoses] = await pool.query(
    `SELECT diagnosis_id, diagnosis_text, diagnosed_at FROM diagnoses WHERE patient_id = ? ORDER BY diagnosed_at DESC`,
    [patientId]
  );
  const [prescriptions] = await pool.query(
    `SELECT pr.prescription_id, pr.prescribed_at, pr.notes,
            JSON_ARRAYAGG(JSON_OBJECT('medicine', m.name, 'dosage', pi.dosage, 'duration_days', pi.duration_days, 'status', pi.dispensed_status)) AS items
     FROM prescriptions pr
     JOIN prescription_items pi ON pi.prescription_id = pr.prescription_id
     JOIN medicines m ON m.medicine_id = pi.medicine_id
     WHERE pr.patient_id = ?
     GROUP BY pr.prescription_id, pr.prescribed_at, pr.notes
     ORDER BY pr.prescribed_at DESC`,
    [patientId]
  );
  const [labReports] = await pool.query(
    `SELECT lt.lab_test_id, lt.test_name, lt.status, lr.result_summary, lr.completed_at
     FROM lab_tests lt LEFT JOIN lab_reports lr ON lr.lab_test_id = lt.lab_test_id
     WHERE lt.patient_id = ? ORDER BY lt.ordered_at DESC`,
    [patientId]
  );
  const [vitals] = await pool.query(
    `SELECT vital_id, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2,
            temperature_celsius, respiratory_rate, blood_glucose, risk_score, risk_level
     FROM vital_records WHERE patient_id = ? ORDER BY recorded_at ASC`,
    [patientId]
  );

  return { diagnoses, prescriptions, labReports, vitals };
}

async function searchPatients({ name, phone } = {}) {
  const clauses = [];
  const params = [];
  if (name) {
    clauses.push(`(pe.first_name LIKE ? OR pe.last_name LIKE ?)`);
    params.push(`%${name}%`, `%${name}%`);
  }
  if (phone) {
    clauses.push(`pe.phone LIKE ?`);
    params.push(`%${phone}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT pt.patient_id, pe.first_name, pe.last_name, pe.phone, pt.current_status
     FROM patients pt JOIN persons pe ON pe.person_id = pt.patient_id
     ${where} ORDER BY pe.first_name LIMIT 50`,
    params
  );
  return rows;
}

/**
 * Calls the register_patient() stored procedure, which creates the person,
 * patient, and login-account rows as a single transaction (Section 3/7).
 * The password hash is computed here (bcrypt needs to run in app code,
 * not SQL) and passed in already-hashed.
 */
async function registerPatient({ firstName, lastName, dob, gender, phone, email, username, passwordHash }) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`SELECT register_patient(?, ?, ?, ?, ?, ?, ?, ?) AS "patientId"`, [firstName, lastName, dob, gender, phone, email, username, passwordHash]); return rows[0].patientId;
  } finally {
    conn.release();
  }
}

module.exports = { getPatientProfile, updatePatientProfile, getPatientMedicalHistory, searchPatients, registerPatient };
