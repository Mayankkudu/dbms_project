const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const vitalController = require('../controllers/vital.controller');

router.use(authenticate);

// Only clinical staff record vitals — a receptionist or pharmacist token gets 403.
router.post('/', authorize('NURSE', 'DOCTOR'), asyncHandler(vitalController.createVital));
router.get('/patient/:patientId', authorize('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN'), asyncHandler(vitalController.listForPatient));
router.get('/alerts/open', authorize('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'), asyncHandler(vitalController.listOpenAlerts));
router.get('/alerts/:alertId/explain', authorize('DOCTOR', 'NURSE', 'ADMIN'), asyncHandler(vitalController.explainOpenAlert));
router.post('/alerts/:alertId/acknowledge', authorize('DOCTOR'), asyncHandler(vitalController.acknowledgeAlert));

module.exports = router;
