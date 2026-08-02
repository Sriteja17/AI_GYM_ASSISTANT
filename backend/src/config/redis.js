const redis = require('redis');

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379
            }
        });

        redisClient.on('error', (err) => {
            console.warn('⚠️  Redis error:', err.message);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
            isConnected = true;
        });

        await redisClient.connect();
    } catch (error) {
        console.warn('⚠️  Redis not available - continuing without cache');
        redisClient = null;
    }
};

// Create a safe wrapper that check if Redis is available
const safeRedis = {
    get: async (key) => {
        if (!redisClient || !isConnected) return null;
        try {
            return await redisClient.get(key);
        } catch (e) {
            return null;
        }
    },
    setEx: async (key, seconds, value) => {
        if (!redisClient || !isConnected) return;
        try {
            await redisClient.setEx(key, seconds, value);
        } catch (e) {
            // Silent fail
        }
    },
    del: async (key) => {
        if (!redisClient || !isConnected) return;
        try {
            await redisClient.del(key);
        } catch (e) {
            // Silent fail
        }
    }
};

module.exports = safeRedis;
module.exports.connectRedis = connectRedis;
