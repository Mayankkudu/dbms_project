const pool = require('./config/db');

async function test() {
    try {
        const [rows] = await pool.query('SELECT 1 as result');
        console.log("DB connection successful! Result:", rows);
        process.exit(0);
    } catch (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    }
}
test();
