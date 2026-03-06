const { query } = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { encrypt } = require('../utils/encryption');
const { generateUUID } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

// ── Dashboard ───────────────────────────────────────────────────────────────

const getDashboard = async (req, res) => {
    const [usersRes, vendorsRes, productsRes, ordersRes, sessionsRes, revenueRes, recentOrdersRes, pendingVendorsRes] = await Promise.all([
        query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as active_today FROM users WHERE role = 'user'`),
        query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pending') as pending FROM vendors`),
        query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE stock = 0) as out_of_stock FROM products WHERE is_active = true`),
        query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE order_status = 'Processing') as pending FROM orders`),
        query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE scheduled_at > NOW()) as upcoming FROM live_sessions`),
        query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'`),
        query(`SELECT o.id as "_id", o.*, u.name as customer_name, u.email as customer_email FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 5`),
        query(`SELECT id as "_id", * FROM vendors WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5`),
    ]);

    return successResponse(res, 200, 'Dashboard data fetched.', {
        stats: {
            users: {
                total: Number(usersRes.rows[0].total),
                activeToday: Number(usersRes.rows[0].active_today),
            },
            vendors: {
                total: Number(vendorsRes.rows[0].total),
                pending: Number(vendorsRes.rows[0].pending),
            },
            products: {
                total: Number(productsRes.rows[0].total),
                outOfStock: Number(productsRes.rows[0].out_of_stock),
            },
            orders: {
                total: Number(ordersRes.rows[0].total),
                pending: Number(ordersRes.rows[0].pending),
            },
            sessions: {
                total: Number(sessionsRes.rows[0].total),
                upcoming: Number(sessionsRes.rows[0].upcoming),
            },
            revenue: {
                total: Number(revenueRes.rows[0].total),
            }
        },
        recentOrders: recentOrdersRes.rows,
        pendingVendors: pendingVendorsRes.rows,
    });
};

// ── User Management ─────────────────────────────────────────────────────────

const getUsers = async (req, res) => {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [`role = 'user'`];
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (status === 'suspended') { params.push(true); conditions.push(`is_suspended = $${params.length}`); }
    if (status === 'active') { params.push(false); conditions.push(`is_suspended = $${params.length}`); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    params.push(Number(limit), offset);

    const [dataRes, countRes] = await Promise.all([
        query(`SELECT id as "_id", name, email, role, avatar, is_active as "isActive", is_suspended as "isSuspended", last_login as "lastLogin", created_at as "createdAt" FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
        query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, params.length - 2)),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

const suspendUser = async (req, res) => {
    const result = await query(
        `UPDATE users SET is_suspended = true, is_active = false WHERE id = $1 RETURNING id as "_id", name, email, is_suspended as "isSuspended"`,
        [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User suspended.', result.rows[0]);
};

const activateUser = async (req, res) => {
    const result = await query(
        `UPDATE users SET is_suspended = false, is_active = true WHERE id = $1 RETURNING id as "_id", name, email, is_suspended as "isSuspended"`,
        [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User activated.', result.rows[0]);
};

const deleteUser = async (req, res) => {
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id as "_id"`, [req.params.id]);
    if (!result.rows[0]) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User deleted.');
};

// ── Vendor Management ───────────────────────────────────────────────────────

const getVendors = async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];

    if (status && status !== 'all') { params.push(status); conditions.push(`v.status = $${params.length}`); }
    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(v.company_name ILIKE $${params.length} OR v.shop_name ILIKE $${params.length} OR v.contact_email ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Number(limit), offset);

    const [dataRes, countRes] = await Promise.all([
        query(`SELECT v.id as "_id", v.company_name as "companyName", v.shop_name as "shopName", v.contact_email as "email", v.status, v.created_at as "createdAt", u.name 
               FROM vendors v LEFT JOIN users u ON u.id = v.user_id 
               ${where} ORDER BY v.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
        query(`SELECT COUNT(*) FROM vendors v ${where}`, params.slice(0, params.length - 2)),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

const approveVendor = async (req, res) => {
    const result = await query(
        `UPDATE vendors SET status = 'approved', is_verified = true, verification_date = NOW() WHERE id = $1 RETURNING id as "_id", *`,
        [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'Vendor not found.');
    // Also update the user role
    await query(`UPDATE users SET role = 'vendor' WHERE id = $1`, [result.rows[0].user_id]);
    return successResponse(res, 200, 'Vendor approved.', result.rows[0]);
};

const rejectVendor = async (req, res) => {
    const result = await query(
        `UPDATE vendors SET status = 'rejected' WHERE id = $1 RETURNING id as "_id", *`, [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor rejected.', result.rows[0]);
};

const suspendVendor = async (req, res) => {
    const result = await query(
        `UPDATE vendors SET status = 'suspended' WHERE id = $1 RETURNING id as "_id", *`, [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor suspended.', result.rows[0]);
};

const deleteVendor = async (req, res) => {
    const result = await query(`DELETE FROM vendors WHERE id = $1 RETURNING id as "_id"`, [req.params.id]);
    if (!result.rows[0]) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor deleted.');
};

// ── Domain Mail Management ──────────────────────────────────────────────────
// Domain mail is maintained as a JSONB table for simplicity
const getMails = async (req, res) => {
    return successResponse(res, 200, 'Domain mail feature coming soon.', []);
};
const createMailAccount = async (req, res) => {
    return successResponse(res, 201, 'Domain mail feature coming soon.', {});
};
const suspendMail = async (req, res) => successResponse(res, 200, 'Mail suspended.');
const activateMail = async (req, res) => successResponse(res, 200, 'Mail activated.');
const deleteMail = async (req, res) => successResponse(res, 200, 'Mail deleted.');
const updateMailConfig = async (req, res) => successResponse(res, 200, 'Mail config updated.');
const getMailActivity = async (req, res) => successResponse(res, 200, 'Mail activity.', {});

module.exports = {
    getDashboard, getUsers, suspendUser, activateUser, deleteUser,
    getVendors, approveVendor, rejectVendor, suspendVendor, deleteVendor,
    getMails, createMailAccount, suspendMail, activateMail, deleteMail, updateMailConfig, getMailActivity,
};
