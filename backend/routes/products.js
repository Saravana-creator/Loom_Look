const express = require('express');
const router = express.Router();
const {
    getProducts, getProduct, createProduct, updateProduct,
    deleteProduct, getVendorProducts, getAllProductsAdmin, addReview,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { productValidator } = require('../middleware/validators');

// ── Public routes ──────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/:id', getProduct);

// ── User routes ────────────────────────────────────────────────────────────
router.post('/:id/reviews', authenticate, authorize('user'), addReview);

// ── Vendor routes ──────────────────────────────────────────────────────────
router.get('/vendor/my-products', authenticate, authorize('vendor'), getVendorProducts);
router.post('/vendor/create', authenticate, authorize('vendor'), productValidator, createProduct);
router.put('/vendor/:id', authenticate, authorize('vendor'), updateProduct);
router.delete('/vendor/:id', authenticate, authorize('vendor', 'admin'), deleteProduct);

// ── Admin routes ───────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, authorize('admin'), getAllProductsAdmin);

module.exports = router;
