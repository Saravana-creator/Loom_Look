const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendTokenResponse } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { ROLES } = require('../config/constants');
const { encrypt, decrypt } = require('../utils/encryption');

// ─────────────────────────────────────────────
//  USER AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
    const { name, email, password, phone, address, city, state, pincode } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return errorResponse(res, 409, 'Email already registered.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query(
        `INSERT INTO users (name, email, password, role, phone_encrypted, address_encrypted, city_encrypted, state_encrypted, pincode_encrypted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, role, created_at`,
        [name, email, hashedPassword, ROLES.USER,
            encrypt(phone || ''), encrypt(address || ''), encrypt(city || ''),
            encrypt(state || ''), encrypt(pincode || '')]
    );

    const user = result.rows[0];
    const payload = { id: user.id, role: ROLES.USER, email: user.email };
    const refreshToken = generateRefreshToken(payload);

    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);

    sendTokenResponse(user, 201, res, ROLES.USER, refreshToken);
};

/**
 * POST /api/auth/login
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, ROLES.USER]);
    const user = result.rows[0];
    if (!user) return errorResponse(res, 401, 'Invalid email or password.');
    if (user.is_suspended) return errorResponse(res, 403, 'Your account has been suspended.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid email or password.');

    const payload = { id: user.id, role: ROLES.USER, email: user.email };
    const refreshToken = generateRefreshToken(payload);

    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);

    sendTokenResponse(user, 200, res, ROLES.USER, refreshToken);
};

// ─────────────────────────────────────────────
//  VENDOR AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/auth/vendor/register
 */
