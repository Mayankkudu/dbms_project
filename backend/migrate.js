require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS waiting_queue (
                queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                patient_id VARCHAR(36) NOT NULL REFERENCES patients(patient_id),
                appointment_id INT REFERENCES appointments(appointment_id),
                queue_number SERIAL,
                checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'WAITING'
            );
        `);
        console.log("waiting_queue table created.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
migrate();
