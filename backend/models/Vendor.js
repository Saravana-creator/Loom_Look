const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { VENDOR_STATUS } = require('../config/constants');

/**
 * Vendor Model — admin approval required
 */
const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            default: 'vendor',
            immutable: true,
        },
        shopName: {
            type: String,
            required: [true, 'Shop name is required'],
            trim: true,
        },
        shopDescription: {
            type: String,
            default: '',
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        phone: {
            type: String,
            required: [true, 'Phone is required'],
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
        },
        avatar: {
            type: String,
            default: '',
        },
        shopBanner: {
            type: String,
            default: '',
        },
        gstNumber: {
            type: String,
            default: '',
        },
        bankDetails: {
            accountNumber: { type: String, default: '' },
            ifscCode: { type: String, default: '' },
            bankName: { type: String, default: '' },
        },
        status: {
            type: String,
            enum: Object.values(VENDOR_STATUS),
            default: VENDOR_STATUS.PENDING,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: Date,
        isActive: {
            type: Boolean,
            default: true,
        },
        isSuspended: {
            type: Boolean,
            default: false,
        },
        totalProducts: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        lastLogin: Date,
    },
    { timestamps: true }
);

// ── Hash password before save ──────────────────────────────────────────────
vendorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ── Compare passwords ──────────────────────────────────────────────────────
vendorSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
vendorSchema.index({ email: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
