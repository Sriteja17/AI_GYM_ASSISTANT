const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/auth');

// Get conversation between two users
router.get('/conversation/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId }
            ]
        })
            .populate('senderId', 'name userType')
            .populate('receiverId', 'name userType')
            .sort({ createdAt: 1 });

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Get all conversations for current user
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all unique users the current user has chatted with
        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })
            .populate('senderId', 'name userType')
            .populate('receiverId', 'name userType')
            .sort({ createdAt: -1 });

        // Group by conversation partner
        const conversationsMap = new Map();
        const userIdStr = userId.toString();

        messages.forEach(msg => {
            const partnerId = msg.senderId._id.toString() === userIdStr ?
                msg.receiverId._id.toString() :
                msg.senderId._id.toString();

            if (!conversationsMap.has(partnerId)) {
                const partner = msg.senderId._id.toString() === userIdStr ?
                    msg.receiverId :
                    msg.senderId;

                conversationsMap.set(partnerId, {
                    user: partner,
                    lastMessage: msg.message,
                    lastMessageTime: msg.createdAt,
                    unreadCount: 0
                });
            }
        });

        // Count unread messages
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiverId: req.user._id,
                    isRead: false
                }
            },
            {
                $group: {
                    _id: '$senderId',
                    count: { $sum: 1 }
                }
            }
        ]);

        unreadCounts.forEach(item => {
            const partnerId = item._id.toString();
            if (conversationsMap.has(partnerId)) {
                conversationsMap.get(partnerId).unreadCount = item.count;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Mark messages as read
router.put('/mark-read/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        await Message.updateMany(
            {
                senderId: otherUserId,
                receiverId: currentUserId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

module.exports = router;
