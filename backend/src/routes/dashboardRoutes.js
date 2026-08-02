const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workout = require('../models/Workout');
const { authMiddleware } = require('../middleware/auth');
const redisClient = require('../config/redis');
const { publishToQueue } = require('../config/rabbitmq');

// @route   GET /api/dashboard/stats
// @desc    Get user dashboard stats
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        // Try Redis cache first
        let cachedStats;
        try {
            cachedStats = await redisClient.get(`stats:${req.userId}`);
            if (cachedStats) {
                return res.json(JSON.parse(cachedStats));
            }
        } catch (redisError) {
            console.error('Redis get error:', redisError);
        }

        const user = await User.findById(req.userId);

        // Get recent workouts for display (limited to 5)
        const recentWorkoutsDisplay = await Workout.find({ userId: req.userId })
            .sort({ date: -1 })
            .limit(5);

        // Calculate weekly calories and get all workouts for the week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyWorkouts = await Workout.find({
            userId: req.userId,
            date: { $gte: oneWeekAgo }
        }).sort({ date: -1 });

        const weeklyCalories = weeklyWorkouts.reduce((sum, workout) => sum + (workout.totalCalories || 0), 0);

        const stats = {
            totalWorkouts: user.stats.totalWorkouts || 0,
            totalCaloriesBurned: user.stats.totalCaloriesBurned || 0,
            weeklyCalories: weeklyCalories,
            lastWorkoutDate: user.stats.lastWorkoutDate,
            // Use weekly workouts for the chart (no limit) and display workouts for the list
            recentWorkouts: weeklyWorkouts,
            profile: user.profile,
            userInfo: {
                name: user.name,
                email: user.email,
                userType: user.userType
            }
        };

        // Cache for 5 minutes
        try {
            await redisClient.setEx(`stats:${req.userId}`, 300, JSON.stringify(stats));
        } catch (redisError) {
            console.error('Redis cache error:', redisError);
        }

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/dashboard/workout
// @desc    Log a new workout
// @access  Private
router.post('/workout', authMiddleware, async (req, res) => {
    try {
        const { exercises, notes } = req.body;

        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({ error: 'Please provide at least one exercise' });
        }

        // Calculate totals (convert duration from minutes to seconds if needed)
        const totalCalories = exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
        const totalDuration = exercises.reduce((sum, ex) => {
            const d = ex.duration || 0;
            return sum + (d < 300 ? d * 60 : d);
        }, 0);

        // Create workout
        const workout = new Workout({
            userId: req.userId,
            exercises,
            totalCalories,
            totalDuration,
            notes
        });

        await workout.save();

        // Update user stats
        const user = await User.findById(req.userId);
        user.stats.totalWorkouts = (user.stats.totalWorkouts || 0) + 1;
        user.stats.totalCaloriesBurned = (user.stats.totalCaloriesBurned || 0) + totalCalories;
        user.stats.lastWorkoutDate = new Date();
        await user.save();

        // Invalidate cache
        try {
            await redisClient.del(`stats:${req.userId}`);
            await redisClient.del(`user:${req.userId}`);
        } catch (redisError) {
            console.error('Redis delete error:', redisError);
        }

        // Queue background job for calorie calculation/analysis
        try {
            await publishToQueue('workout-analysis', {
                userId: req.userId.toString(),
                workoutId: workout._id.toString(),
                totalCalories,
                totalDuration
            });
        } catch (queueError) {
            console.error('Queue publish error:', queueError);
        }

        res.status(201).json({
            message: 'Workout logged successfully',
            workout
        });
    } catch (error) {
        console.error('Log workout error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
