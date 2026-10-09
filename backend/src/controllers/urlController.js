const urlService = require('../services/urlService');

// =========================================================================
// SYSTEM DESIGN CONCEPT: API CONTROLLER (PDF Page 5-6)
// Handles incoming HTTP payload, calls service layer, returns JSON & 302 Redirection.
// =========================================================================

class UrlController {

    /**
     * Endpoint: POST /api/urls
     * Input: { "longUrl": "https://example.com/very-long-url" }
     * Output: HTTP 201 Created with shortened URL JSON
     */
    async createShortUrl(req, res) {
        try {
            const { longUrl, expiresAt } = req.body;
            const userId = req.headers['x-user-id'] || 'anonymous';

            if (!longUrl) {
                return res.status(400).json({ error: 'Missing longUrl parameter in body.' });
            }

            // URL Service ko call karte hain short code generate aur DB/Cache me store karne ke liye
            const record = await urlService.createShortUrl(longUrl, userId, expiresAt);

            const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
            const shortUrl = `${baseUrl}/${record.short_code}`;

            // PDF Page 5 requirement: Return 201 Created status code
            return res.status(201).json({
                message: 'Short URL created successfully',
                shortCode: record.short_code,
                shortUrl: shortUrl,
                longUrl: record.long_url,
                expiresAt: record.expires_at,
                createdAt: record.created_at
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Endpoint: GET /:shortCode
     * PDF Page 6 requirement: 302 Found Redirection (or 301 Moved Permanently)
     */
    async redirectToLongUrl(req, res) {
        try {
            const { shortCode } = req.params;

            // Ignore browser favicon request
            if (shortCode === 'favicon.ico') {
                return res.status(204).end();
            }

            // Extract client metadata for non-blocking analytics
            const clickMetadata = {
                ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
                referrer: req.headers['referer'] || req.headers['referrer']
            };

            // Fetch original URL using Redis Cache-Aside Pattern
            const result = await urlService.getOriginalUrl(shortCode, clickMetadata);

            // Set Telemetry header to prove Cache HIT vs MISS in live demo!
            res.setHeader('X-Cache-Status', result.source);

            // PDF Page 6 requirement: Perform HTTP 302 Redirect to destination
            return res.redirect(302, result.longUrl);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            if (statusCode === 404) {
                return res.status(404).send('<h1>404 - Short Link Not Found</h1>');
            }
            if (statusCode === 410) {
                return res.status(410).send(`<h1>410 - Link Expired or Disabled</h1><p>${error.message}</p>`);
            }
            return res.status(500).send('<h1>500 - Internal Server Error</h1>');
        }
    }
}

module.exports = new UrlController();