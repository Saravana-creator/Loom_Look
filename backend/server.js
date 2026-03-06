require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const initDb = require('./config/initDb');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log(`\n🔍 Checking Database Connection...`);
        // Connect to PostgreSQL
        await connectDB();
        console.log(`✅ DB Connected.`);

        console.log(`🔄 Initializing Database Schema...`);
        // Create tables if they don't exist
        await initDb();
        console.log(`✅ Schema Initialized.`);

        const server = app.listen(PORT, () => {
            console.log(`\n🪡  =======================================`);
            console.log(`🪡  Loom Look API Server`);
            console.log(`🪡  =======================================`);
            console.log(`🚀 Server running on port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`🐘 Database: PostgreSQL`);
            console.log(`📡 API URL: http://localhost:${PORT}/api`);
            console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
            console.log(`🪡  =======================================\n`);
        });

        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            server.close(() => { console.log('Process terminated.'); process.exit(0); });
        });

        process.on('SIGINT', () => {
            console.log('\n⚠️  Server shutting down...');
            server.close(() => { console.log('✅ Server closed.'); process.exit(0); });
        });

        process.on('uncaughtException', (err) => {
            console.error('❌ Uncaught Exception:', err.message);
            server.close(() => process.exit(1));
        });

        process.on('unhandledRejection', (err) => {
            console.error('❌ Unhandled Rejection:', err.message);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
