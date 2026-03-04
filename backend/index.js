require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to the database when the Vercel serverless function starts
connectDB();

// Export the Express API
module.exports = app;
