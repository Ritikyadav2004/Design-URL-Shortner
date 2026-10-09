// Redis connection client import karte hain
const { redisClient } = require('../config/redis');

// Default TTL (Time To Live) in seconds from env or 3600 seconds (1 hour)
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600;

// =========================================================================
// SYSTEM DESIGN CONCEPT: DISTRIBUTED CACHE-ASIDE SERVICE (PDF Page 9-10)
// This service abstracts all Redis caching operations.
// Redis maintains an LRU (Least Recently Used) eviction policy.
// =========================================================================

class CacheService {

    /**
     * Constructs a consistent key prefix for Redis storage.
     * Example: 'url:3ad32p9'
     */
    _getCacheKey(shortCode) {
        return `url:${shortCode}`;
    }

    /**
     * Fetches cached URL payload from Redis.
     * @param {string} shortCode 
     * @returns {Promise<Object|null>} Returns parsed URL data on HIT, null on MISS
     */
    async getUrlPayload(shortCode) {
        try {
            const key = this._getCacheKey(shortCode);
            // Redis se string payload fetch karte hain
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                // CACHE HIT! JSON parse karke return karo
                return JSON.parse(cachedData);
            }
            // CACHE MISS! Null return karo
            return null;
        } catch (error) {
            // Cache fail hone par system arrest nahi hona chahiye, log error & fallback to DB
            console.error(`⚠️ [Cache Service Error] Failed to GET key ${shortCode}:`, error.message);
            return null;
        }
    }

    /**
     * Saves URL payload into Redis with an expiration TTL.
     * @param {string} shortCode 
     * @param {Object} urlPayload 
     * @param {number} ttlSeconds 
     */
    async setUrlPayload(shortCode, urlPayload, ttlSeconds = DEFAULT_TTL) {
        try {
            const key = this._getCacheKey(shortCode);
            const serialized = JSON.stringify(urlPayload);

            // 'EX' sets expiration in seconds (TTL eviction policy from PDF page 10)
            await redisClient.set(key, serialized, 'EX', ttlSeconds);
        } catch (error) {
            console.error(`⚠️ [Cache Service Error] Failed to SET key ${shortCode}:`, error.message);
        }
    }

    /**
     * Invalidate (delete) cache entry if a URL is updated or disabled.
     */
    async invalidate(shortCode) {
        try {
            const key = this._getCacheKey(shortCode);
            await redisClient.del(key);
        } catch (error) {
            console.error(`⚠️ [Cache Service Error] Failed to DEL key ${shortCode}:`, error.message);
        }
    }
}

module.exports = new CacheService();