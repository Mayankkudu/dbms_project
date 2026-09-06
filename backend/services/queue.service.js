const pool = require('../config/db');

exports.getTodayQueue = async () => {
    const [rows] = await pool.query(`
        SELECT q.*, p.first_name, p.last_name, a.scheduled_at, d.first_name as doc_first, d.last_name as doc_last
        FROM waiting_queue q
        JOIN patients p ON q.patient_id = p.patient_id
        LEFT JOIN appointments a ON q.appointment_id = a.appointment_id
        LEFT JOIN persons d ON a.doctor_id = d.person_id
        WHERE CAST(q.checkin_time AS DATE) = CURRENT_DATE
        ORDER BY q.queue_number ASC
    `);
    return rows;
};

exports.addToQueue = async (patientId, appointmentId = null) => {
    const [[{ queue_id }]] = await pool.query(`
        INSERT INTO waiting_queue (patient_id, appointment_id)
        VALUES ($1, $2)
        RETURNING queue_id
    `, [patientId, appointmentId]);
    return queue_id;
};

exports.markServed = async (queueId) => {
    await pool.query("UPDATE waiting_queue SET status='SERVED' WHERE queue_id = $1", [queueId]);
};

exports.remove = async (queueId) => {
    await pool.query("UPDATE waiting_queue SET status='CANCELLED' WHERE queue_id = $1", [queueId]);
};
