const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-tracker');
        console.log('Connected to MongoDB\n');

        // Define schemas
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
        const Alert = mongoose.model('Alert', new mongoose.Schema({}, { strict: false }));
        const Workout = mongoose.model('Workout', new mongoose.Schema({}, { strict: false }));

        // Count before deletion
        const userCount = await User.countDocuments();
        const messageCount = await Message.countDocuments();
        const alertCount = await Alert.countDocuments();
        const workoutCount = await Workout.countDocuments();

        console.log('Current data in database:');
        console.log(`  📧 Messages: ${messageCount}`);
        console.log(`  🔔 Alerts: ${alertCount}`);
        console.log(`  👤 Users: ${userCount}`);
        console.log(`  🏋️ Workouts: ${workoutCount}`);
        console.log('');

        // Delete all data
        console.log('Deleting all data...\n');

        await Message.deleteMany({});
        console.log('✅ All messages deleted');

        await Alert.deleteMany({});
        console.log('✅ All alerts deleted');

        await Workout.deleteMany({});
        console.log('✅ All workouts deleted');

        await User.deleteMany({});
        console.log('✅ All users deleted');

        console.log('\n🗑️  Database cleared successfully!');
        console.log('You can now register fresh accounts.\n');

        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

clearDatabase();
