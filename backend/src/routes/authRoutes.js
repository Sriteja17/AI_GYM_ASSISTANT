const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const redisClient = require('../config/redis');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, confirmPassword, userType } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword || !userType) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (!['member', 'coach'].includes(userType)) {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            userType
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Cache user data in Redis
        try {
            await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
        } catch (redisError) {
            console.error('Redis cache error:', redisError);
        }

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                isProfileComplete: user.profile?.isProfileComplete || false
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// @route   POST /api/auth/signin
// @desc    Login user
// @access  Public
router.post('/signin', async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        // Validation
        if (!email || !password || !userType) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check userType matches
        if (user.userType !== userType) {
            return res.status(400).json({ error: `This email is registered as a ${user.userType}, not a ${userType}` });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Cache user data in Redis
        try {
            await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
        } catch (redisError) {
            console.error('Redis cache error:', redisError);
        }

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                isProfileComplete: user.profile?.isProfileComplete || false,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // Try to get from Redis cache first
        let user;
        try {
            const cachedUser = await redisClient.get(`user:${req.userId}`);
            if (cachedUser) {
                user = JSON.parse(cachedUser);
            }
        } catch (redisError) {
            console.error('Redis get error:', redisError);
        }

        // If not in cache, get from DB
        if (!user) {
            user = await User.findById(req.userId);
            // Cache it
            try {
                await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
            } catch (redisError) {
                console.error('Redis cache error:', redisError);
            }
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/auth/complete-profile
// @desc    Complete member profile (first-time setup)
// @access  Private
router.post('/complete-profile', authMiddleware, async (req, res) => {
    try {
        const { height, weight, age, experienceLevel, availability } = req.body;

        // Validation
        if (!height || !weight || !age || !experienceLevel || !availability) {
            return res.status(400).json({ error: 'Please fill in all profile fields' });
        }

        // Update user profile
        const user = await User.findById(req.userId);

        if (user.userType !== 'member') {
            return res.status(400).json({ error: 'Only members need to complete profile' });
        }

        user.profile = {
            height: parseFloat(height),
            weight: parseFloat(weight),
            age: parseInt(age),
            experienceLevel,
            availability,
            isProfileComplete: true
        };

        await user.save();

        // Update Redis cache
        try {
            await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
        } catch (redisError) {
            console.error('Redis cache error:', redisError);
        }

        res.json({
            message: 'Profile completed successfully',
            user
        });
    } catch (error) {
        console.error('Complete profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { name, height, weight, age, experienceLevel, availability } = req.body;

        const user = await User.findById(req.userId);

        // Update basic info
        if (name) user.name = name;

        // Update profile for members
        if (user.userType === 'member') {
            if (height) user.profile.height = parseFloat(height);
            if (weight) user.profile.weight = parseFloat(weight);
            if (age) user.profile.age = parseInt(age);
            if (experienceLevel) user.profile.experienceLevel = experienceLevel;
            if (availability) user.profile.availability = availability;
        }

        await user.save();

        // Update Redis cache
        try {
            await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
        } catch (redisError) {
            console.error('Redis cache error:', redisError);
        }

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
