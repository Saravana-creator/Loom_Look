const express = require('express');
const router = express.Router();
const {
    getDashboard, getUsers, suspendUser, activateUser, deleteUser,
    getVendors, approveVendor, rejectVendor, suspendVendor, deleteVendor,
    getMails, createMailAccount, suspendMail, activateMail, deleteMail,
    updateMailConfig, getMailActivity,
} = require('../controllers/adminController');
const { getAllProductsAdmin } = require('../controllers/productController');
const { getAllOrdersAdmin, updateOrderStatus } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const adminAuth = [authenticate, authorize('admin')];

// Dashboard
router.get('/dashboard', adminAuth, getDashboard);

// Users
router.get('/users', adminAuth, getUsers);
router.put('/users/:id/suspend', adminAuth, suspendUser);
router.put('/users/:id/activate', adminAuth, activateUser);
router.delete('/users/:id', adminAuth, deleteUser);

// Vendors
router.get('/vendors', adminAuth, getVendors);
router.put('/vendors/:id/approve', adminAuth, approveVendor);
router.put('/vendors/:id/reject', adminAuth, rejectVendor);
router.put('/vendors/:id/suspend', adminAuth, suspendVendor);
router.delete('/vendors/:id', adminAuth, deleteVendor);

// Products
router.get('/products', adminAuth, getAllProductsAdmin);

// Orders
router.get('/orders', adminAuth, getAllOrdersAdmin);
router.put('/orders/:id/status', adminAuth, updateOrderStatus);

// Domain Mail System (AEGIS Protocol)
router.get('/mail', adminAuth, getMails);
router.post('/mail', adminAuth, createMailAccount);
router.put('/mail/:id/suspend', adminAuth, suspendMail);
router.put('/mail/:id/activate', adminAuth, activateMail);
router.delete('/mail/:id', adminAuth, deleteMail);
router.put('/mail/:id/config', adminAuth, updateMailConfig);
router.get('/mail/:id/activity', adminAuth, getMailActivity);

module.exports = router;
