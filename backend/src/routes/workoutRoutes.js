const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const { authMiddleware } = require('../middleware/auth');
const { workoutsLogged, workoutCaloriesBurned, workoutDurationSeconds, workoutCount, weeklyWorkoutStats } = require('../config/prometheus');

// Get all workouts for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(30); // Last 30 workouts

        res.json({ workouts });
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Get workout stats (today, week, month)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Today's workouts (aggregate all workouts from today)
        const todayWorkouts = await Workout.find({
            userId: req.user._id,
            date: { $gte: today }
        });

        // Calculate today's aggregated stats
        const todayStats = {
            calories: todayWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0),
            duration: todayWorkouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0),
            exercises: todayWorkouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)
        };

        // Week stats
        const weekWorkouts = await Workout.find({
            userId: req.user._id,
            date: { $gte: weekAgo }
        });

        // Calculate streak - count consecutive days with workouts
        let streak = 0;
        const allWorkouts = await Workout.find({ userId: req.user._id })
            .sort({ date: -1 })
            .select('date');

        // Group workouts by date and count unique workout days
        const workoutDates = new Set();
        allWorkouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);
            workoutDates.add(workoutDate.getTime());
        });

        // Check consecutive days from today backwards
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        while (workoutDates.has(checkDate.getTime())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        const stats = {
            today: todayStats,
            week: {
                totalWorkouts: weekWorkouts.length,
                totalCalories: weekWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0),
                totalDuration: weekWorkouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0)
            },
            streak
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching workout stats:', error);
        res.status(500).json({ error: 'Failed to fetch workout stats' });
    }
});

// Create new workout
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { exercises, totalCalories, totalDuration, notes } = req.body;

        const workout = new Workout({
            userId: req.user._id,
            exercises,
            totalCalories: totalCalories || 0,
            totalDuration: totalDuration || 0,
            notes
        });

        await workout.save();

        // Update user stats for dashboard
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        if (user) {
            user.stats = user.stats || {};
            user.stats.totalWorkouts = (user.stats.totalWorkouts || 0) + 1;
            user.stats.totalCaloriesBurned = (user.stats.totalCaloriesBurned || 0) + (totalCalories || 0);
            user.stats.lastWorkoutDate = new Date();
            await user.save();
        }

        // Invalidate Redis cache for real-time updates
        try {
            const redisClient = require('../config/redis');
            await redisClient.del(`stats:${req.user._id}`);
            await redisClient.del(`user:${req.user._id}`);
        } catch (redisError) {
            console.error('Redis cache clear error:', redisError);
        }

        console.log('Workout saved and user stats updated:', {
            workoutId: workout._id,
            totalCalories,
            totalDuration,
            userStats: user?.stats
        });

        // Update Prometheus metrics for Grafana
        try {
            const today = new Date();
            const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()];
            const userId = req.user._id.toString();

            workoutsLogged.inc();
            workoutCaloriesBurned.labels(userId, dayOfWeek).set(totalCalories || 0);
            workoutDurationSeconds.labels(userId, dayOfWeek).set(totalDuration || 0);
            workoutCount.labels(userId, dayOfWeek).inc();

            // Update weekly stats
            weeklyWorkoutStats.labels(userId, 'calories', dayOfWeek).set(totalCalories || 0);
            weeklyWorkoutStats.labels(userId, 'duration', dayOfWeek).set(totalDuration || 0);
            weeklyWorkoutStats.labels(userId, 'workouts', dayOfWeek).inc();
        } catch (metricsError) {
            console.error('Prometheus metrics update error:', metricsError);
        }

        res.status(201).json({
            workout,
            message: 'Workout saved successfully!'
        });
    } catch (error) {
        console.error('Error creating workout:', error);
        res.status(500).json({ error: 'Failed to create workout' });
    }
});

// Get specific workout by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.json({ workout });
    } catch (error) {
        console.error('Error fetching workout:', error);
        res.status(500).json({ error: 'Failed to fetch workout' });
    }
});

// Update workout
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { exercises, totalCalories, totalDuration, notes } = req.body;

        const workout = await Workout.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { exercises, totalCalories, totalDuration, notes },
            { new: true }
        );

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.json({ workout });
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

// Delete workout
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const workout = await Workout.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

// Get weekly analytics data for Grafana
router.get('/analytics/weekly', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        // Get all workouts for the past 7 days
        const workouts = await Workout.find({
            userId: req.user._id,
            date: { $gte: weekAgo, $lte: today }
        }).sort({ date: 1 });

        // Create daily breakdown
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyStats = {};

        // Initialize all 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekAgo);
            date.setDate(date.getDate() + i);
            const dayName = days[date.getDay()];
            const dateStr = date.toISOString().split('T')[0];

            dailyStats[dateStr] = {
                day: dayName,
                date: dateStr,
                workouts: 0,
                calories: 0,
                duration: 0
            };
        }

        // Populate with actual data
        workouts.forEach(workout => {
            const dateStr = new Date(workout.date).toISOString().split('T')[0];
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].workouts += 1;
                dailyStats[dateStr].calories += workout.totalCalories || 0;
                dailyStats[dateStr].duration += workout.totalDuration || 0;
            }
        });

        // Convert to array and update Prometheus metrics
        const analytics = Object.values(dailyStats);

        // Update weekly workout stats for Prometheus
        analytics.forEach(stat => {
            const userId = req.user._id.toString();
            weeklyWorkoutStats.labels(userId, 'calories', stat.day).set(stat.calories);
            weeklyWorkoutStats.labels(userId, 'duration', stat.day).set(stat.duration);
            weeklyWorkoutStats.labels(userId, 'workouts', stat.day).set(stat.workouts);
        });

        res.json({
            analytics,
            summary: {
                totalWorkouts: analytics.reduce((sum, d) => sum + d.workouts, 0),
                totalCalories: analytics.reduce((sum, d) => sum + d.calories, 0),
                totalDuration: analytics.reduce((sum, d) => sum + d.duration, 0)
            }
        });
    } catch (error) {
        console.error('Error fetching weekly analytics:', error);
        res.status(500).json({ error: 'Failed to fetch weekly analytics' });
    }
});

module.exports = router;

