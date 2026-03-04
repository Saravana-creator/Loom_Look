const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');
const { errorResponse } = require('../utils/response');

/**
 * Protect routes — verifies JWT access token
 */
const authenticate = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) return errorResponse(res, 401, 'Access denied. No token provided.');

        const decoded = verifyAccessToken(token);
        req.user = decoded;

        // Validate user/vendor still exists and is active in PostgreSQL
        if (decoded.role === 'vendor') {
            const result = await query(`SELECT id, status FROM vendors WHERE id = $1`, [decoded.id]);
            const vendor = result.rows[0];
            if (!vendor) return errorResponse(res, 401, 'Vendor account not found.');
            if (vendor.status !== 'approved') return errorResponse(res, 403, 'Vendor account is pending approval.');
        } else {
            const result = await query(`SELECT id, is_active, is_suspended FROM users WHERE id = $1`, [decoded.id]);
            const user = result.rows[0];
            if (!user || !user.is_active || user.is_suspended) {
                return errorResponse(res, 401, 'User account not found or suspended.');
            }
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') return errorResponse(res, 401, 'Token expired. Please refresh.');
        if (error.name === 'JsonWebTokenError') return errorResponse(res, 401, 'Invalid token.');
        return errorResponse(res, 401, 'Authentication failed.');
    }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorResponse(res, 403, `Role '${req.user.role}' is not authorized to access this resource.`);
        }
        next();
    };
};

const adminOnly = [authenticate, authorize('admin')];
const vendorOnly = [authenticate, authorize('vendor')];
const userOnly = [authenticate, authorize('user')];
const userOrAdmin = [authenticate, authorize('user', 'admin')];

module.exports = { authenticate, authorize, adminOnly, vendorOnly, userOnly, userOrAdmin };
