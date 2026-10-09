const { query } = require('../config/db');
const kgsService = require('./kgsService');
const cacheService = require('./cacheService');
const { isValidUrl, sanitizeUrl } = require('../utils/urlValidator');

// =========================================================================
// SYSTEM DESIGN CONCEPT: CORE BUSINESS LOGIC (PDF Page 5-6)
// Handles URL creation, redirection lookup with Cache-Aside strategy,
// and asynchronous click tracking.
// =========================================================================

class UrlService {

    /**
     * Creates a shortened URL.
     * @param {string} longUrl 
     * @param {string} userId 
     * @param {string} expiresAt Optional ISO expiration string
     */
    async createShortUrl(longUrl, userId = 'anonymous', expiresAt = null) {
        // STEP 1: Input Sanitization & Protocol Validation (PDF Page 12)
        const cleanUrl = sanitizeUrl(longUrl);
        if (!isValidUrl(cleanUrl)) {
            const err = new Error('Invalid URL format. Must start with http:// or https:// and have a valid domain.');
            err.statusCode = 400; // Bad Request
            throw err;
        }

        // STEP 2: Key Generation Service (KGS) se collision-free 7-char key allocate karo (PDF Page 8-9)
        const shortCode = await kgsService.getNextAvailableKey();

        // STEP 3: PostgreSQL Database me URL entry save karo
        const insertSql = `
            INSERT INTO urls (short_code, long_url, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            RETURNING short_code, long_url, user_id, click_count, is_active, expires_at, created_at;
        `;
        const values = [shortCode, cleanUrl, userId, expiresAt || null];
        const res = await query(insertSql, values);
        const newUrlRecord = res.rows[0];

        // STEP 4: Pre-warm the Redis Cache with new URL payload (Write-Through / Cache Warm)
        await cacheService.setUrlPayload(shortCode, newUrlRecord);

        return newUrlRecord;
    }

    /**
     * Resolves shortCode to original long URL using Redis Cache-Aside Pattern.
     * Performs non-blocking click analytics logging.
     * 
     * @param {string} shortCode 
     * @param {Object} clickMetadata { ipAddress, userAgent, referrer }
     * @returns {Promise<Object>} { longUrl, source: 'CACHE_HIT' | 'CACHE_MISS' }
     */
    async getOriginalUrl(shortCode, clickMetadata = {}) {
        let urlRecord = null;
        let source = 'CACHE_HIT';

        // 1. Redis Cache Me Check Karo (Cache-Aside Strategy)
        urlRecord = await cacheService.getUrlPayload(shortCode);

        // 2. Cache MISS! Database me query karo
        if (!urlRecord) {
            source = 'CACHE_MISS';
            const sql = `
                SELECT short_code, long_url, user_id, click_count, is_active, expires_at, created_at
                FROM urls
                WHERE short_code = $1;
            `;
            const res = await query(sql, [shortCode]);

            if (res.rows.length === 0) {
                const err = new Error('Short URL not found');
                err.statusCode = 404;
                throw err;
            }

            urlRecord = res.rows[0];

            // Future requests ke liye Redis cache me save karo
            await cacheService.setUrlPayload(shortCode, urlRecord);
        }

        // 3. Status Validation: Active & Expiration Checks (PDF Page 12)
        if (urlRecord.is_active === false) {
            const err = new Error('This short link has been disabled');
            err.statusCode = 410; // Gone
            throw err;
        }

        if (urlRecord.expires_at && new Date(urlRecord.expires_at) < new Date()) {
            const err = new Error('This short link has expired');
            err.statusCode = 410; // Gone
            throw err;
        }

        // 4. ASYNCHRONOUS ANALYTICS LOGGING (Non-blocking!)
        // User redirect ko wait nahi karwayenge, background me count badhayenge
        this._logClickAsynchronously(shortCode, clickMetadata).catch(err => {
            console.error('⚠️ [Analytics Async Error]:', err.message);
        });

        return {
            longUrl: urlRecord.long_url,
            shortCode: urlRecord.short_code,
            source: source // Telemetry info: CACHE_HIT vs CACHE_MISS
        };
    }

    /**
     * Asynchronously records click analytics & increments click count.
     * @private
     */
    async _logClickAsynchronously(shortCode, { ipAddress, userAgent, referrer }) {
        // Increment click count in main table
        const updateClickSql = `UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1;`;
        await query(updateClickSql, [shortCode]);

        // Insert click detail event
        const insertClickSql = `
            INSERT INTO url_clicks (short_code, user_agent, referrer, ip_address)
            VALUES ($1, $2, $3, $4);
        `;
        await query(insertClickSql, [shortCode, userAgent || 'Unknown', referrer || 'Direct', ipAddress || '127.0.0.1']);
    }
}

module.exports = new UrlService();