require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const { encrypt } = require('../utils/encryption');
const { ROLES } = require('../config/constants');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Clear existing data
        await User.deleteMany({});
        await Vendor.deleteMany({});
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // ── Create Admin ──────────────────────────────────────────────────────
        const admin = await User.create({
            name: 'Loom Look Admin',
            email: process.env.ADMIN_EMAIL || 'admin@loomlook.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@LoomLook2024',
            role: ROLES.ADMIN,
            phoneEncrypted: encrypt('9876543210'),
            isActive: true,
        });
        console.log('👑 Admin created:', admin.email);

        // ── Create Sample Users ───────────────────────────────────────────────
        const users = await User.create([
            {
                name: 'Priya Sharma',
                email: 'priya@example.com',
                password: 'User@123',
                role: ROLES.USER,
                phoneEncrypted: encrypt('9876543211'),
                cityEncrypted: encrypt('Chennai'),
                stateEncrypted: encrypt('Tamil Nadu'),
            },
            {
                name: 'Rahul Verma',
                email: 'rahul@example.com',
                password: 'User@123',
                role: ROLES.USER,
                phoneEncrypted: encrypt('9876543212'),
                cityEncrypted: encrypt('Mumbai'),
                stateEncrypted: encrypt('Maharashtra'),
            },
        ]);
        console.log(`👤 ${users.length} sample users created`);

        // ── Create Sample Vendors ─────────────────────────────────────────────
        const vendors = await Vendor.create([
            {
                name: 'Meena Devi',
                email: 'meena@weaves.com',
                password: 'Vendor@123',
                shopName: 'Meena Handloom Weaves',
                shopDescription: 'Authentic handwoven Kanjivaram and Banarasi sarees from Tamil Nadu artisans.',
                phone: '9876543213',
                address: { street: '12 Silk Road', city: 'Kanchipuram', state: 'Tamil Nadu', pincode: '631501' },
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date(),
            },
            {
                name: 'Rajesh Patel',
                email: 'rajesh@crafts.com',
                password: 'Vendor@123',
                shopName: 'Heritage Crafts by Rajesh',
                shopDescription: 'Traditional handcrafted products — pottery, jewelry, and home decor.',
                phone: '9876543214',
                address: { street: '5 Craft Lane', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date(),
            },
        ]);
        console.log(`🏪 ${vendors.length} sample vendors created`);

        // ── Create Sample Products ────────────────────────────────────────────
        const products = await Product.create([
            {
                name: 'Kanjivaram Pure Silk Saree',
                description: 'Exquisite pure silk Kanjivaram saree with traditional zari work. Handwoven by master artisans in Kanchipuram. Perfect for weddings and festive occasions.',
                price: 15999,
                discountPrice: 12999,
                stock: 25,
                category: 'Kanjivaram Sarees',
                images: [
                    { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', altText: 'Kanjivaram Silk Saree' },
                ],
                vendor: vendors[0]._id,
                tags: ['silk', 'wedding', 'kanjivaram', 'zari'],
                material: 'Pure Silk',
                handmadeDetails: { craftType: 'Handloomed', region: 'Kanchipuram, Tamil Nadu', artisan: 'Meena Weavers Guild' },
            },
            {
                name: 'Banarasi Georgette Saree',
                description: 'Luxurious Banarasi georgette saree with intricate gold zari weaving. A timeless classic that embodies the rich tradition of Varanasi silk weaving.',
                price: 8999,
                discountPrice: 7499,
                stock: 40,
                category: 'Banarasi Sarees',
                images: [
                    { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=600', altText: 'Banarasi Saree' },
                ],
                vendor: vendors[0]._id,
                tags: ['banarasi', 'georgette', 'zari', 'festive'],
                material: 'Georgette Silk',
                handmadeDetails: { craftType: 'Hand-woven', region: 'Varanasi, UP', artisan: 'Banaras Weavers' },
            },
            {
                name: 'Handcrafted Silver Jhumki Earrings',
                description: 'Beautiful oxidized silver jhumki earrings handcrafted by Rajasthani artisans. Each piece is unique with intricate filigree work.',
                price: 1299,
                discountPrice: 999,
                stock: 100,
                category: 'Handcrafted Jewelry',
                images: [
                    { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600', altText: 'Silver Jhumki' },
                ],
                vendor: vendors[1]._id,
                tags: ['jewelry', 'silver', 'jhumki', 'rajasthani'],
                material: 'Oxidized Silver',
                handmadeDetails: { craftType: 'Hand-crafted', region: 'Jaipur, Rajasthan', artisan: 'Jaipur Silversmiths' },
            },
            {
                name: 'Chanderi Cotton Silk Saree',
                description: 'Lightweight and elegant Chanderi cotton silk saree with delicate floral motifs. Perfect for summer and office wear.',
                price: 4599,
                discountPrice: 3799,
                stock: 60,
                category: 'Chanderi Sarees',
                images: [
                    { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600', altText: 'Chanderi Saree' },
                ],
                vendor: vendors[0]._id,
                tags: ['chanderi', 'cotton', 'silk', 'lightweight'],
                material: 'Cotton Silk',
                handmadeDetails: { craftType: 'Handloomed', region: 'Chanderi, MP', artisan: 'Chanderi Weavers' },
            },
            {
                name: 'Handmade Blue Pottery Vase',
                description: 'Authentic Jaipur Blue Pottery vase with traditional floral patterns. Each piece is uniquely handcrafted using ancient techniques.',
                price: 2199,
                stock: 30,
                category: 'Home Decor',
                images: [
                    { url: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=600', altText: 'Blue Pottery Vase' },
                ],
                vendor: vendors[1]._id,
                tags: ['pottery', 'blue', 'home decor', 'jaipur'],
                material: 'Traditional Clay',
                handmadeDetails: { craftType: 'Blue Pottery', region: 'Jaipur, Rajasthan', artisan: 'Jaipur Pottery Guild' },
            },
            {
                name: 'Pochampally Ikat Silk Saree',
                description: 'Stunning Pochampally Ikat silk saree with geometric patterns. A UNESCO heritage craft from Telangana.',
                price: 6999,
                discountPrice: 5999,
                stock: 35,
                category: 'Handloom Sarees',
                images: [
                    { url: 'https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=600', altText: 'Pochampally Ikat Saree' },
                ],
                vendor: vendors[0]._id,
                tags: ['ikat', 'pochampally', 'geometric', 'telangana'],
                material: 'Silk',
                handmadeDetails: { craftType: 'Ikat Weaving', region: 'Pochampally, Telangana', artisan: 'Ikat Masters' },
            },
        ]);
        console.log(`🛍️  ${products.length} sample products created`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log(`   Admin  → email: admin@loomlook.com | password: Admin@LoomLook2024`);
        console.log(`   User   → email: priya@example.com  | password: User@123`);
        console.log(`   Vendor → email: meena@weaves.com   | password: Vendor@123`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();
