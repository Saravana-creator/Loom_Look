const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DomainMail = require('../models/DomainMail');
const LiveSession = require('../models/LiveSession');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { encrypt } = require('../utils/encryption');
const { generateUUID } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

// ── Dashboard ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
    const [users, vendors, products, orders, sessions] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Vendor.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        LiveSession.countDocuments(),
    ]);

    const revenueAgg = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const revenue = revenueAgg[0]?.total || 0;

    const recentOrders = await Order.find()
        .sort('-createdAt')
        .limit(5)
        .populate('user', 'name email');

    const pendingVendors = await Vendor.find({ status: 'pending' }).limit(5);

    return successResponse(res, 200, 'Dashboard data fetched.', {
        stats: { users, vendors, products, orders, revenue, sessions },
        recentOrders,
        pendingVendors,
    });
};

// ── User Management ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { role: 'user' };
    if (search) query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
    ];
    if (status === 'suspended') query.isSuspended = true;
    if (status === 'active') query.isSuspended = false;

    const [users, total] = await Promise.all([
        User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
        User.countDocuments(query),
    ]);

    return paginatedResponse(res, users, Number(page), Number(limit), total);
};

/**
 * PUT /api/admin/users/:id/suspend
 */
const suspendUser = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isSuspended: true, isActive: false },
        { new: true }
    );
    if (!user) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User suspended.', user);
};

/**
 * PUT /api/admin/users/:id/activate
 */
const activateUser = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isSuspended: false, isActive: true },
        { new: true }
    );
    if (!user) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User activated.', user);
};

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User deleted.');
};

// ── Vendor Management ──────────────────────────────────────────────────────

/**
 * GET /api/admin/vendors
 */
const getVendors = async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
    ];

    const [vendors, total] = await Promise.all([
        Vendor.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
        Vendor.countDocuments(query),
    ]);

    return paginatedResponse(res, vendors, Number(page), Number(limit), total);
};

/**
 * PUT /api/admin/vendors/:id/approve
 */
const approveVendor = async (req, res) => {
    const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() },
        { new: true }
    );
    if (!vendor) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor approved.', vendor);
};

/**
 * PUT /api/admin/vendors/:id/reject
 */
const rejectVendor = async (req, res) => {
    const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected' },
        { new: true }
    );
    if (!vendor) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor rejected.', vendor);
};

/**
 * PUT /api/admin/vendors/:id/suspend
 */
const suspendVendor = async (req, res) => {
    const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        { status: 'suspended', isSuspended: true },
        { new: true }
    );
    if (!vendor) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor suspended.', vendor);
};

/**
 * DELETE /api/admin/vendors/:id
 */
const deleteVendor = async (req, res) => {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return errorResponse(res, 404, 'Vendor not found.');
    return successResponse(res, 200, 'Vendor deleted.');
};

// ── Domain Mail Management (AEGIS Protocol) ────────────────────────────────

/**
 * GET /api/admin/mail
 */
const getMails = async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (status) query.status = status;

    const [mails, total] = await Promise.all([
        DomainMail.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
        DomainMail.countDocuments(query),
    ]);

    return paginatedResponse(res, mails, Number(page), Number(limit), total);
};

/**
 * POST /api/admin/mail
 * Create domain mail account
 */
const createMailAccount = async (req, res) => {
    const { mailAddress, displayName, password, smtpConfig, imapConfig, notes } = req.body;

    // Hash mail password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate encryption key ID (AEGIS Protocol)
    const encryptionKeyId = generateUUID();

    // Encrypt SMTP password
    const smtpPasswordEncrypted = encrypt(smtpConfig?.password || password);

    const mail = await DomainMail.create({
        mailAddress,
        domain: mailAddress.split('@')[1] || 'loomlook.com',
        displayName,
        passwordHash,
        createdBy: req.user.id,
        smtpConfig: {
            ...smtpConfig,
            passwordEncrypted: smtpPasswordEncrypted,
        },
        imapConfig,
        encryptionKeyId,
        notes,
    });

    return successResponse(res, 201, 'Domain mail account created.', {
        _id: mail._id,
        mailAddress: mail.mailAddress,
        domain: mail.domain,
        displayName: mail.displayName,
        encryptionKeyId: mail.encryptionKeyId,
        status: mail.status,
        createdAt: mail.createdAt,
    });
};

/**
 * PUT /api/admin/mail/:id/suspend
 */
const suspendMail = async (req, res) => {
    const mail = await DomainMail.findByIdAndUpdate(
        req.params.id,
        { status: 'suspended', suspendedAt: new Date(), suspensionReason: req.body.reason },
        { new: true }
    );
    if (!mail) return errorResponse(res, 404, 'Mail account not found.');
    return successResponse(res, 200, 'Mail account suspended.', mail);
};

/**
 * PUT /api/admin/mail/:id/activate
 */
const activateMail = async (req, res) => {
    const mail = await DomainMail.findByIdAndUpdate(
        req.params.id,
        { status: 'active', suspendedAt: null, suspensionReason: null },
        { new: true }
    );
    if (!mail) return errorResponse(res, 404, 'Mail account not found.');
    return successResponse(res, 200, 'Mail account activated.', mail);
};

/**
 * DELETE /api/admin/mail/:id
 */
const deleteMail = async (req, res) => {
    const mail = await DomainMail.findByIdAndUpdate(
        req.params.id,
        { status: 'deleted', deletedAt: new Date() },
        { new: true }
    );
    if (!mail) return errorResponse(res, 404, 'Mail account not found.');
    return successResponse(res, 200, 'Mail account deleted.');
};

/**
 * PUT /api/admin/mail/:id/smtp-config
 * Update SMTP/IMAP configuration
 */
const updateMailConfig = async (req, res) => {
    const { smtpConfig, imapConfig } = req.body;

    const updateData = {};
    if (smtpConfig) {
        updateData.smtpConfig = {
            ...smtpConfig,
            passwordEncrypted: smtpConfig.password ? encrypt(smtpConfig.password) : undefined,
        };
        delete updateData.smtpConfig.password;
    }
    if (imapConfig) updateData.imapConfig = imapConfig;

    const mail = await DomainMail.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!mail) return errorResponse(res, 404, 'Mail account not found.');

    return successResponse(res, 200, 'Mail configuration updated.', mail);
};

/**
 * GET /api/admin/mail/:id/activity
 * Get mail activity
 */
const getMailActivity = async (req, res) => {
    const mail = await DomainMail.findById(req.params.id).select('mailAddress mailCount lastActivity inbox sentItems storageUsedMB');
    if (!mail) return errorResponse(res, 404, 'Mail account not found.');
    return successResponse(res, 200, 'Mail activity fetched.', mail);
};

module.exports = {
    getDashboard,
    getUsers,
    suspendUser,
    activateUser,
    deleteUser,
    getVendors,
    approveVendor,
    rejectVendor,
    suspendVendor,
    deleteVendor,
    getMails,
    createMailAccount,
    suspendMail,
    activateMail,
    deleteMail,
    updateMailConfig,
    getMailActivity,
};
