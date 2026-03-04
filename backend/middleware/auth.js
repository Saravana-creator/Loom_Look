const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { errorResponse } = require('../utils/response');

/**
 * Protect routes — verifies JWT access token
 */
const authenticate = async (req, res, next) => {
    try {
        let token;

        // Extract token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return errorResponse(res, 401, 'Access denied. No token provided.');
        }

        // Verify token
        const decoded = verifyAccessToken(token);
        req.user = decoded;

        // Validate user still exists and is active
        if (decoded.role === 'vendor') {
            const vendor = await Vendor.findById(decoded.id).select('-password');
            if (!vendor || vendor.isSuspended) {
                return errorResponse(res, 401, 'Vendor account not found or suspended.');
            }
            if (vendor.status !== 'approved') {
                return errorResponse(res, 403, 'Vendor account is pending approval.');
            }
            req.vendor = vendor;
        } else {
            const user = await User.findById(decoded.id).select('-password');
            if (!user || !user.isActive || user.isSuspended) {
                return errorResponse(res, 401, 'User account not found or suspended.');
            }
            req.userDoc = user;
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'Token expired. Please refresh.');
        }
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 401, 'Invalid token.');
        }
        return errorResponse(res, 401, 'Authentication failed.');
    }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                `Role '${req.user.role}' is not authorized to access this resource.`
            );
        }
        next();
    };
};

/**
 * Admin only middleware
 */
const adminOnly = [authenticate, authorize('admin')];

/**
 * Vendor only middleware
 */
const vendorOnly = [authenticate, authorize('vendor')];

/**
 * User only middleware
 */
const userOnly = [authenticate, authorize('user')];

/**
 * User or Admin middleware
 */
const userOrAdmin = [authenticate, authorize('user', 'admin')];

module.exports = {
    authenticate,
    authorize,
    adminOnly,
    vendorOnly,
    userOnly,
    userOrAdmin,
};
