require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const hpp = require('hpp');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');

// Error handler
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─────────────────────────────────────────────
//  SECURITY MIDDLEWARE
// ─────────────────────────────────────────────

// Secure HTTP headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
    })
);

// CORS
const allowedOrigins = ["https://loomlook.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"];
app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// ─────────────────────────────────────────────
//  PARSING MIDDLEWARE
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─────────────────────────────────────────────
//  DATA SANITIZATION
// ─────────────────────────────────────────────
// NoSQL injection prevention
app.use(mongoSanitize());
// HTTP Parameter Pollution prevention
app.use(hpp({ whitelist: ['price', 'rating', 'category', 'sort'] }));

// ─────────────────────────────────────────────
//  LOGGING
// ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🪡 Loom Look API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────
//  ERROR HANDLING
// ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
