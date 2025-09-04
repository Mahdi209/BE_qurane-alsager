const jwt = require('jsonwebtoken');
require('dotenv').config();

const accessSecret = process.env.ACCESS_SECRET
const refreshSecret = process.env.REFRESH_SECRET

const generateAccessToken = (admin) => {
    const payload = {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName ? admin.fullName : '',
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || {},
        profile:admin.profile,
        verifyEmail:admin.verifyEmail,
        dateVerified:admin.dateVerifyEmail,
    };

    return jwt.sign(payload, accessSecret, {
        expiresIn: '1h'
    });
};

const generateRefreshToken = (admin) => {
    const payload = {
        id: admin._id,
        tokenVersion: admin.tokenVersion || 0
    };

    return jwt.sign(payload, refreshSecret, {
        expiresIn: '7d'
    });
};

const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, accessSecret);
        return {
            valid: true,
            data: decoded
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
};

const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, refreshSecret);
        return {
            valid: true,
            data: decoded
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
     }
};

const generateTokens = (admin) => {
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    return {
        accessToken,
        refreshToken
    };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokens
};
