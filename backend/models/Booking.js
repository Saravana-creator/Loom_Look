const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../config/constants');

/**
 * Booking Model — user books vendor live sessions
 */
const bookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
            unique: true,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LiveSession',
            required: true,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
            default: BOOKING_STATUS.CONFIRMED,
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paymentDetails: {
            amount: Number,
            transactionId: String,
            paidAt: Date,
        },
        joinedAt: Date,
        leftAt: Date,
        feedback: {
            rating: { type: Number, min: 1, max: 5 },
            comment: String,
        },
        cancellationReason: String,
        cancelledAt: Date,
    },
    { timestamps: true }
);

// Ensure one booking per user per session
bookingSchema.index({ user: 1, session: 1 }, { unique: true });
bookingSchema.index({ session: 1 });
bookingSchema.index({ vendor: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
