const { Pool } = require('pg');
require('dotenv').config();

// We can accept a single DATABASE_URL string from Supabase, or individual fields.
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'hospital_db',
    };

// Supabase requires SSL
poolConfig.ssl = { rejectUnauthorized: false };

const pool = new Pool(poolConfig);

// A small wrapper to keep compatibility with [rows] = await pool.query()
const originalQuery = pool.query.bind(pool);
pool.query = async function (text, params) {
  // convert ? to $1, $2, etc.
  let i = 1;
  const pgText = text.replace(/\?/g, () => `$${i++}`);
  
  const res = await originalQuery(pgText, params);
  
  // mock mysql2 behavior
  if (/^\s*(INSERT|UPDATE|DELETE)/i.test(pgText)) {
      if (res.rows && res.rows.length > 0) {
          const firstKey = Object.keys(res.rows[0])[0];
          return [{ insertId: res.rows[0][firstKey], affectedRows: res.rowCount }, res.fields];
      }
      return [{ affectedRows: res.rowCount }, res.fields];
  }

  return [res.rows, res.fields];
};

const originalConnect = pool.connect.bind(pool);
pool.getConnection = async function() {
    const client = await originalConnect();
    
    // polyfill mysql2 connection methods
    const clientOriginalQuery = client.query.bind(client);
    client.query = async function(text, params) {
        let i = 1;
        const pgText = text.replace(/\?/g, () => `$${i++}`);
        const res = await clientOriginalQuery(pgText, params);
        if (/^\s*(INSERT|UPDATE|DELETE)/i.test(pgText)) {
            if (res.rows && res.rows.length > 0) {
                const firstKey = Object.keys(res.rows[0])[0];
                return [{ insertId: res.rows[0][firstKey], affectedRows: res.rowCount }, res.fields];
            }
            return [{ affectedRows: res.rowCount }, res.fields];
        }
        return [res.rows, res.fields];
    };
    
    client.beginTransaction = async () => client.query('BEGIN');
    client.commit = async () => client.query('COMMIT');
    client.rollback = async () => client.query('ROLLBACK');
    // release is already client.release() in pg
    
    return client;
};

module.exports = pool;
