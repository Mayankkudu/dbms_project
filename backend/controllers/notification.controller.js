const notificationService = require('../services/notification.service');
async function list(req, res) { res.json(await notificationService.listForUser(req.user.userId)); }
async function markRead(req, res) { const n = await notificationService.markRead(req.params.id, req.user.userId); if (!n) return res.status(404).json({ error: 'Notification not found' }); res.json(n); }
module.exports = { list, markRead };
