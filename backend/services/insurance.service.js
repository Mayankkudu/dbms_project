const pool = require('../config/db');

/**
 * Returns the patient's currently active policy, or null if none exists.
 * A patient may have old inactive policies (see add_insurance_policy, which
 * deactivates the previous one when a new policy is added) — only the
 * active one is surfaced here.
 */
async function getActivePolicy(patientId) {
  const [rows] = await pool.query(
    `SELECT policy_id, patient_id, provider_name, policy_number, policy_type,
            coverage_amount, coverage_percent, valid_from, valid_till, is_active
     FROM insurance_policies
     WHERE patient_id = ? AND is_active = TRUE
     ORDER BY created_at DESC
     LIMIT 1`,
    [patientId]
  );
  return rows[0] || null;
}

/**
 * Full policy history for a patient (active + past), most recent first —
 * used by admin/receptionist views that need the full picture.
 */
async function getPolicyHistory(patientId) {
  const [rows] = await pool.query(
    `SELECT policy_id, provider_name, policy_number, policy_type,
            coverage_amount, coverage_percent, valid_from, valid_till,
            is_active, created_at
     FROM insurance_policies
     WHERE patient_id = ?
     ORDER BY created_at DESC`,
    [patientId]
  );
  return rows;
}

/**
 * Calls the add_insurance_policy() stored procedure, which deactivates any
 * previous active policy and inserts the new one as a single transaction
 * (same pattern as patientService.registerPatient calling register_patient()).
 */
async function addPolicy({ patientId, providerName, policyNumber, policyType, coverageAmount, coveragePercent, validFrom, validTill }) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT add_insurance_policy(?, ?, ?, ?, ?, ?, ?, ?) AS "policyId"`,
      [patientId, providerName, policyNumber, policyType, coverageAmount, coveragePercent, validFrom, validTill]
    );
    return rows[0].policyId;
  } finally {
    conn.release();
  }
}

async function getPolicyById(policyId) {
  const [rows] = await pool.query(
    `SELECT policy_id, patient_id, provider_name, policy_number, policy_type,
            coverage_amount, coverage_percent, valid_from, valid_till, is_active
     FROM insurance_policies WHERE policy_id = ?`,
    [policyId]
  );
  return rows[0] || null;
}

module.exports = { getActivePolicy, getPolicyHistory, addPolicy, getPolicyById };
