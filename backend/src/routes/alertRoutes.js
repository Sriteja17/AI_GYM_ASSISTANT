const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Get all alerts for member
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const user = req.user;

        if (user.userType === 'member') {
            // Get alerts where this user is a recipient
            const alerts = await Alert.find({
                recipients: req.user._id
            })
                .sort({ createdAt: -1 })
                .limit(50);

            // Check which alerts are read by this user
            const alertsWithReadStatus = alerts.map(alert => {
                const isRead = alert.readBy.some(
                    rb => rb.userId.toString() === userId
                );
                return {
                    _id: alert._id,
                    coachName: alert.coachName,
                    message: alert.message,
                    createdAt: alert.createdAt,
                    isRead: isRead
                };
            });

            res.json({ alerts: alertsWithReadStatus });
        } else if (user.userType === 'coach') {
            // Get alerts sent by this coach
            const alerts = await Alert.find({ coachId: req.user._id })
                .sort({ createdAt: -1 })
                .limit(50);

            res.json({ alerts });
        } else {
            res.status(403).json({ error: 'Invalid user type' });
        }
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Mark alert as read (Member only)
router.put('/:alertId/read', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const alertId = req.params.alertId;

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // Check if already read
        const alreadyRead = alert.readBy.some(
            rb => rb.userId.toString() === userId
        );

        if (!alreadyRead) {
            alert.readBy.push({
                userId,
                readAt: new Date()
            });
            await alert.save();
        }

        res.json({ message: 'Alert marked as read' });
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
});

module.exports = router;
