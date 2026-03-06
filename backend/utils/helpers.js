const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique order ID
 */
const generateOrderId = () => {
    const prefix = 'LL-ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate a unique booking ID
 */
const generateBookingId = () => {
    const prefix = 'LL-BKG';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate a UUID (for encryption key IDs etc.)
 */
const generateUUID = () => uuidv4();

/**
 * Paginate a PostgreSQL result set
 * @param {string} table - Table name
 * @param {string} where - WHERE clause
 * @param {Array} params - Parameter values
 * @param {Object} options - { page, limit, select, sort }
 */
const paginate = async (table, where = 'TRUE', params = [], options = {}) => {
    const { query } = require('../config/db');
    const page = parseInt(options.page) || 1;
    const limit = Math.min(parseInt(options.limit) || 12, 100);
    const offset = (page - 1) * limit;

    const select = options.select || '*';
    const sort = options.sort || 'created_at DESC';

    const sql = `SELECT ${select} FROM ${table} WHERE ${where} ORDER BY ${sort} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countSql = `SELECT COUNT(*) FROM ${table} WHERE ${where}`;

    const [result, countResult] = await Promise.all([
        query(sql, [...params, limit, offset]),
        query(countSql, params)
    ]);

    const total = parseInt(countResult.rows[0].count);

    return {
        data: result.rows,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        },
    };
};

module.exports = { generateOrderId, generateBookingId, generateUUID, paginate };
