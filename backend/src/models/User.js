const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    userType: {
        type: String,
        enum: ['member', 'coach'],
        required: true
    },
    // Profile details for members (filled on first login)
    profile: {
        height: Number, // in cm
        weight: Number, // in kg
        age: Number,
        experienceLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'pro']
        },
        availability: {
            type: String,
            enum: ['daily', '3-4 times a week', 'weekends only', 'flexible']
        },
        isProfileComplete: {
            type: Boolean,
            default: false
        }
    },
    // Coach-specific details
    coachDetails: {
        specialization: String,
        experience: Number,
        certifications: [String]
    },
    // Activity tracking
    stats: {
        totalWorkouts: {
            type: Number,
            default: 0
        },
        totalCaloriesBurned: {
            type: Number,
            default: 0
        },
        weeklyCalories: {
            type: Number,
            default: 0
        },
        lastWorkoutDate: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
