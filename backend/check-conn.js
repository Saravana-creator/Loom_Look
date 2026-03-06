require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // 5 seconds timeout
});

async function test() {
    console.log('Testing connection to:', process.env.DATABASE_URL.split('@')[1]); // Log host part only for security
    try {
        const client = await pool.connect();
        console.log('✅ Success!');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

test();
