const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m',
    });
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Send token response with HTTP-only cookie
 */
const sendTokenResponse = (user, statusCode, res, role = 'user') => {
    const payload = {
        id: user._id,
        role: user.role || role,
        email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // HTTP-only cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(statusCode).json({
        success: true,
        accessToken,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || role,
            avatar: user.avatar,
            ...(role === 'vendor' && {
                shopName: user.shopName,
                status: user.status,
            }),
        },
    });

    return refreshToken;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    sendTokenResponse,
};
