const mongoose = require('mongoose');
const { PRODUCT_CATEGORIES } = require('../config/constants');

/**
 * Product Model — managed by vendors
 */
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [200, 'Product name cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        discountPrice: {
            type: Number,
            default: 0,
        },
        stock: {
            type: Number,
            required: [true, 'Stock is required'],
            min: [0, 'Stock cannot be negative'],
            default: 0,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: PRODUCT_CATEGORIES,
        },
        images: [
            {
                url: { type: String, required: true },
                altText: { type: String, default: '' },
            },
        ],
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        tags: [String],
        material: String,
        dimensions: String,
        weight: String,
        handmadeDetails: {
            craftType: String,
            region: String,
            artisan: String,
        },
        ratings: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
        reviews: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                rating: { type: Number, min: 1, max: 5 },
                comment: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        totalSold: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// ── Text index for full-text search ───────────────────────────────────────
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ 'ratings.average': -1 });

module.exports = mongoose.model('Product', productSchema);
