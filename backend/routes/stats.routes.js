const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const controller = require('../controllers/stats.controller');

const router = express.Router();
router.use(authenticate);

router.get('/summary', authorize('RECEPTIONIST', 'ADMIN'), asyncHandler(controller.getSummary));

module.exports = router;
