const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coachName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
alertSchema.index({ coachId: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
