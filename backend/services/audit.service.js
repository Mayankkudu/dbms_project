const pool = require('../config/db');

/**
 * Writes one row to audit_logs. Called explicitly from services after a
 * meaningful mutation (not every mutation — see Section 6: "do not
 * implement meaningless triggers/logs just for demonstration"). The DB also
 * has triggers for a couple of safety-critical tables (vitals, prescriptions,
 * admissions) as a second layer — this app-level log captures the acting
 * user, which triggers cannot know.
 */
async function writeAuditLog({ userId, roleName, action, tableName, recordId, fieldName = null, oldValue = null, newValue = null }) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, role_name, action, table_name, record_id, field_name, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, roleName, action, tableName, String(recordId), fieldName, oldValue, newValue]
  );
}

module.exports = { writeAuditLog };
