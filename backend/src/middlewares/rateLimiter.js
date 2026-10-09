const { redisClient } = require('../config/redis');

// Configuration from environment variables
const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS, 10) || 60; // 60 seconds
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;    // 100 requests per window

// =========================================================================
// SYSTEM DESIGN CONCEPT: SLIDING WINDOW RATE LIMITER (PDF Page 12)
// Protects the URL Shortener against DDoS attacks and brute-force key scraping.
// Uses Redis atomic `INCR` and `EXPIRE` commands.
// =========================================================================

const rateLimiter = async (req, res, next) => {
    try {
        // Client ka IP address detect karte hain
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        
        // Redis key format: 'ratelimit:192.168.1.1'
        const redisKey = `ratelimit:${clientIp}`;

        // WHAT IT DOES: Atomic counter increment in Redis
        const currentRequests = await redisClient.incr(redisKey);

        // Agar ye IP ki pehli request hai window me, to TTL timer set karo
        if (currentRequests === 1) {
            await redisClient.expire(redisKey, WINDOW_SECONDS);
        }

        // Response headers set karte hain (Rate limit transparency)
        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - currentRequests));

        // Limit exceed check karo
        if (currentRequests > MAX_REQUESTS) {
            console.warn(`🛑 [Rate Limit Exceeded] IP: ${clientIp} made ${currentRequests} requests.`);
            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. You can only make ${MAX_REQUESTS} requests per ${WINDOW_SECONDS} seconds.`
            });
        }

        // Limit ke andar hai, request ko next handler me jaane do
        next();
    } catch (error) {
        // Rate limiter fail ho jaye to system break nahi hona chahiye, log and pass
        console.error('⚠️ [Rate Limiter Middleware Error]:', error.message);
        next();
    }
};

module.exports = rateLimiter;