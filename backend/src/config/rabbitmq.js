const amqp = require('amqplib');

let channel = null;
let connection = null;

const connectRabbitMQ = async (retries = 5) => {
    const rabbitURL = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🐰 Attempting to connect to RabbitMQ... (${i + 1}/${retries})`);

            connection = await amqp.connect(rabbitURL);
            channel = await connection.createChannel();

            // Create queues
            await channel.assertQueue('workout-analysis', { durable: true });
            await channel.assertQueue('weekly-reports', { durable: true });

            console.log('✅ RabbitMQ connected successfully');

            // Handle connection errors
            connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err.message);
            });

            connection.on('close', () => {
                console.warn('⚠️  RabbitMQ connection closed');
            });

            return; // Success!
        } catch (error) {
            console.warn(`⚠️  RabbitMQ connection attempt ${i + 1} failed: ${error.message}`);

            if (i < retries - 1) {
                // Wait before retry (exponential backoff)
                const waitTime = Math.min(1000 * Math.pow(2, i), 10000);
                console.log(`   Retrying in ${waitTime / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.warn('⚠️  RabbitMQ not available - continuing without message queue');
            }
        }
    }
};

const publishToQueue = async (queueName, message) => {
    try {
        if (!channel) {
            return; // Silently skip if not connected
        }

        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });

        console.log(`📨 Message sent to queue: ${queueName}`);
    } catch (error) {
        // Silent fail
    }
};

const consumeQueue = async (queueName, callback) => {
    try {
        if (!channel) {
            return;
        }

        await channel.assertQueue(queueName, { durable: true });
        channel.consume(queueName, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content);
                channel.ack(msg);
            }
        });

        console.log(`👂 Listening to queue: ${queueName}`);
    } catch (error) {
        // Silent fail
    }
};

module.exports = {
    connectRabbitMQ,
    publishToQueue,
    consumeQueue
};
