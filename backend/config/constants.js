/**
 * Application-wide configuration constants
 */
module.exports = {
    // Roles
    ROLES: {
        USER: 'user',
        VENDOR: 'vendor',
        ADMIN: 'admin',
    },

    // Order statuses
    ORDER_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        PROCESSING: 'processing',
        SHIPPED: 'shipped',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled',
        REFUNDED: 'refunded',
    },

    // Payment statuses
    PAYMENT_STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        FAILED: 'failed',
        REFUNDED: 'refunded',
    },

    // Vendor statuses
    VENDOR_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        SUSPENDED: 'suspended',
    },

    // Live session statuses
    SESSION_STATUS: {
        UPCOMING: 'upcoming',
        LIVE: 'live',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
    },

    // Booking statuses
    BOOKING_STATUS: {
        CONFIRMED: 'confirmed',
        CANCELLED: 'cancelled',
        ATTENDED: 'attended',
    },

    // Mail statuses
    MAIL_STATUS: {
        ACTIVE: 'active',
        SUSPENDED: 'suspended',
        DELETED: 'deleted',
    },

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 100,
    },

    // Product categories
    PRODUCT_CATEGORIES: [
        'Silk Sarees',
        'Cotton Sarees',
        'Banarasi Sarees',
        'Kanjivaram Sarees',
        'Chanderi Sarees',
        'Handloom Sarees',
        'Designer Sarees',
        'Handcrafted Jewelry',
        'Handcrafted Bags',
        'Home Decor',
        'Other',
    ],
};
