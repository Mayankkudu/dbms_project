const pool = require('../config/db');

async function createDiagnosis({ patientId, doctorId, admissionId = null, diagnosisText }) {
  const [result] = await pool.query(
    `INSERT INTO diagnoses (patient_id, doctor_id, admission_id, diagnosis_text) VALUES (?, ?, ?, ?)`,
    [patientId, doctorId, admissionId, diagnosisText]
  );
  const [rows] = await pool.query(`SELECT * FROM diagnoses WHERE diagnosis_id = ?`, [result.insertId]);
  return rows[0];
}

/**
 * Creates a prescription plus its line items (prescription_items) as a
 * single transaction — a prescription with zero items is meaningless, so
 * either both succeed or neither does.
 */
async function createPrescription({ patientId, doctorId, diagnosisId = null, notes = null, items = [] }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, diagnosis_id, notes) VALUES (?, ?, ?, ?)`,
      [patientId, doctorId, diagnosisId, notes]
    );
    const prescriptionId = result.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO prescription_items (prescription_id, medicine_id, dosage, duration_days)
         VALUES (?, ?, ?, ?)`,
        [prescriptionId, item.medicineId, item.dosage, item.durationDays || 1]
      );
    }

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM prescriptions WHERE prescription_id = ?`, [prescriptionId]);
    return rows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Everything still PENDING or PARTIAL across all prescriptions — this is
 * the pharmacist's work queue. Shape matches PharmacistDashboard.jsx
 * exactly: item_id, patient_name, medicine_name, dosage, duration_days,
 * dispensed_status.
 */
async function getPendingDispensingItems() {
  const [rows] = await pool.query(
    `SELECT pi.item_id, CONCAT(pp.first_name,' ',pp.last_name) AS patient_name,
            m.name AS medicine_name, pi.dosage, pi.duration_days, pi.dispensed_status
     FROM prescription_items pi
     JOIN prescriptions pr ON pr.prescription_id = pi.prescription_id
     JOIN persons pp ON pp.person_id = pr.patient_id
     JOIN medicines m ON m.medicine_id = pi.medicine_id
     WHERE pi.dispensed_status IN ('PENDING', 'PARTIAL')
     ORDER BY pr.prescribed_at ASC`
  );
  return rows;
}

async function updateDispensedStatus(itemId, status) {
  await pool.query(`UPDATE prescription_items SET dispensed_status = ? WHERE item_id = ?`, [status, itemId]);
  const [rows] = await pool.query(
    `SELECT pi.item_id, CONCAT(pp.first_name,' ',pp.last_name) AS patient_name,
            m.name AS medicine_name, pi.dosage, pi.duration_days, pi.dispensed_status
     FROM prescription_items pi
     JOIN prescriptions pr ON pr.prescription_id = pi.prescription_id
     JOIN persons pp ON pp.person_id = pr.patient_id
     JOIN medicines m ON m.medicine_id = pi.medicine_id
     WHERE pi.item_id = ?`,
    [itemId]
  );
  return rows[0] || null;
}

module.exports = { createDiagnosis, createPrescription, getPendingDispensingItems, updateDispensedStatus };
