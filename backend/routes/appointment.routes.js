const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const appointmentController = require('../controllers/appointment.controller');

router.use(authenticate);

router.get('/doctors', authorize('PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN'), asyncHandler(appointmentController.listDoctors));
router.post('/', authorize('RECEPTIONIST', 'PATIENT', 'ADMIN'), asyncHandler(appointmentController.book));
router.get('/today', authorize('RECEPTIONIST', 'ADMIN'), asyncHandler(appointmentController.getToday));
router.get('/patient/:patientId', authorize('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN'), asyncHandler(appointmentController.listForPatient));
router.get('/doctor/:doctorId?', authorize('DOCTOR', 'ADMIN'), asyncHandler(appointmentController.listForDoctor));
router.patch('/:appointmentId/status', authorize('DOCTOR', 'RECEPTIONIST', 'ADMIN'), asyncHandler(appointmentController.updateStatus));


module.exports = router;

