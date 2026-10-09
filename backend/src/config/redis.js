// Environment variables load karne ke liye dotenv import
const dotenv = require('dotenv');
dotenv.config();

// High-performance Redis client library import karte hain
const Redis = require('ioredis');

// =========================================================================
// SYSTEM DESIGN CONCEPT: DISTRIBUTED IN-MEMORY CACHE
// Redis handles high-frequency read requests (<1ms latency) to achieve
// the 10,000 - 100,000 reads/sec scale mentioned in PDF Page 9-10.
// =========================================================================
const redisClient = new Redis({
    // Redis server host (e.g., 'localhost' ya 'redis' container)
    host: process.env.REDIS_HOST || 'localhost',
    
    // Default Redis port
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    
    // Agar Redis momentarily disconnect ho jaye to automatic exponential backoff retry
    retryStrategy(times) {
        // Delay calculated with cap of 2000ms
        const delay = Math.min(times * 50, 2000);
        console.warn(`⚠️ [Redis] Connection lost. Reconnecting in ${delay}ms (attempt #${times})...`);
        return delay;
    },
    
    // Maximum reconnect attempts before erroring
    maxRetriesPerRequest: 3,
});

// Redis successfully connect hone par log
redisClient.on('connect', () => {
    console.log('✅ [Redis] Connected to Redis Cache server successfully.');
});

// Redis ready state me aane par log (commands accept karne ke liye ready)
redisClient.on('ready', () => {
    console.log('🚀 [Redis] Client ready to process cache commands.');
});

// Error handling to prevent unhandled promise rejections
redisClient.on('error', (err) => {
    console.error('❌ [Redis Error]:', err.message);
});

// Helper function: Redis connectivity test karne ke liye PING command
const testRedisConnection = async () => {
    try {
        // Redis server ko PING bhejte hain, response me 'PONG' aana chahiye
        const pong = await redisClient.ping();
        console.log('✅ [Redis Health Check] Ping Response:', pong);
        return true;
    } catch (err) {
        console.error('❌ [Redis Health Check Failed]:', err.message);
        return false;
    }
};

// Export client instance aur health check helper
module.exports = {
    redisClient,
    testRedisConnection
};