const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    exercises: [{
        name: String,
        sets: Number,
        reps: mongoose.Schema.Types.Mixed, // Can be number or array
        weight: mongoose.Schema.Types.Mixed, // Can be number or array
        duration: Number, // in minutes
        caloriesBurned: Number
    }],
    totalCalories: {
        type: Number,
        default: 0
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    notes: String,
    aiSuggestions: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);