const registerVendor = async (req, res) => {
    const { name, email, password, shopName, shopDescription, phone, address, gstNumber } = req.body;

    const existing = await query('SELECT id FROM vendors WHERE contact_email = $1', [email]);
    if (existing.rows.length > 0) return errorResponse(res, 409, 'Email already registered.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a user record first, then a vendor record linked to it
    const userResult = await query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'vendor') RETURNING id, name, email`,
        [name, email, hashedPassword]
    );
    const user = userResult.rows[0];

    const vendorResult = await query(
        `INSERT INTO vendors (user_id, company_name, shop_name, description, contact_email, contact_phone_encrypted, business_address_encrypted, gstin, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id, shop_name, status`,
        [user.id, name, shopName, shopDescription || '', email, encrypt(phone || ''), encrypt(address || ''), gstNumber || '']
    );
    const vendor = vendorResult.rows[0];

    return successResponse(res, 201, 'Registration successful! Awaiting admin approval.', {
        id: vendor.id,
        name: user.name,
        email: user.email,
        shopName: vendor.shop_name,
        status: vendor.status,
    });
};

/**
 * POST /api/auth/vendor/login
 */
const loginVendor = async (req, res) => {
    const { email, password } = req.body;

    const result = await query(
        `SELECT u.*, v.id as vendor_id, v.status, v.shop_name
         FROM users u JOIN vendors v ON v.user_id = u.id
         WHERE u.email = $1 AND u.role = 'vendor'`,
        [email]
    );
    const vendor = result.rows[0];
    if (!vendor) return errorResponse(res, 401, 'Invalid email or password.');
    if (vendor.is_suspended) return errorResponse(res, 403, 'Your vendor account has been suspended.');
    if (vendor.status !== 'approved') {
        return errorResponse(res, 403, `Your account is ${vendor.status}. Please wait for admin approval.`);
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid email or password.');

    // Use vendor_id as the JWT id so vendor endpoints work
    const tokenUser = {
        id: vendor.vendor_id,
        email: vendor.email,
        role: ROLES.VENDOR,
        shopName: vendor.shop_name,
        status: vendor.status
    };
    const payload = { id: tokenUser.id, role: ROLES.VENDOR, email: tokenUser.email };
    const refreshToken = generateRefreshToken(payload);

    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, vendor.id]);

    sendTokenResponse(tokenUser, 200, res, ROLES.VENDOR, refreshToken);
};

// ─────────────────────────────────────────────
//  ADMIN AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 */
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, ROLES.ADMIN]);
    const admin = result.rows[0];
    if (!admin) return errorResponse(res, 401, 'Invalid admin credentials.');
    if (admin.is_suspended) return errorResponse(res, 403, 'Admin account is suspended.');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid admin credentials.');

    const payload = { id: admin.id, role: ROLES.ADMIN, email: admin.email };
    const refreshToken = generateRefreshToken(payload);

    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, admin.id]);

    sendTokenResponse(admin, 200, res, ROLES.ADMIN, refreshToken);
};

// ─────────────────────────────────────────────
//  SHARED
// ─────────────────────────────────────────────

const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return errorResponse(res, 401, 'No refresh token provided.');
        const decoded = verifyRefreshToken(token);
        const payload = { id: decoded.id, role: decoded.role, email: decoded.email };
        const newAccessToken = generateAccessToken(payload);
        return successResponse(res, 200, 'Token refreshed.', { accessToken: newAccessToken });
    } catch {
        return errorResponse(res, 401, 'Invalid or expired refresh token.');
    }
};

const logout = async (req, res) => {
    res.cookie('refreshToken', '', { expires: new Date(0), httpOnly: true });
    if (req.user) {
        await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    }
    return successResponse(res, 200, 'Logged out successfully.');
};

const getMe = async (req, res) => {
    if (req.user.role === 'vendor') {
        const result = await query(
            `SELECT v.id as "_id", v.id as "id", v.*, u.name, u.email, v.company_name as "companyName", v.shop_name as "shopName"
             FROM vendors v JOIN users u ON u.id = v.user_id WHERE v.id = $1`,
            [req.user.id]
        );
        const vendor = result.rows[0];
        if (!vendor) return errorResponse(res, 404, 'Vendor not found.');

        // Decrypt vendor specific fields
        vendor.phone = decrypt(vendor.contact_phone_encrypted);
        vendor.address = decrypt(vendor.business_address_encrypted);

        return successResponse(res, 200, 'Vendor profile fetched.', vendor);
    }

    const result = await query(
        `SELECT id as "_id", id, name, email, role, avatar, is_active as "isActive", 
                is_suspended as "isSuspended", last_login as "lastLogin", created_at as "createdAt",
                phone_encrypted, address_encrypted, city_encrypted, state_encrypted, pincode_encrypted
         FROM users WHERE id = $1`,
        [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return errorResponse(res, 404, 'User not found.');

    user.phone = decrypt(user.phone_encrypted);
    user.address = decrypt(user.address_encrypted);
    user.city = decrypt(user.city_encrypted);
    user.state = decrypt(user.state_encrypted);
    user.pincode = decrypt(user.pincode_encrypted);

    return successResponse(res, 200, 'Profile fetched.', user);
};

const updateProfile = async (req, res) => {
    const { name, phone, address, city, state, pincode, avatar } = req.body;

    if (req.user.role === 'vendor') {
        const result = await query(
            `UPDATE vendors SET company_name = $1, contact_phone_encrypted = $2, logo = $3, updated_at = NOW()
             WHERE id = $4 RETURNING id as "_id", id, *`,
            [name, encrypt(phone || ''), avatar || '', req.user.id]
        );
        return successResponse(res, 200, 'Vendor profile updated.', result.rows[0]);
    }

    const result = await query(
        `UPDATE users SET name = $1, avatar = $2, phone_encrypted = $3, address_encrypted = $4,
         city_encrypted = $5, state_encrypted = $6, pincode_encrypted = $7, updated_at = NOW()
         WHERE id = $8 RETURNING id as "_id", id, name, email, role, avatar, is_active as "isActive"`,
        [name, avatar || '', encrypt(phone || ''), encrypt(address || ''),
            encrypt(city || ''), encrypt(state || ''), encrypt(pincode || ''), req.user.id]
    );
    return successResponse(res, 200, 'Profile updated successfully.', result.rows[0]);
};

module.exports = { registerUser, loginUser, registerVendor, loginVendor, loginAdmin, refreshToken, logout, getMe, updateProfile };
