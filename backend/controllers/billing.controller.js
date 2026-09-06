const billingService = require('../services/billing.service');
const { writeAuditLog } = require('../services/audit.service');

async function createBill(req, res) {
  const { patientId, admissionId = null, items = [] } = req.body;
  if (!patientId) return res.status(400).json({ error: 'patientId is required' });
  const bill = await billingService.createBill({ patientId, admissionId, items });
  await writeAuditLog({ userId: req.user.userId, roleName: req.user.role, action: 'INSERT', tableName: 'bills', recordId: bill.bill_id });
  res.status(201).json(bill);
}
async function getBill(req, res) {
  const bill = await billingService.getBill(req.params.billId);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  res.json(bill);
}
async function listForPatient(req, res) {
  const patientId = req.params.patientId;
  if (req.user.role === 'PATIENT' && req.user.personId !== patientId) return res.status(403).json({ error: 'Patients may only view their own bills' });
  res.json(await billingService.listForPatient(patientId));
}
async function pay(req, res) {
  const { amountPaid, paymentMethod } = req.body;
  if (!amountPaid || !paymentMethod) return res.status(400).json({ error: 'amountPaid and paymentMethod are required' });
  const payment = await billingService.pay(req.params.billId, { amountPaid, paymentMethod });
  if (!payment) return res.status(404).json({ error: 'Bill not found' });
  await writeAuditLog({ userId: req.user.userId, roleName: req.user.role, action: 'INSERT', tableName: 'payments', recordId: payment.payment_id });
  res.status(201).json(payment);
}
module.exports = { createBill, getBill, listForPatient, pay };

exports.getPending = async (req, res) => {
  const bills = await billingService.getPendingBills();
  res.json(bills);
};
