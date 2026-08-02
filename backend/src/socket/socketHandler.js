const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { publishToQueue } = require('../config/rabbitmq');

// Store online users: userId -> socketId
const onlineUsers = new Map();

function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Auto-register authenticated user (socket.userId is set by auth middleware)
        if (socket.userId) {
            onlineUsers.set(socket.userId, socket.id);
            console.log(`User ${socket.userId} is now online`);

            // Notify others that this user is online
            socket.broadcast.emit('user:status', {
                userId: socket.userId,
                status: 'online'
            });

            socket.emit('system:message', {
                message: 'Connected to real-time server'
            });
        }

        // Legacy user registration (for backwards compatibility)
        socket.on('user:register', async (userId) => {
            try {
                socket.userId = userId;
                onlineUsers.set(userId, socket.id);

                // Notify others that this user is online
                socket.broadcast.emit('user:status', {
                    userId,
                    status: 'online'
                });

                console.log(`User ${userId} is now online (via register event)`);

                socket.emit('system:message', {
                    message: 'Connected to real-time server'
                });
            } catch (error) {
                console.error('Error registering user:', error);
            }
        });

        // Send 1-on-1 message (Coach <-> Member)
        socket.on('message:send', async (data) => {
            try {
                const { receiverId, message } = data;
                const senderId = socket.userId;

                if (!senderId) {
                    return socket.emit('error', { message: 'Not authenticated' });
                }

                // Save message to database
                const newMessage = new Message({
                    senderId,
                    receiverId,
                    message,
                    deliveredAt: new Date()
                });

                await newMessage.save();
                await newMessage.populate('senderId', 'name userType');
                await newMessage.populate('receiverId', 'name userType');

                // Check if receiver is online
                const receiverSocketId = onlineUsers.get(receiverId);

                if (receiverSocketId) {
                    // Send to online receiver
                    io.to(receiverSocketId).emit('message:received', {
                        ...newMessage.toObject(),
                        _id: newMessage._id
                    });
                } else {
                    // Queue message for offline user in RabbitMQ
                    console.log(`User ${receiverId} is offline, queueing message`);
                    await publishToQueue('offline_messages', {
                        receiverId,
                        messageId: newMessage._id.toString(),
                        senderId,
                        message,
                        timestamp: new Date().toISOString()
                    });
                }

                // Confirm to sender
                socket.emit('message:sent', {
                    ...newMessage.toObject(),
                    tempId: data.tempId
                });

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Mark message as read
        socket.on('message:read', async (data) => {
            try {
                const { messageId, senderId } = data;

                await Message.findByIdAndUpdate(messageId, {
                    isRead: true,
                    readAt: new Date()
                });

                // Notify sender that message was read
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message:read', {
                        messageId,
                        readAt: new Date()
                    });
                }
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        });

        // Typing indicator
        socket.on('typing:start', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing:start', {
                    userId: socket.userId
                });
            }
        });

        socket.on('typing:stop', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing:stop', {
                    userId: socket.userId
                });
            }
        });

        // Send alert to all members (Coach only)
        socket.on('alert:send', async (data) => {
            try {
                const { message } = data;
                const coachId = socket.userId;

                // Verify coach
                const coach = await User.findById(coachId);
                if (!coach || coach.userType !== 'coach') {
                    return socket.emit('error', { message: 'Only coaches can send alerts' });
                }

                // Get all members
                const members = await User.find({ userType: 'member' }).select('_id');
                const recipientIds = members.map(m => m._id.toString());

                // Save alert
                const newAlert = new Alert({
                    coachId,
                    coachName: coach.name,
                    message,
                    recipients: members.map(m => m._id),
                    readBy: []
                });

                await newAlert.save();

                // Broadcast to all online members
                let onlineCount = 0;
                let offlineCount = 0;

                recipientIds.forEach(memberId => {
                    const memberSocketId = onlineUsers.get(memberId);
                    if (memberSocketId) {
                        io.to(memberSocketId).emit('alert:new', {
                            _id: newAlert._id,
                            coachName: coach.name,
                            message: newAlert.message,
                            createdAt: newAlert.createdAt
                        });
                        onlineCount++;
                    } else {
                        offlineCount++;
                    }
                });

                // Queue alerts for offline members in RabbitMQ
                if (offlineCount > 0) {
                    await publishToQueue('offline_alerts', {
                        alertId: newAlert._id.toString(),
                        coachName: coach.name,
                        message: newAlert.message,
                        recipients: recipientIds,
                        timestamp: new Date().toISOString()
                    });
                }

                // Confirm to coach
                socket.emit('alert:sent', {
                    alert: newAlert,
                    onlineCount,
                    offlineCount,
                    totalCount: recipientIds.length
                });

            } catch (error) {
                console.error('Error sending alert:', error);
                socket.emit('error', { message: 'Failed to send alert' });
            }
        });

        // User disconnect
        socket.on('disconnect', async () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);

                // Notify others
                socket.broadcast.emit('user:status', {
                    userId: socket.userId,
                    status: 'offline'
                });

                console.log(`User ${socket.userId} is now offline`);
            }
            console.log('Client disconnected:', socket.id);
        });
    });
}

// Helper functions
function isUserOnline(userId) {
    return onlineUsers.has(userId);
}

function getOnlineUsers() {
    return Array.from(onlineUsers.keys());
}

module.exports = {
    initializeSocket,
    isUserOnline,
    getOnlineUsers
};
