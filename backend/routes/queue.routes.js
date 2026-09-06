const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const controller = require('../controllers/queue.controller');

const router = express.Router();
router.use(authenticate);

router.get('/today', authorize('RECEPTIONIST', 'ADMIN', 'DOCTOR'), asyncHandler(controller.getToday));
router.post('/', authorize('RECEPTIONIST', 'ADMIN'), asyncHandler(controller.add));
router.post('/:id/serve', authorize('RECEPTIONIST', 'ADMIN', 'DOCTOR'), asyncHandler(controller.serve));
router.delete('/:id', authorize('RECEPTIONIST', 'ADMIN'), asyncHandler(controller.remove));

module.exports = router;
