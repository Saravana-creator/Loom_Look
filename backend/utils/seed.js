require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('../config/db');
const initDb = require('../config/initDb');

const seed = async () => {
    try {
        await connectDB();
        await initDb();

        console.log('🌱 Seeding database...');

        // Create Admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@loomlook.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@LoomLook2024';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (existing.rows.length === 0) {
            await pool.query(
                `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')`,
                ['Admin', adminEmail, hashedPassword]
            );
            console.log(`✅ Admin user created: ${adminEmail}`);
        } else {
            console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
        }

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
