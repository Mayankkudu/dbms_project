const pool = require('../config/db');

async function findAccountByUsername(username) {
  const [rows] = await pool.query(
    `SELECT ua.user_id, ua.person_id, ua.username, ua.password_hash, ua.is_active,
            r.role_name, p.first_name, p.last_name
     FROM user_accounts ua
     JOIN roles r ON r.role_id = ua.role_id
     JOIN persons p ON p.person_id = ua.person_id
     WHERE ua.username = ?`,
    [username]
  );
  return rows[0] || null;
}

async function touchLastLogin(userId) {
  await pool.query(`UPDATE user_accounts SET last_login_at = NOW() WHERE user_id = ?`, [userId]);
}

module.exports = { findAccountByUsername, touchLastLogin };
