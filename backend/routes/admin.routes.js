const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminService = require('../services/admin.service');

router.use(authenticate, authorize('ADMIN'));

router.get('/analytics', asyncHandler(async (req, res) => {
  const [summary, registrations, byDepartment, alertsOverTime] = await Promise.all([
    adminService.getSummaryStats(),
    adminService.getRegistrationsByDay(),
    adminService.getPatientsByDepartment(),
    adminService.getAlertsOverTime(),
  ]);
  res.json({ summary, registrations, byDepartment, alertsOverTime });
}));

router.get('/audit-logs', asyncHandler(async (req, res) => {
  res.json(await adminService.getAuditLogs({ limit: req.query.limit }));
}));

module.exports = router;
