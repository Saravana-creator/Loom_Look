const User = require('../models/User');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/cart
 * Get user's cart
 */
const getCart = async (req, res) => {
    const user = await User.findById(req.user.id).populate({
        path: 'cart.product',
        select: 'name price discountPrice images stock isActive vendor',
        populate: { path: 'vendor', select: 'shopName' },
    });

    // Filter out deleted products
    const validCart = user.cart.filter(
        (item) => item.product && item.product.isActive
    );

    // Calculate totals
    const subtotal = validCart.reduce((acc, item) => {
        const price = item.product.discountPrice || item.product.price;
        return acc + price * item.quantity;
    }, 0);

    return successResponse(res, 200, 'Cart fetched.', {
        items: validCart,
        subtotal,
        itemCount: validCart.length,
    });
};

/**
 * POST /api/cart
 * Add item to cart
 */
const addToCart = async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
        return errorResponse(res, 404, 'Product not found.');
    }
    if (product.stock < quantity) {
        return errorResponse(res, 400, `Only ${product.stock} items available in stock.`);
    }

    const user = await User.findById(req.user.id);

    // Check if already in cart
    const existingIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
        // Update quantity
        const newQty = user.cart[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
            return errorResponse(res, 400, `Cannot add more than ${product.stock} items.`);
        }
        user.cart[existingIndex].quantity = newQty;
    } else {
        user.cart.push({ product: productId, quantity });
    }

    await user.save({ validateBeforeSave: false });
    return successResponse(res, 200, 'Item added to cart.');
};

/**
 * PUT /api/cart/:productId
 * Update cart item quantity
 */
const updateCartItem = async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity < 1) return errorResponse(res, 400, 'Quantity must be at least 1.');

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return errorResponse(res, 404, 'Product not found.');
    if (product.stock < quantity) {
        return errorResponse(res, 400, `Only ${product.stock} items available.`);
    }

    const user = await User.findById(req.user.id);
    const itemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) return errorResponse(res, 404, 'Item not in cart.');

    user.cart[itemIndex].quantity = quantity;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, 'Cart updated.');
};

/**
 * DELETE /api/cart/:productId
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(
        (item) => item.product.toString() !== req.params.productId
    );
    await user.save({ validateBeforeSave: false });
    return successResponse(res, 200, 'Item removed from cart.');
};

/**
 * DELETE /api/cart
 * Clear entire cart
 */
const clearCart = async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { cart: [] });
    return successResponse(res, 200, 'Cart cleared.');
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
