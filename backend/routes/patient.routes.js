const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const patientController = require('../controllers/patient.controller');

router.use(authenticate);

router.get('/search', authorize('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'), asyncHandler(patientController.search));
router.post('/register', authorize('RECEPTIONIST', 'ADMIN'), asyncHandler(patientController.register));
router.get('/:id', authorize('PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'), asyncHandler(patientController.getProfile));
router.put('/:id', authorize('PATIENT', 'RECEPTIONIST', 'ADMIN'), asyncHandler(patientController.updateProfile));
router.get('/:id/history', authorize('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN'), asyncHandler(patientController.getMedicalHistory));

module.exports = router;
