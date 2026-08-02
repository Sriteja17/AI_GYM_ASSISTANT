// Script to clear all chat messages from the database
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker';

async function clearMessages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the Message model
        const Message = require('../src/models/Message');

        // Count existing messages
        const count = await Message.countDocuments();
        console.log(`Found ${count} messages in the database`);

        if (count > 0) {
            // Delete all messages
            const result = await Message.deleteMany({});
            console.log(`✅ Deleted ${result.deletedCount} messages successfully!`);
        } else {
            console.log('No messages to delete.');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearMessages();
