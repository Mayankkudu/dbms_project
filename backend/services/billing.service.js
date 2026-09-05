const pool = require('../config/db');

async function createBill({ patientId, admissionId = null, items = [] }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(`INSERT INTO bills (patient_id, admission_id) VALUES (?, ?)`, [patientId, admissionId]);
    const billId = r.insertId;
    for (const item of items) {
      if (!item.category || !item.description || item.amount == null) throw new Error('Each bill item requires category, description and amount');
      await conn.query(`INSERT INTO bill_items (bill_id, category, description, amount) VALUES (?, ?, ?, ?)`, [billId, item.category, item.description, Number(item.amount)]);
    }
    await conn.commit();
    return getBill(billId, conn);
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
async function getBill(billId, executor = pool) {
  const [[bill]] = await executor.query(`SELECT b.*, COALESCE(SUM(bi.amount),0) AS total_amount, COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.bill_id=b.bill_id),0) AS paid_amount FROM bills b LEFT JOIN bill_items bi ON bi.bill_id=b.bill_id WHERE b.bill_id=? GROUP BY b.bill_id`, [billId]);
  if (!bill) return null;
  const [items] = await executor.query(`SELECT * FROM bill_items WHERE bill_id=? ORDER BY bill_item_id`, [billId]);
  const [payments] = await executor.query(`SELECT * FROM payments WHERE bill_id=? ORDER BY paid_at DESC`, [billId]);
  return { ...bill, items, payments };
}
async function listForPatient(patientId) {
  const [rows] = await pool.query(`SELECT b.bill_id,b.patient_id,b.admission_id,b.generated_at,b.status,COALESCE(SUM(bi.amount),0) total_amount,COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.bill_id=b.bill_id),0) paid_amount FROM bills b LEFT JOIN bill_items bi ON bi.bill_id=b.bill_id WHERE b.patient_id=? GROUP BY b.bill_id ORDER BY b.generated_at DESC`, [patientId]);
  return rows;
}
async function pay(billId, { amountPaid, paymentMethod }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const bill = await getBill(billId, conn);
    if (!bill) { await conn.rollback(); return null; }
    const amount = Number(amountPaid);
    if (!(amount > 0)) throw new Error('amountPaid must be positive');
    const remaining = Number(bill.total_amount) - Number(bill.paid_amount);
    if (amount > remaining) throw new Error('Payment exceeds outstanding balance');
    const [r] = await conn.query(`INSERT INTO payments (bill_id, amount_paid, payment_method) VALUES (?, ?, ?)`, [billId, amount, paymentMethod]);
    const newPaid = Number(bill.paid_amount) + amount;
    const status = newPaid >= Number(bill.total_amount) ? 'PAID' : 'PARTIAL';
    await conn.query(`UPDATE bills SET status=? WHERE bill_id=?`, [status, billId]);
    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM payments WHERE payment_id=?`, [r.insertId]);
    return rows[0];
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
module.exports = { createBill, getBill, listForPatient, pay };
