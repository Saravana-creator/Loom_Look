require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
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

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
    })
);

// CORS configuration
const allowedOrigins = [
    'https://loomlook.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Normalize origin by removing trailing slash
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedAllowedOrigins = allowedOrigins.map(o => o.replace(/\/$/, ''));

        if (normalizedAllowedOrigins.indexOf(normalizedOrigin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.error(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Explicitly handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

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
//  MISC MIDDLEWARE
// ─────────────────────────────────────────────
app.use(hpp({ whitelist: ['price', 'rating', 'category', 'sort'] }));
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
        database: 'PostgreSQL',
    });
});

// ─────────────────────────────────────────────
//  ROOT ROUTE — Provide API Info
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🧵 Welcome to Loom Look API — The Handmade Indian Saree Marketplace',
        documentation: '/api/health',
        version: '1.0.0',
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
