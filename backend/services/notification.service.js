const pool = require('../config/db');
async function listForUser(userId) {
  const [rows] = await pool.query(`SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC`, [userId]);
  return rows;
}
async function markRead(id, userId) {
  await pool.query(`UPDATE notifications SET is_read=TRUE WHERE notification_id=? AND user_id=?`, [id, userId]);
  const [[row]] = await pool.query(`SELECT * FROM notifications WHERE notification_id=? AND user_id=?`, [id, userId]);
  return row || null;
}
module.exports = { listForUser, markRead };
