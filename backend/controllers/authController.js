const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendTokenResponse } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { ROLES } = require('../config/constants');
const { encrypt } = require('../utils/encryption');

// ─────────────────────────────────────────────
//  USER AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new user
 */
const registerUser = async (req, res) => {
    const { name, email, password, phone, address, city, state, pincode } = req.body;

    // Check existing email
    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 409, 'Email already registered.');

    // Encrypt personal data using AES
    const user = await User.create({
        name,
        email,
        password,
        role: ROLES.USER,
        phoneEncrypted: encrypt(phone || ''),
        addressEncrypted: encrypt(address || ''),
        cityEncrypted: encrypt(city || ''),
        stateEncrypted: encrypt(state || ''),
        pincodeEncrypted: encrypt(pincode || ''),
    });

    const refreshToken = sendTokenResponse(user, 201, res, ROLES.USER);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
};

/**
 * POST /api/auth/login
 * Login user
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: ROLES.USER }).select('+password');
    if (!user) return errorResponse(res, 401, 'Invalid email or password.');
    if (user.isSuspended) return errorResponse(res, 403, 'Your account has been suspended.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid email or password.');

    const refreshToken = sendTokenResponse(user, 200, res, ROLES.USER);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
};

// ─────────────────────────────────────────────
//  VENDOR AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/auth/vendor/register
 * Register a vendor — pending admin approval
 */
const registerVendor = async (req, res) => {
    const { name, email, password, shopName, shopDescription, phone, address, gstNumber } = req.body;

    const existing = await Vendor.findOne({ email });
    if (existing) return errorResponse(res, 409, 'Email already registered.');

    const vendor = await Vendor.create({
        name,
        email,
        password,
        shopName,
        shopDescription,
        phone,
        address,
        gstNumber,
        status: 'pending',
    });

    return successResponse(res, 201, 'Registration successful! Awaiting admin approval.', {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        shopName: vendor.shopName,
        status: vendor.status,
    });
};

/**
 * POST /api/auth/vendor/login
 * Login vendor
 */
const loginVendor = async (req, res) => {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email }).select('+password');
    if (!vendor) return errorResponse(res, 401, 'Invalid email or password.');
    if (vendor.isSuspended) return errorResponse(res, 403, 'Your vendor account has been suspended.');
    if (vendor.status !== 'approved') {
        return errorResponse(res, 403, `Your account is ${vendor.status}. Please wait for admin approval.`);
    }

    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid email or password.');

    const refreshToken = sendTokenResponse(vendor, 200, res, ROLES.VENDOR);
    vendor.refreshToken = refreshToken;
    vendor.lastLogin = new Date();
    await vendor.save({ validateBeforeSave: false });
};

// ─────────────────────────────────────────────
//  ADMIN AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Admin login using env credentials
 */
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    // Admin is a special user record
    const admin = await User.findOne({ email, role: ROLES.ADMIN }).select('+password');
    if (!admin) return errorResponse(res, 401, 'Invalid admin credentials.');

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return errorResponse(res, 401, 'Invalid admin credentials.');

    const refreshToken = sendTokenResponse(admin, 200, res, ROLES.ADMIN);
    admin.refreshToken = refreshToken;
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });
};

// ─────────────────────────────────────────────
//  SHARED
// ─────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
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

/**
 * POST /api/auth/logout
 * Logout — clear cookie
 */
const logout = async (req, res) => {
    res.cookie('refreshToken', '', {
        expires: new Date(0),
        httpOnly: true,
    });

    // Clear refresh token in DB
    if (req.user) {
        if (req.user.role === 'vendor') {
            await Vendor.findByIdAndUpdate(req.user.id, { refreshToken: '' });
        } else {
            await User.findByIdAndUpdate(req.user.id, { refreshToken: '' });
        }
    }

    return successResponse(res, 200, 'Logged out successfully.');
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
const getMe = async (req, res) => {
    if (req.user.role === 'vendor') {
        const vendor = await Vendor.findById(req.user.id);
        return successResponse(res, 200, 'Vendor profile fetched.', vendor);
    }
    const user = await User.findById(req.user.id);
    const userData = user.toObject();
    // Add decrypted fields
    userData.phone = user.decryptField(user.phoneEncrypted);
    userData.address = user.decryptField(user.addressEncrypted);
    userData.city = user.decryptField(user.cityEncrypted);
    userData.state = user.decryptField(user.stateEncrypted);
    userData.pincode = user.decryptField(user.pincodeEncrypted);
    return successResponse(res, 200, 'Profile fetched.', userData);
};

/**
 * PUT /api/auth/me
 * Update user profile
 */
const updateProfile = async (req, res) => {
    const { name, phone, address, city, state, pincode, avatar } = req.body;

    if (req.user.role === 'vendor') {
        const vendor = await Vendor.findByIdAndUpdate(
            req.user.id,
            { name, phone, address, avatar },
            { new: true, runValidators: true }
        );
        return successResponse(res, 200, 'Vendor profile updated.', vendor);
    }

    const updateData = {
        name,
        avatar,
        phoneEncrypted: encrypt(phone || ''),
        addressEncrypted: encrypt(address || ''),
        cityEncrypted: encrypt(city || ''),
        stateEncrypted: encrypt(state || ''),
        pincodeEncrypted: encrypt(pincode || ''),
    };

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true,
    });

    return successResponse(res, 200, 'Profile updated successfully.', user);
};

module.exports = {
    registerUser,
    loginUser,
    registerVendor,
    loginVendor,
    loginAdmin,
    refreshToken,
    logout,
    getMe,
    updateProfile,
};
