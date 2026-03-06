const { query } = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * GET /api/products
 */
const getProducts = async (req, res) => {
    const { page = 1, limit = 12, search, category, minPrice, maxPrice, sort = '-created_at', vendor: vendorId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = ['p.is_active = true'];
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
    }
    if (category) { params.push(category); conditions.push(`p.category = $${params.length}`); }
    if (minPrice) { params.push(Number(minPrice)); conditions.push(`p.price >= $${params.length}`); }
    if (maxPrice) { params.push(Number(maxPrice)); conditions.push(`p.price <= $${params.length}`); }
    if (vendorId) { params.push(vendorId); conditions.push(`p.vendor_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortCol = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const allowedSorts = ['created_at', 'price', 'ratings_average', 'total_sold'];
    const safeSort = allowedSorts.includes(sortCol) ? sortCol : 'created_at';

    params.push(Number(limit), offset);
    const dataQ = `
        SELECT p.*, v.shop_name, v.logo as vendor_avatar
        FROM products p
        LEFT JOIN vendors v ON v.id = p.vendor_id
        ${where}
        ORDER BY p.${safeSort} ${sortDir}
        LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countParams = params.slice(0, params.length - 2);
    const countQ = `SELECT COUNT(*) FROM products p ${where}`;

    const [dataRes, countRes] = await Promise.all([
        query(dataQ, params),
        query(countQ, countParams),
    ]);

    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * GET /api/products/:id
 */
const getProduct = async (req, res) => {
    const result = await query(
        `SELECT p.*, v.shop_name, v.description as vendor_description, v.logo as vendor_avatar
         FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id
         WHERE p.id = $1 AND p.is_active = true`,
        [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'Product not found.');
    return successResponse(res, 200, 'Product fetched.', result.rows[0]);
};

/**
 * POST /api/products (vendor)
 */
const createProduct = async (req, res) => {
    const { name, description, price, discountPrice, stock, category, images, tags, material, handmadeDetails } = req.body;

    const result = await query(
        `INSERT INTO products (name, description, price, discount_price, stock, category, images, vendor_id, tags, material, handmade_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [name, description, price, discountPrice || 0, stock, category,
            JSON.stringify(images || []), req.user.id,
            tags || [], material || '', JSON.stringify(handmadeDetails || {})]
    );
    return successResponse(res, 201, 'Product created successfully.', result.rows[0]);
};

/**
 * PUT /api/products/:id (vendor)
 */
const updateProduct = async (req, res) => {
    const existing = await query('SELECT vendor_id FROM products WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return errorResponse(res, 404, 'Product not found.');
    if (existing.rows[0].vendor_id !== req.user.id) return errorResponse(res, 403, 'Not authorized to update this product.');

    const { name, description, price, discountPrice, stock, category, images, tags, material, handmadeDetails, isActive } = req.body;
    const result = await query(
        `UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description),
         price = COALESCE($3, price), discount_price = COALESCE($4, discount_price),
         stock = COALESCE($5, stock), category = COALESCE($6, category),
         images = COALESCE($7, images), tags = COALESCE($8, tags),
         material = COALESCE($9, material), handmade_details = COALESCE($10, handmade_details),
         is_active = COALESCE($11, is_active), updated_at = NOW()
         WHERE id = $12 RETURNING *`,
        [name, description, price, discountPrice, stock, category,
            images ? JSON.stringify(images) : null, tags || null,
            material, handmadeDetails ? JSON.stringify(handmadeDetails) : null,
            isActive, req.params.id]
    );
    return successResponse(res, 200, 'Product updated.', result.rows[0]);
};

/**
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
    const existing = await query('SELECT vendor_id FROM products WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return errorResponse(res, 404, 'Product not found.');
    if (req.user.role === 'vendor' && existing.rows[0].vendor_id !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized to delete this product.');
    }
    await query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
    return successResponse(res, 200, 'Product deleted successfully.');
};

/**
 * GET /api/products/mine (vendor)
 */
const getVendorProducts = async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [dataRes, countRes] = await Promise.all([
        query('SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [req.user.id, Number(limit), offset]),
        query('SELECT COUNT(*) FROM products WHERE vendor_id = $1', [req.user.id]),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * GET /api/admin/products
 */
const getAllProductsAdmin = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [dataRes, countRes] = await Promise.all([
        query(`SELECT p.id as "_id", p.*, v.shop_name as "shopName" FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id
               ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`, [Number(limit), offset]),
        query('SELECT COUNT(*) FROM products'),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * POST /api/products/:id/reviews
 */
const addReview = async (req, res) => {
    const { rating, comment } = req.body;

    const prodRes = await query('SELECT id FROM products WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!prodRes.rows[0]) return errorResponse(res, 404, 'Product not found.');

    const existing = await query('SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length > 0) return errorResponse(res, 409, 'You have already reviewed this product.');

    await query('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)',
        [req.params.id, req.user.id, rating, comment]);

    // Recalculate avg rating
    const avgRes = await query(
        'SELECT COUNT(*) as count, AVG(rating) as avg FROM reviews WHERE product_id = $1', [req.params.id]
    );
    await query('UPDATE products SET ratings_count = $1, ratings_average = $2 WHERE id = $3',
        [avgRes.rows[0].count, parseFloat(avgRes.rows[0].avg).toFixed(2), req.params.id]);

    return successResponse(res, 201, 'Review added.', { count: avgRes.rows[0].count, average: avgRes.rows[0].avg });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getVendorProducts, getAllProductsAdmin, addReview };
