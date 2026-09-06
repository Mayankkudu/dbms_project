const statsService = require('../services/stats.service');

exports.getSummary = async (req, res) => {
    const stats = await statsService.getDashboardStats();
    res.json(stats);
};
