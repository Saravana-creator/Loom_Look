const express = require('express');
const router = express.Router();
const {
    registerUser, loginUser, registerVendor, loginVendor,
    loginAdmin, refreshToken, logout, getMe, updateProfile,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerUserValidator, loginValidator, registerVendorValidator } = require('../middleware/validators');

// User auth
router.post('/register', registerUserValidator, registerUser);
router.post('/login', loginValidator, loginUser);

// Vendor auth
router.post('/vendor/register', registerVendorValidator, registerVendor);
router.post('/vendor/login', loginValidator, loginVendor);

// Admin auth
router.post('/admin/login', loginValidator, loginAdmin);

// Token management
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

// Profile
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfile);

module.exports = router;
