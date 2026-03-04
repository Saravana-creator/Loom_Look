const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticate, authorize } = require('../middleware/auth');

const userAuth = [authenticate, authorize('user')];

router.get('/', userAuth, getCart);
router.post('/', userAuth, addToCart);
router.put('/:productId', userAuth, updateCartItem);
router.delete('/clear', userAuth, clearCart);
router.delete('/:productId', userAuth, removeFromCart);

module.exports = router;
