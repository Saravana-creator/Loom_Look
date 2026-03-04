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
 * Paginate a mongoose query
 * @param {Model} model - Mongoose model
 * @param {Object} query - Filter query
 * @param {Object} options - { page, limit, select, sort, populate }
 */
const paginate = async (model, query, options = {}) => {
    const page = parseInt(options.page) || 1;
    const limit = Math.min(parseInt(options.limit) || 12, 100);
    const skip = (page - 1) * limit;

    let dbQuery = model.find(query).skip(skip).limit(limit);

    if (options.select) dbQuery = dbQuery.select(options.select);
    if (options.sort) dbQuery = dbQuery.sort(options.sort);
    if (options.populate) {
        const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
        pops.forEach((p) => (dbQuery = dbQuery.populate(p)));
    }

    const [data, total] = await Promise.all([dbQuery, model.countDocuments(query)]);

    return {
        data,
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
