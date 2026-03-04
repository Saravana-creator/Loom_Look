const express = require('express');
const router = express.Router();
const {
    createOrder, verifyPayment, getUserOrders, getOrder,
    getVendorOrders, getAllOrdersAdmin, updateOrderStatus,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// User
router.post('/', authenticate, authorize('user'), createOrder);
router.post('/verify-payment', authenticate, authorize('user'), verifyPayment);
router.get('/my-orders', authenticate, authorize('user'), getUserOrders);
router.get('/my-orders/:id', authenticate, authorize('user'), getOrder);

// Vendor
router.get('/vendor/orders', authenticate, authorize('vendor'), getVendorOrders);

// Admin
router.get('/admin/all', authenticate, authorize('admin'), getAllOrdersAdmin);
router.put('/admin/:id/status', authenticate, authorize('admin'), updateOrderStatus);

module.exports = router;
