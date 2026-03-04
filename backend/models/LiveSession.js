const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../config/constants');

/**
 * LiveSession Model — vendor-managed sessions
 */
const liveSessionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Session title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Session description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        scheduledAt: {
            type: Date,
            required: [true, 'Session date and time is required'],
        },
        duration: {
            type: Number, // minutes
            required: [true, 'Duration is required'],
            min: [15, 'Duration must be at least 15 minutes'],
            max: [180, 'Duration cannot exceed 180 minutes'],
        },
        expiresAt: {
            type: Date, // auto-calculated from scheduledAt + duration
        },
        maxParticipants: {
            type: Number,
            default: 50,
            min: 1,
            max: 500,
        },
        currentParticipants: {
            type: Number,
            default: 0,
        },
        // Secure video link — only visible to booked users
        videoLink: {
            type: String,
            default: '',
            select: false, // hidden by default
        },
        videoLinkEncrypted: {
            type: String,
            default: '',
        },
        platform: {
            type: String,
            enum: ['zoom', 'google_meet', 'webrtc', 'youtube', 'other'],
            default: 'zoom',
        },
        thumbnail: {
            type: String,
            default: '',
        },
        topic: {
            type: String,
            enum: [
                'Saree Weaving',
                'Dyeing Techniques',
                'Block Printing',
                'Embroidery',
                'Handloom Demo',
                'Craft Making',
                'Other',
            ],
            default: 'Other',
        },
        status: {
            type: String,
            enum: Object.values(SESSION_STATUS),
            default: SESSION_STATUS.UPCOMING,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
        accessRestricted: {
            type: Boolean,
            default: true, // only booked users can see video link
        },
        price: {
            type: Number,
            default: 0, // 0 = free session
        },
        bookedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        mediaFiles: [
            {
                url: String,
                type: { type: String, enum: ['image', 'video', 'document'] },
                title: String,
            },
        ],
        tags: [String],
    },
    { timestamps: true }
);

// Auto-calculate expiresAt
liveSessionSchema.pre('save', function (next) {
    if (this.scheduledAt && this.duration) {
        this.expiresAt = new Date(
            this.scheduledAt.getTime() + this.duration * 60 * 1000
        );
    }
    next();
});

// Indexes
liveSessionSchema.index({ vendor: 1 });
liveSessionSchema.index({ scheduledAt: 1 });
liveSessionSchema.index({ status: 1 });
liveSessionSchema.index({ isEnabled: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
