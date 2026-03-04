const mongoose = require('mongoose');
const { MAIL_STATUS } = require('../config/constants');

/**
 * DomainMail Model — AEGIS Protocol-inspired secure mail system
 * Admin manages domain email accounts
 */
const domainMailSchema = new mongoose.Schema(
    {
        // Email account details
        mailAddress: {
            type: String,
            required: [true, 'Mail address is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        // e.g. loomlook.com
        domain: {
            type: String,
            required: [true, 'Domain is required'],
            default: 'loomlook.com',
        },
        displayName: {
            type: String,
            required: true,
        },
        // Hashed password for mail access
        passwordHash: {
            type: String,
            select: false,
        },
        // Account belongs to
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'ownerModel',
        },
        ownerModel: {
            type: String,
            enum: ['User', 'Vendor'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // admin
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(MAIL_STATUS),
            default: MAIL_STATUS.ACTIVE,
        },

        // SMTP/IMAP Configuration
        smtpConfig: {
            host: { type: String, default: 'smtp.loomlook.com' },
            port: { type: Number, default: 587 },
            secure: { type: Boolean, default: false },
            username: String,
            // Encrypted password
            passwordEncrypted: String,
        },
        imapConfig: {
            host: { type: String, default: 'imap.loomlook.com' },
            port: { type: Number, default: 993 },
            secure: { type: Boolean, default: true },
        },

        // AEGIS Protocol - Encryption key management
        encryptionKeyId: {
            type: String, // Reference to key in key store
        },
        encryptionAlgorithm: {
            type: String,
            default: 'AES-256-GCM',
        },
        isEncryptionEnabled: {
            type: Boolean,
            default: true,
        },

        // Mail activity tracking
        mailCount: {
            sent: { type: Number, default: 0 },
            received: { type: Number, default: 0 },
        },
        lastActivity: Date,
        storageUsedMB: { type: Number, default: 0 },
        storageQuotaMB: { type: Number, default: 1024 }, // 1 GB default

        // Stored (simulated) emails - encrypted
        inbox: [
            {
                from: String,
                subject: String,
                bodyEncrypted: String,
                receivedAt: { type: Date, default: Date.now },
                isRead: { type: Boolean, default: false },
            },
        ],
        sentItems: [
            {
                to: [String],
                subject: String,
                bodyEncrypted: String,
                sentAt: { type: Date, default: Date.now },
            },
        ],

        suspendedAt: Date,
        suspensionReason: String,
        deletedAt: Date,
        notes: String,
    },
    { timestamps: true }
);

// Indexes
domainMailSchema.index({ mailAddress: 1 });
domainMailSchema.index({ domain: 1 });
domainMailSchema.index({ status: 1 });
domainMailSchema.index({ owner: 1 });
domainMailSchema.index({ createdBy: 1 });

module.exports = mongoose.model('DomainMail', domainMailSchema);
