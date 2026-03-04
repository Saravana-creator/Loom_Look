const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/cart
 */
const getCart = async (req, res) => {
    const userRes = await query('SELECT cart FROM users WHERE id = $1', [req.user.id]);
    const cartItems = userRes.rows[0]?.cart || [];

    if (!cartItems.length) {
        return successResponse(res, 200, 'Cart fetched.', { items: [], subtotal: 0, itemCount: 0 });
    }

    const productIds = cartItems.map(i => i.productId);
    const prodRes = await query(
        `SELECT p.id, p.name, p.price, p.discount_price, p.images, p.stock, p.is_active, v.shop_name
         FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id
         WHERE p.id = ANY($1::uuid[])`,
        [productIds]
    );

    const productMap = Object.fromEntries(prodRes.rows.map(p => [p.id, p]));
    const validCart = cartItems
        .map(item => ({ ...item, product: productMap[item.productId] }))
        .filter(item => item.product && item.product.is_active);

    const subtotal = validCart.reduce((acc, item) => {
        const price = item.product.discount_price > 0 ? item.product.discount_price : item.product.price;
        return acc + price * item.quantity;
    }, 0);

    return successResponse(res, 200, 'Cart fetched.', { items: validCart, subtotal, itemCount: validCart.length });
};

/**
 * POST /api/cart
 */
const addToCart = async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    const prodRes = await query('SELECT stock, is_active FROM products WHERE id = $1', [productId]);
    const product = prodRes.rows[0];
    if (!product || !product.is_active) return errorResponse(res, 404, 'Product not found.');
    if (product.stock < quantity) return errorResponse(res, 400, `Only ${product.stock} items available in stock.`);

    const userRes = await query('SELECT cart FROM users WHERE id = $1', [req.user.id]);
    let cart = userRes.rows[0]?.cart || [];

    const existingIndex = cart.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
        const newQty = cart[existingIndex].quantity + quantity;
        if (newQty > product.stock) return errorResponse(res, 400, `Cannot add more than ${product.stock} items.`);
        cart[existingIndex].quantity = newQty;
    } else {
        cart.push({ productId, quantity });
    }

    await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify(cart), req.user.id]);
    return successResponse(res, 200, 'Item added to cart.');
};

/**
 * PUT /api/cart/:productId
 */
const updateCartItem = async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;
    if (quantity < 1) return errorResponse(res, 400, 'Quantity must be at least 1.');

    const prodRes = await query('SELECT stock, is_active FROM products WHERE id = $1', [productId]);
    const product = prodRes.rows[0];
    if (!product || !product.is_active) return errorResponse(res, 404, 'Product not found.');
    if (product.stock < quantity) return errorResponse(res, 400, `Only ${product.stock} items available.`);

    const userRes = await query('SELECT cart FROM users WHERE id = $1', [req.user.id]);
    let cart = userRes.rows[0]?.cart || [];
    const itemIndex = cart.findIndex(i => i.productId === productId);
    if (itemIndex === -1) return errorResponse(res, 404, 'Item not in cart.');

    cart[itemIndex].quantity = quantity;
    await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify(cart), req.user.id]);
    return successResponse(res, 200, 'Cart updated.');
};

/**
 * DELETE /api/cart/:productId
 */
const removeFromCart = async (req, res) => {
    const userRes = await query('SELECT cart FROM users WHERE id = $1', [req.user.id]);
    let cart = (userRes.rows[0]?.cart || []).filter(i => i.productId !== req.params.productId);
    await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify(cart), req.user.id]);
    return successResponse(res, 200, 'Item removed from cart.');
};

/**
 * DELETE /api/cart
 */
const clearCart = async (req, res) => {
    await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify([]), req.user.id]);
    return successResponse(res, 200, 'Cart cleared.');
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
