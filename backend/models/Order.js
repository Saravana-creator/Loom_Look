const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * Order Model
 */
const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            unique: true,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                vendor: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Vendor',
                    required: true,
                },
                name: String,
                image: String,
                price: Number,
                quantity: { type: Number, default: 1 },
                subtotal: Number,
            },
        ],
        shippingAddress: {
            fullName: String,
            phone: String,
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' },
        },
        paymentMethod: {
            type: String,
            enum: ['razorpay', 'stripe', 'cod'],
            default: 'razorpay',
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.PENDING,
        },
        paymentDetails: {
            transactionId: String,
            razorpayOrderId: String,
            razorpayPaymentId: String,
            razorpaySignature: String,
            stripeSessionId: String,
            paidAt: Date,
        },
        orderStatus: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PENDING,
        },
        subtotal: { type: Number, required: true },
        shippingCharge: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },
        isDelivered: { type: Boolean, default: false },
        deliveredAt: Date,
        trackingNumber: String,
        notes: String,
    },
    { timestamps: true }
);

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ 'items.vendor': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
