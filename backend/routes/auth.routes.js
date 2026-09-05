const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', asyncHandler(authController.login));

module.exports = router;
