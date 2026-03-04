const { pool } = require('./db');

const initDb = async () => {
    try {
        const client = await pool.connect();

        // Enable uuid extension if not present
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

        console.log('🔄 Creating Tables...');

        // Users Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        avatar TEXT DEFAULT '',
        phone_encrypted TEXT DEFAULT '',
        address_encrypted TEXT DEFAULT '',
        city_encrypted TEXT DEFAULT '',
        state_encrypted TEXT DEFAULT '',
        pincode_encrypted TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT true,
        is_suspended BOOLEAN DEFAULT false,
        refresh_token TEXT,
        last_login TIMESTAMP,
        cart JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Vendors Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(150) NOT NULL,
        shop_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        logo TEXT DEFAULT '',
        banner TEXT DEFAULT '',
        contact_email VARCHAR(255) NOT NULL,
        contact_phone_encrypted TEXT DEFAULT '',
        business_address_encrypted TEXT DEFAULT '',
        gstin TEXT DEFAULT '',
        pan TEXT DEFAULT '',
        bank_details_encrypted TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'pending',
        is_verified BOOLEAN DEFAULT false,
        verification_date TIMESTAMP,
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        settings JSONB DEFAULT '{"returnPolicy": "7 days return", "shippingPolicy": "Ships within 2 days"}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Products Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        discount_price DECIMAL(10,2) DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(100) NOT NULL,
        images JSONB DEFAULT '[]'::jsonb,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        tags TEXT[],
        material VARCHAR(200),
        dimensions VARCHAR(100),
        weight VARCHAR(50),
        handmade_details JSONB,
        ratings_average DECIMAL(3,2) DEFAULT 0,
        ratings_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        total_sold INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Reviews Table (Separate from Product for SQL)
        await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Orders Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        items JSONB NOT NULL,
        shipping_address_encrypted TEXT NOT NULL,
        payment_info JSONB,
        payment_method VARCHAR(50) DEFAULT 'Card',
        payment_status VARCHAR(20) DEFAULT 'Pending',
        order_status VARCHAR(20) DEFAULT 'Processing',
        tracking_info JSONB,
        subtotal DECIMAL(10,2) NOT NULL,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // LiveSessions Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        thumbnail TEXT,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        status VARCHAR(20) DEFAULT 'Scheduled',
        meeting_link TEXT,
        max_participants INTEGER DEFAULT 100,
        registered_users JSONB DEFAULT '[]'::jsonb,
        tags TEXT[],
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Bookings Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
        booking_status VARCHAR(20) DEFAULT 'Confirmed',
        payment_status VARCHAR(20) DEFAULT 'Paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✅ Tables created successfully.');

        // Create text search config/indexes if necessary
        // await client.query(`CREATE INDEX IF NOT EXISTS product_search_idx ON products USING GIN (to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' ')));`);

        client.release();
    } catch (error) {
        console.error('❌ Table creation failed:', error);
    }
};

module.exports = initDb;
