const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Middleware to check if user is a coach
const coachOnly = (req, res, next) => {
    if (req.user.userType !== 'coach') {
        return res.status(403).json({ error: 'Access denied. Coaches only.' });
    }
    next();
};

// Middleware to check if user is a member
const memberOnly = (req, res, next) => {
    if (req.user.userType !== 'member') {
        return res.status(403).json({ error: 'Access denied. Members only.' });
    }
    next();
};

module.exports = { authMiddleware, coachOnly, memberOnly };
