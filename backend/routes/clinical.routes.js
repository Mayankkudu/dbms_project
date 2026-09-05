const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const clinicalController = require('../controllers/clinical.controller');

router.use(authenticate);

// Diagnoses & prescriptions are clinical decisions — doctors only.
router.post('/diagnoses', authorize('DOCTOR'), asyncHandler(clinicalController.createDiagnosis));
router.post('/prescriptions', authorize('DOCTOR'), asyncHandler(clinicalController.createPrescription));

// Dispensing queue — pharmacist only.
router.get('/pharmacy/pending', authorize('PHARMACIST', 'ADMIN'), asyncHandler(clinicalController.pendingDispensing));
router.patch('/pharmacy/items/:itemId', authorize('PHARMACIST'), asyncHandler(clinicalController.updateDispensedStatus));

module.exports = router;
