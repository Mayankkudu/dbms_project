const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const admissionController = require('../controllers/admission.controller');

router.use(authenticate);

router.post('/', authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), asyncHandler(admissionController.admit));
router.post('/:admissionId/discharge', authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), asyncHandler(admissionController.discharge));
router.get('/beds/available', authorize('RECEPTIONIST', 'DOCTOR', 'NURSE', 'WARD_BOY', 'ADMIN'), asyncHandler(admissionController.availableBeds));
router.get('/beds/occupancy', authorize('ADMIN', 'RECEPTIONIST', 'WARD_BOY'), asyncHandler(admissionController.occupancySummary));

module.exports = router;
