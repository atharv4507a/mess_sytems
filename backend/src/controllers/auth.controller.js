const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { handle200, handle422, handle500 } = require('../helper/responseHandler');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

const { connectMongoDB } = require('../config/mongoDB');

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        // Ensure DB is connected (important for serverless functions)
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            console.log("Database not connected, attempting to connect...");
            await connectMongoDB();
        }

        const user = await User.findOne({ email }).maxTimeMS(5000); // 5 seconds timeout
        const check = await bcrypt.compare(password, user.password);
        if (check) {
            handle200(res, {
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            handle422(res, 'Invalid credentials');
        }
    } catch (error) {
        handle500(res, error);
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        handle200(res, req.user);
    } catch (error) {
        handle500(res, error);
    }
};

module.exports = {
    loginUser,
    getMe,
};
