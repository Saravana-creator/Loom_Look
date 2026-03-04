const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render and many cloud providers
  }
});

// Test connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`✅ PostgreSQL Connected on ${client.host}`);
    client.release();
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

pool.on('error', (err) => {
  console.error(`❌ Unexpected PostgreSQL error on idle client: ${err.message}`);
  process.exit(-1);
});

module.exports = {
  pool,
  connectDB,
  // Helper for running queries
  query: (text, params) => pool.query(text, params),
};
