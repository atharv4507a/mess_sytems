const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { handle401 } = require('../helper/responseHandler');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            return handle401(res, 'Not authorized, token failed');
        }
    }

    if (!token) {
        return handle401(res, 'Not authorized, no token');
    }
};

module.exports = { protect };
