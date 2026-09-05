const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');
const controller = require('../controllers/notification.controller');
const router = express.Router();
router.use(authenticate);
router.get('/', asyncHandler(controller.list));
router.patch('/:id/read', asyncHandler(controller.markRead));
module.exports = router;
