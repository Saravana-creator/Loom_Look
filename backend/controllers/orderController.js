const Razorpay = require('razorpay');
const crypto = require('crypto');
const { query } = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { generateOrderId } = require('../utils/helpers');
const { encrypt } = require('../utils/encryption');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/orders
 */
const createOrder = async (req, res) => {
    const { items, shippingAddress, paymentMethod = 'razorpay' } = req.body;

    const productIds = items.map(i => i.productId);
    const prodRes = await query(
        'SELECT id, name, price, discount_price, stock, is_active, vendor_id, images FROM products WHERE id = ANY($1::uuid[])',
        [productIds]
    );
    const productMap = Object.fromEntries(prodRes.rows.map(p => [p.id, p]));

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
        const product = productMap[item.productId];
        if (!product || !product.is_active) return errorResponse(res, 400, `Product ${item.productId} is not available.`);
        if (product.stock < item.quantity) return errorResponse(res, 400, `Insufficient stock for: ${product.name}`);

        const price = product.discount_price > 0 ? product.discount_price : product.price;
        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            productId: product.id,
            vendorId: product.vendor_id,
            name: product.name,
            image: (product.images && product.images[0]?.url) || '',
            price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
        });
    }

    const shippingCost = subtotal > 999 ? 0 : 80;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingCost + tax;
    const orderNumber = generateOrderId();

    let razorpayOrderId = null;
    if (paymentMethod === 'razorpay') {
        const rOrder = await razorpay.orders.create({
            amount: total * 100,
            currency: 'INR',
            receipt: orderNumber,
            notes: { userId: req.user.id },
        });
        razorpayOrderId = rOrder.id;
    }

    const result = await query(
        `INSERT INTO orders (user_id, order_number, items, shipping_address_encrypted, payment_method, payment_status, order_status, subtotal, shipping_cost, tax, total_amount, payment_info)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
            req.user.id, orderNumber, JSON.stringify(orderItems), encrypt(JSON.stringify(shippingAddress)),
            paymentMethod,
            paymentMethod === 'cod' ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING,
            paymentMethod === 'cod' ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PROCESSING,
            subtotal, shippingCost, tax, total,
            JSON.stringify({ razorpayOrderId })
        ]
    );

    // If COD, deduct stock and clear cart immediately
    if (paymentMethod === 'cod') {
        for (const item of orderItems) {
            await query('UPDATE products SET stock = stock - $1, total_sold = total_sold + $1 WHERE id = $2',
                [item.quantity, item.productId]);
        }
        await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify([]), req.user.id]);
    }

    return successResponse(res, 201, 'Order created.', {
        order: result.rows[0],
        razorpayOrderId,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
    });
};

/**
 * POST /api/orders/verify-payment
 */
const verifyPayment = async (req, res) => {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body).digest('hex');

    if (expectedSignature !== razorpaySignature) {
        return errorResponse(res, 400, 'Payment verification failed. Invalid signature.');
    }

    const orderRes = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, req.user.id]);
    const order = orderRes.rows[0];
    if (!order) return errorResponse(res, 404, 'Order not found.');
    if (order.payment_status === PAYMENT_STATUS.PAID) return errorResponse(res, 409, 'Payment already processed.');

    const paymentInfo = {
        ...order.payment_info,
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
    };

    const updated = await query(
        `UPDATE orders SET payment_status = $1, order_status = $2, payment_info = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [PAYMENT_STATUS.PAID, ORDER_STATUS.CONFIRMED, JSON.stringify(paymentInfo), orderId]
    );

    // Deduct stock
    for (const item of order.items) {
        await query('UPDATE products SET stock = stock - $1, total_sold = total_sold + $1 WHERE id = $2',
            [item.quantity, item.productId]);
    }
    // Clear cart
    await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify([]), req.user.id]);

    return successResponse(res, 200, 'Payment verified. Order confirmed!', updated.rows[0]);
};

/**
 * GET /api/orders
 */
const getUserOrders = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const [dataRes, countRes] = await Promise.all([
        query(
            `SELECT id as "_id", order_number as "orderId", items, total_amount as "totalAmount",
                    order_status as "status", payment_method as "paymentMethod",
                    payment_status as "paymentStatus", created_at as "createdAt"
             FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [req.user.id, Number(limit), offset]
        ),
        query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [req.user.id]),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * GET /api/orders/:id
 */
const getOrder = async (req, res) => {
    const result = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!result.rows[0]) return errorResponse(res, 404, 'Order not found.');
    return successResponse(res, 200, 'Order fetched.', result.rows[0]);
};

/**
 * GET /api/vendor/orders
 */
const getVendorOrders = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const [dataRes, countRes] = await Promise.all([
        query(`SELECT o.*, u.name as customer_name, u.email as customer_email
               FROM orders o JOIN users u ON u.id = o.user_id
               WHERE o.items @> $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
            [JSON.stringify([{ vendorId: req.user.id }]), Number(limit), offset]),
        query(`SELECT COUNT(*) FROM orders WHERE items @> $1`,
            [JSON.stringify([{ vendorId: req.user.id }])]),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * GET /api/admin/orders
 */
const getAllOrdersAdmin = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const [dataRes, countRes] = await Promise.all([
        query(`SELECT o.id as "_id", o.order_number as "orderNumber", o.items, o.total_amount as "totalAmount", o.order_status as "orderStatus", o.payment_status as "paymentStatus", o.created_at as "createdAt", u.name as "customerName" 
               FROM orders o LEFT JOIN users u ON u.id = o.user_id
               ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`, [Number(limit), offset]),
        query('SELECT COUNT(*) FROM orders'),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * PUT /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const result = await query(
        'UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'Order not found.');
    return successResponse(res, 200, 'Order status updated.', result.rows[0]);
};

module.exports = { createOrder, verifyPayment, getUserOrders, getOrder, getVendorOrders, getAllOrdersAdmin, updateOrderStatus };
