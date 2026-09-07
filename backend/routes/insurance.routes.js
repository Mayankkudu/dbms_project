const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const controller = require('../controllers/insurance.controller');
const router = express.Router();

router.use(authenticate);

router.post('/', authorize('RECEPTIONIST', 'ADMIN'), asyncHandler(controller.addPolicy));
router.get('/:patientId', authorize('PATIENT', 'RECEPTIONIST', 'ADMIN'), asyncHandler(controller.getActivePolicy));
router.get('/:patientId/history', authorize('PATIENT', 'RECEPTIONIST', 'ADMIN'), asyncHandler(controller.getHistory));

module.exports = router;
