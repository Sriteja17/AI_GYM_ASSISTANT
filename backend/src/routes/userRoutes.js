const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Get all coaches (for members)
router.get('/coaches', authMiddleware, async (req, res) => {
    try {
        const coaches = await User.find({ userType: 'coach' })
            .select('name email createdAt')
            .sort({ name: 1 });

        res.json({ coaches });
    } catch (error) {
        console.error('Error fetching coaches:', error);
        res.status(500).json({ error: 'Failed to fetch coaches' });
    }
});

// Get user profile by ID
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('name email userType profile createdAt');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
