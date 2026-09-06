const pool = require('../config/db');

exports.getDashboardStats = async () => {
    const [[{ totalPatients }]] = await pool.query('SELECT COUNT(*) AS totalPatients FROM patients');
    const [[{ todaysAppointments }]] = await pool.query('SELECT COUNT(*) AS todaysAppointments FROM appointments WHERE CAST(scheduled_at AS DATE) = CURRENT_DATE');
    const [[{ waitingPatients }]] = await pool.query("SELECT COUNT(*) AS waitingPatients FROM waiting_queue WHERE status='WAITING'");
    const [[{ availableBeds }]] = await pool.query("SELECT COUNT(*) AS availableBeds FROM beds WHERE status='AVAILABLE'");
    const [[{ admittedPatients }]] = await pool.query("SELECT COUNT(*) AS admittedPatients FROM admissions WHERE status='ACTIVE'");
    const [[{ pendingBills }]] = await pool.query("SELECT COUNT(*) AS pendingBills FROM bills WHERE status IN ('PENDING','PARTIAL')");
    const [[{ pendingLabs }]] = await pool.query("SELECT COUNT(*) AS pendingLabs FROM lab_tests WHERE status='PENDING'");
    const [[{ criticalAlerts }]] = await pool.query("SELECT COUNT(*) AS criticalAlerts FROM critical_alerts WHERE status='OPEN'");

    return {
        totalPatients,
        todaysAppointments,
        waitingPatients,
        availableBeds,
        admittedPatients,
        pendingBills,
        pendingLabs,
        criticalAlerts
    };
};
