const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
const { ROLES } = require('../config/constants');

const AES_KEY = process.env.AES_SECRET_KEY || 'loom_look_aes_256_bit_secret_key!';

/**
 * User Model with AES encryption on sensitive fields
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
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
            enum: Object.values(ROLES),
            default: ROLES.USER,
        },
        avatar: {
            type: String,
            default: '',
        },
        // AES Encrypted fields
        phoneEncrypted: { type: String, default: '' },
        addressEncrypted: { type: String, default: '' },
        cityEncrypted: { type: String, default: '' },
        stateEncrypted: { type: String, default: '' },
        pincodeEncrypted: { type: String, default: '' },

        isActive: {
            type: Boolean,
            default: true,
        },
        isSuspended: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        lastLogin: {
            type: Date,
        },
        cart: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
            },
        ],
    },
    { timestamps: true }
);

// ── Hash password before save ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10); // 10 is the secure industry standard (12 is ~4x slower)
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ── Compare passwords ──────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ── AES Encrypt helper ─────────────────────────────────────────────────────
userSchema.methods.encryptField = function (plainText) {
    if (!plainText) return '';
    return CryptoJS.AES.encrypt(plainText, AES_KEY).toString();
};

// ── AES Decrypt helper ─────────────────────────────────────────────────────
userSchema.methods.decryptField = function (cipherText) {
    if (!cipherText) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, AES_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return '';
    }
};

// ── Virtual: decrypted profile ─────────────────────────────────────────────
userSchema.virtual('profile').get(function () {
    return {
        phone: this.decryptField(this.phoneEncrypted),
        address: this.decryptField(this.addressEncrypted),
        city: this.decryptField(this.cityEncrypted),
        state: this.decryptField(this.stateEncrypted),
        pincode: this.decryptField(this.pincodeEncrypted),
    };
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
