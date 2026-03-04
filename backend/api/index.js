require('dotenv').config();
const app = require('../app');
const { connectDB } = require('../config/db');
const initDb = require('../config/initDb');

// Connect to PostgreSQL and initialize tables
(async () => {
    await connectDB();
    await initDb();
})();

// Export the Express app as a serverless function
module.exports = app;
