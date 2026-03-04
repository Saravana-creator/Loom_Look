const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { generateOrderId } = require('../utils/helpers');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/orders
 * Create order & initiate Razorpay payment
 */
const createOrder = async (req, res) => {
    const { items, shippingAddress, paymentMethod = 'razorpay' } = req.body;

    // Fetch ALL products in ONE parallel DB query instead of one-per-item
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('vendor', '_id');
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    // Validate items and calculate total
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
        const product = productMap[item.productId];
        if (!product || !product.isActive) {
            return errorResponse(res, 400, `Product ${item.productId} is not available.`);
        }
        if (product.stock < item.quantity) {
            return errorResponse(res, 400, `Insufficient stock for: ${product.name}`);
        }

        const price = product.discountPrice > 0 ? product.discountPrice : product.price;
        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            product: product._id,
            vendor: product.vendor._id,
            name: product.name,
            image: product.images[0]?.url || '',
            price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
        });
    }

    const shippingCharge = subtotal > 999 ? 0 : 80;
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + shippingCharge + tax;

    // Create Razorpay order
    let razorpayOrder = null;
    if (paymentMethod === 'razorpay') {
        razorpayOrder = await razorpay.orders.create({
            amount: total * 100, // paise
            currency: 'INR',
            receipt: generateOrderId(),
            notes: { userId: req.user.id },
        });
    }

    // Create order in DB
    const order = await Order.create({
        orderId: generateOrderId(),
        user: req.user.id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingCharge,
        tax,
        total,
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentDetails: {
            razorpayOrderId: razorpayOrder?.id,
        },
    });

    return successResponse(res, 201, 'Order created.', {
        order,
        razorpayOrderId: razorpayOrder?.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
    });
};

/**
 * POST /api/orders/verify-payment
 * Verify Razorpay payment signature
 */
const verifyPayment = async (req, res) => {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        return errorResponse(res, 400, 'Payment verification failed. Invalid signature.');
    }

    // Find and update order
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return errorResponse(res, 404, 'Order not found.');

    // Prevent duplicate processing
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
        return errorResponse(res, 409, 'Payment already processed.');
    }

    // Update order
    order.paymentStatus = PAYMENT_STATUS.PAID;
    order.orderStatus = ORDER_STATUS.CONFIRMED;
    order.paymentDetails.razorpayPaymentId = razorpayPaymentId;
    order.paymentDetails.razorpaySignature = razorpaySignature;
    order.paymentDetails.paidAt = new Date();
    await order.save();

    // Deduct stock and update vendor revenue
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, totalSold: item.quantity },
        });
        await Vendor.findByIdAndUpdate(item.vendor, {
            $inc: { totalRevenue: item.subtotal },
        });
    }

    // Clear user's cart
    await User.findByIdAndUpdate(req.user.id, { cart: [] });

    return successResponse(res, 200, 'Payment verified. Order confirmed!', order);
};

/**
 * GET /api/orders
 * Get user's order history
 */
const getUserOrders = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find({ user: req.user.id })
            .sort('-createdAt')
            .skip(skip)
            .limit(Number(limit))
            .populate('items.product', 'name images'),
        Order.countDocuments({ user: req.user.id }),
    ]);

    return paginatedResponse(res, orders, Number(page), Number(limit), total);
};

/**
 * GET /api/orders/:id
 * Get specific order
 */
const getOrder = async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user.id,
    }).populate('items.product', 'name images');

    if (!order) return errorResponse(res, 404, 'Order not found.');
    return successResponse(res, 200, 'Order fetched.', order);
};

/**
 * GET /api/vendor/orders
 * Get vendor's orders
 */
const getVendorOrders = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find({ 'items.vendor': req.user.id })
            .sort('-createdAt')
            .skip(skip)
            .limit(Number(limit))
            .populate('user', 'name email')
            .populate('items.product', 'name images price'),
        Order.countDocuments({ 'items.vendor': req.user.id }),
    ]);

    return paginatedResponse(res, orders, Number(page), Number(limit), total);
};

/**
 * GET /api/admin/orders
 * Get all orders (admin)
 */
const getAllOrdersAdmin = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find().sort('-createdAt').skip(skip).limit(Number(limit))
            .populate('user', 'name email')
            .populate('items.vendor', 'shopName'),
        Order.countDocuments(),
    ]);

    return paginatedResponse(res, orders, Number(page), Number(limit), total);
};

/**
 * PUT /api/admin/orders/:id/status
 * Update order status (admin)
 */
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { orderStatus: status },
        { new: true }
    );
    if (!order) return errorResponse(res, 404, 'Order not found.');
    return successResponse(res, 200, 'Order status updated.', order);
};

module.exports = {
    createOrder,
    verifyPayment,
    getUserOrders,
    getOrder,
    getVendorOrders,
    getAllOrdersAdmin,
    updateOrderStatus,
};
