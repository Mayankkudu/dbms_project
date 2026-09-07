require('dotenv').config();
const pool = require('./config/db');

async function seedDemoData() {
    try {
        console.log("Fetching demo patient, doctor, and receptionist...");
        const [patients] = await pool.query('SELECT * FROM patients LIMIT 3');
        const [doctors] = await pool.query("SELECT * FROM persons JOIN staff ON persons.person_id = staff.staff_id JOIN user_accounts ua ON ua.person_id = persons.person_id JOIN roles r ON ua.role_id = r.role_id WHERE r.role_name = 'DOCTOR' LIMIT 2");
        const [receptionists] = await pool.query("SELECT * FROM user_accounts ua JOIN roles r ON ua.role_id = r.role_id WHERE r.role_name = 'RECEPTIONIST' LIMIT 1");
        
        if (!patients.length || !doctors.length) {
            console.error("No patients or doctors found in DB. Please run the main seed first.");
            process.exit(1);
        }

        const p1 = patients[0].patient_id;
        const p2 = patients[1]?.patient_id || p1;
        const d1 = doctors[0].person_id;
        const recUser = receptionists.length > 0 ? receptionists[0].user_id : null;

        console.log("Inserting today's appointments...");
        const [a1] = await pool.query(`
            INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, reason, status)
            VALUES (?, ?, (SELECT department_id FROM staff WHERE staff_id = ? LIMIT 1), CURRENT_TIMESTAMP + interval '1 hour', 'Routine Checkup', 'SCHEDULED')
            RETURNING appointment_id
        `, [p1, d1, d1]);
        
        const [a2] = await pool.query(`
            INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, reason, status)
            VALUES (?, ?, (SELECT department_id FROM staff WHERE staff_id = ? LIMIT 1), CURRENT_TIMESTAMP + interval '2 hours', 'Follow up', 'SCHEDULED')
            RETURNING appointment_id
        `, [p2, d1, d1]);

        console.log("Inserting waiting queue entries...");
        await pool.query(`INSERT INTO waiting_queue (patient_id, appointment_id, status) VALUES (?, ?, 'WAITING')`, [p1, a1.insertId]);
        await pool.query(`INSERT INTO waiting_queue (patient_id, appointment_id, status) VALUES (?, ?, 'WAITING')`, [p2, a2.insertId]);

        console.log("Inserting pending bills...");
        const [b1] = await pool.query(`INSERT INTO bills (patient_id, status) VALUES (?, 'PENDING') RETURNING bill_id`, [p1]); 
        await pool.query(`INSERT INTO bill_items (bill_id, category, description, amount) VALUES (?, 'CONSULTATION', 'General', 1500.00)`, [b1.insertId]);
        
        const [b2] = await pool.query(`INSERT INTO bills (patient_id, status) VALUES (?, 'PENDING') RETURNING bill_id`, [p2]); 
        await pool.query(`INSERT INTO bill_items (bill_id, category, description, amount) VALUES (?, 'LAB', 'Blood test', 2500.00)`, [b2.insertId]);

        if (recUser) {
            console.log("Inserting audit logs...");
            await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES (?, 'INSERT', 'patients', 'demo-record')`, [recUser]);
            await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES (?, 'UPDATE', 'appointments', 'demo-record')`, [recUser]);
            await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES (?, 'INSERT', 'waiting_queue', 'demo-record')`, [recUser]);
        }

        console.log("Successfully added today's demo data for the Receptionist Dashboard!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedDemoData();
