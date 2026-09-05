const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const labController = require('../controllers/lab.controller');

router.use(authenticate);

// Order tests — doctors only.
router.post('/', authorize('DOCTOR'), asyncHandler(labController.orderTest));

// Lab technician work queue — placed before /:labTestId-style routes are
// not needed here since we only have static segments, but keep pending
// above any future param routes for clarity.
router.get('/pending', authorize('LAB_TECHNICIAN', 'ADMIN'), asyncHandler(labController.listPending));
router.post('/:labTestId/report', authorize('LAB_TECHNICIAN'), asyncHandler(labController.submitReport));

module.exports = router;
