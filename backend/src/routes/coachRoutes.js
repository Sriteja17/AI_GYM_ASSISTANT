const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workout = require('../models/Workout');
const { authMiddleware } = require('../middleware/auth');

// Get all members (Coach only)
router.get('/members', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.userType !== 'coach') {
            return res.status(403).json({ error: 'Only coaches can access this' });
        }

        const members = await User.find({ userType: 'member' })
            .select('name email profile createdAt')
            .sort({ createdAt: -1 });

        res.json({ members });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// Get member progress/stats (Coach only)
router.get('/member/:memberId/progress', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.userType !== 'coach') {
            return res.status(403).json({ error: 'Only coaches can access this' });
        }

        const memberId = req.params.memberId;
        const member = await User.findById(memberId).select('name email profile');

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Get member's recent workouts (last 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);

        const recentWorkouts = await Workout.find({
            userId: memberId,
            date: { $gte: threeDaysAgo }
        })
            .sort({ date: -1 })
            .limit(10);

        const totalWorkouts = await Workout.countDocuments({ userId: memberId });
        const allWorkouts = await Workout.find({ userId: memberId });
        const totalCalories = allWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);

        // Get weekly stats with daily breakdown
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const weeklyWorkouts = await Workout.find({
            userId: memberId,
            date: { $gte: oneWeekAgo, $lte: today }
        });

        const weeklyCalories = weeklyWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);
        const weeklyDuration = weeklyWorkouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0);

        // Build daily breakdown for chart
        const dailyData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayWorkouts = weeklyWorkouts.filter(w => {
                const workoutDate = new Date(w.date);
                return workoutDate >= date && workoutDate < nextDate;
            });

            const dayCalories = dayWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);
            const dayDuration = dayWorkouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0);

            dailyData.push({
                day: dayNames[date.getDay()],
                date: date.toISOString().split('T')[0],
                workouts: dayWorkouts.length,
                calories: dayCalories,
                duration: dayDuration,
                isToday: i === 0
            });
        }

        // Calculate streak
        let streak = 0;
        const sortedWorkouts = allWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedWorkouts.length > 0) {
            const checkDate = new Date();
            checkDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < 30; i++) {
                const hasWorkout = sortedWorkouts.some(w => {
                    const workoutDate = new Date(w.date);
                    workoutDate.setHours(0, 0, 0, 0);
                    return workoutDate.getTime() === checkDate.getTime();
                });

                if (hasWorkout) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (i === 0) {
                    // Check yesterday if not today
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                } else {
                    break;
                }
            }
        }

        res.json({
            member,
            stats: {
                totalWorkouts,
                totalCalories,
                weeklyCalories,
                weeklyWorkouts: weeklyWorkouts.length,
                weeklyDuration,
                streak
            },
            dailyData,
            recentWorkouts
        });
    } catch (error) {
        console.error('Error fetching member progress:', error);
        res.status(500).json({ error: 'Failed to fetch member progress' });
    }
});

// Get all members with their stats for dashboard (Coach only)
router.get('/members/stats', authMiddleware, async (req, res) => {
    try {
        const user = req.user;

        if (user.userType !== 'coach') {
            return res.status(403).json({ error: 'Only coaches can access this' });
        }

        const members = await User.find({ userType: 'member' })
            .select('name email profile createdAt');

        // Get stats for each member
        const membersWithStats = await Promise.all(
            members.map(async (member) => {
                const totalWorkouts = await Workout.countDocuments({ userId: member._id });

                const workouts = await Workout.find({ userId: member._id });
                const totalCalories = workouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);

                // Weekly stats
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const weeklyWorkouts = await Workout.find({
                    userId: member._id,
                    date: { $gte: oneWeekAgo }
                });

                return {
                    _id: member._id,
                    name: member.name,
                    email: member.email,
                    profile: member.profile,
                    stats: {
                        totalWorkouts,
                        totalCalories,
                        weeklyWorkouts: weeklyWorkouts.length
                    }
                };
            })
        );

        res.json({ members: membersWithStats });
    } catch (error) {
        console.error('Error fetching members stats:', error);
        res.status(500).json({ error: 'Failed to fetch members stats' });
    }
});

module.exports = router;
