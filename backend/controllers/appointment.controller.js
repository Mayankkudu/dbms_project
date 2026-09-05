const appointmentService = require('../services/appointment.service');
const { writeAuditLog } = require('../services/audit.service');

async function book(req, res) {
  const { patientId, doctorId, departmentId, scheduledAt, reason } = req.body;
  const appt = await appointmentService.bookAppointment({ patientId, doctorId, departmentId, scheduledAt, reason });

  await writeAuditLog({
    userId: req.user.userId, roleName: req.user.role, action: 'INSERT',
    tableName: 'appointments', recordId: appt.appointment_id,
  });

  res.status(201).json(appt);
}

async function listForPatient(req, res) {
  const { patientId } = req.params;
  if (req.user.role === 'PATIENT' && req.user.personId !== patientId) {
    return res.status(403).json({ error: 'Patients may only view their own appointments' });
  }
  res.json(await appointmentService.listForPatient(patientId));
}

async function listForDoctor(req, res) {
  const doctorId = req.params.doctorId || req.user.personId;
  if (req.user.role === 'DOCTOR' && req.user.personId !== doctorId) {
    return res.status(403).json({ error: 'Doctors may only view their own appointments' });
  }
  res.json(await appointmentService.listForDoctor(doctorId));
}

async function listDoctors(req, res) {
  res.json(await appointmentService.listDoctors());
}

async function updateStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${validStatuses.join(', ')}` });
  }
  const appt = await appointmentService.updateStatus(req.params.appointmentId, status);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  res.json(appt);
}

module.exports = { book, listForPatient, listForDoctor, listDoctors, updateStatus };
