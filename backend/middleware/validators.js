const { body, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, 400, 'Validation failed', errors.array());
    }
    next();
};

// ── Auth Validators ────────────────────────────────────────────────────────
const registerUserValidator = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain letters and numbers'),
    validate,
];

const loginValidator = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
];

const registerVendorValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('phone')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Valid 10-digit Indian phone number is required'),
    validate,
];

// ── Product Validators ─────────────────────────────────────────────────────
const productValidator = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    body('category').notEmpty().withMessage('Category is required'),
    validate,
];

// ── Order Validators ───────────────────────────────────────────────────────
const orderValidator = [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
    body('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.state').notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode')
        .matches(/^\d{6}$/)
        .withMessage('Valid 6-digit pincode is required'),
    validate,
];

// ── Live Session Validators ────────────────────────────────────────────────
const sessionValidator = [
    body('title').trim().notEmpty().withMessage('Session title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('scheduledAt')
        .isISO8601()
        .withMessage('Valid date/time is required')
        .custom((val) => {
            if (new Date(val) <= new Date()) throw new Error('Session must be in the future');
            return true;
        }),
    body('duration')
        .isInt({ min: 15, max: 180 })
        .withMessage('Duration must be between 15 and 180 minutes'),
    validate,
];

module.exports = {
    validate,
    registerUserValidator,
    loginValidator,
    registerVendorValidator,
    productValidator,
    orderValidator,
    sessionValidator,
};
