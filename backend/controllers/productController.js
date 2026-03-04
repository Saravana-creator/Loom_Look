const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/products
 * Get all products with search, filter, pagination
 */
const getProducts = async (req, res) => {
    const {
        page = 1,
        limit = 12,
        search,
        category,
        minPrice,
        maxPrice,
        sort = '-createdAt',
        vendor: vendorId,
    } = req.query;

    const query = { isActive: true };

    // Full-text search
    if (search) {
        query.$text = { $search: search };
    }

    // Category filter
    if (category) query.category = category;

    // Price range filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Vendor filter
    if (vendorId) query.vendor = vendorId;

    const skip = (Number(page) - 1) * Number(limit);

    let sortObj = {};
    if (sort.startsWith('-')) {
        sortObj[sort.slice(1)] = -1;
    } else {
        sortObj[sort] = 1;
    }

    const [products, total] = await Promise.all([
        Product.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))
            .populate('vendor', 'shopName avatar'),
        Product.countDocuments(query),
    ]);

    return paginatedResponse(res, products, Number(page), Number(limit), total);
};

/**
 * GET /api/products/:id
 * Get single product
 */
const getProduct = async (req, res) => {
    const product = await Product.findById(req.params.id).populate(
        'vendor',
        'shopName shopDescription avatar phone'
    );
    if (!product || !product.isActive) {
        return errorResponse(res, 404, 'Product not found.');
    }
    return successResponse(res, 200, 'Product fetched.', product);
};

/**
 * POST /api/vendor/products
 * Create a new product (vendor only)
 */
const createProduct = async (req, res) => {
    const { name, description, price, discountPrice, stock, category, images, tags, material, handmadeDetails } = req.body;

    const product = await Product.create({
        name,
        description,
        price,
        discountPrice: discountPrice || 0,
        stock,
        category,
        images: images || [],
        tags: tags || [],
        material,
        handmadeDetails,
        vendor: req.user.id,
    });

    // Update vendor product count
    await Vendor.findByIdAndUpdate(req.user.id, { $inc: { totalProducts: 1 } });

    return successResponse(res, 201, 'Product created successfully.', product);
};

/**
 * PUT /api/vendor/products/:id
 * Update a product (vendor only, owns product)
 */
const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, 404, 'Product not found.');
    if (product.vendor.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized to update this product.');
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    return successResponse(res, 200, 'Product updated.', updated);
};

/**
 * DELETE /api/vendor/products/:id
 * Delete a product (vendor or admin)
 */
const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, 404, 'Product not found.');

    if (req.user.role === 'vendor' && product.vendor.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized to delete this product.');
    }

    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    return successResponse(res, 200, 'Product deleted successfully.');
};

/**
 * GET /api/vendor/products
 * Get vendor's own products
 */
const getVendorProducts = async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
        Product.find({ vendor: req.user.id })
            .sort('-createdAt')
            .skip(skip)
            .limit(Number(limit)),
        Product.countDocuments({ vendor: req.user.id }),
    ]);

    return paginatedResponse(res, products, Number(page), Number(limit), total);
};

/**
 * GET /api/admin/products
 * Get all products (admin)
 */
const getAllProductsAdmin = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
        Product.find()
            .sort('-createdAt')
            .skip(skip)
            .limit(Number(limit))
            .populate('vendor', 'shopName email'),
        Product.countDocuments(),
    ]);

    return paginatedResponse(res, products, Number(page), Number(limit), total);
};

/**
 * POST /api/products/:id/reviews
 * Add review to a product (user only)
 */
const addReview = async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, 404, 'Product not found.');

    // Check existing review
    const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user.id
    );
    if (alreadyReviewed) return errorResponse(res, 409, 'You have already reviewed this product.');

    product.reviews.push({ user: req.user.id, rating, comment });

    // Recalculate average rating
    product.ratings.count = product.reviews.length;
    product.ratings.average =
        product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    return successResponse(res, 201, 'Review added.', product.ratings);
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getVendorProducts,
    getAllProductsAdmin,
    addReview,
};
