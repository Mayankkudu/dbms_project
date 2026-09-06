const queueService = require('../services/queue.service');

exports.getToday = async (req, res) => {
    const q = await queueService.getTodayQueue();
    res.json(q);
};

exports.add = async (req, res) => {
    const { patientId, appointmentId } = req.body;
    await queueService.addToQueue(patientId, appointmentId);
    res.json({ message: "Added to queue" });
};

exports.serve = async (req, res) => {
    await queueService.markServed(req.params.id);
    res.json({ message: "Marked as served" });
};

exports.remove = async (req, res) => {
    await queueService.remove(req.params.id);
    res.json({ message: "Removed from queue" });
};
