require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        const client = await pool.connect();
        console.log('--- DB CONNECTION SUCCESS ---');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('Database Info:', res.rows[0]);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('--- DB CONNECTION FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

test();
