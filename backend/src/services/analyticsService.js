const { query } = require('../config/db');

// =========================================================================
// SYSTEM DESIGN CONCEPT: LINK TELEMETRY & ANALYTICS
// Aggregates total clicks, top referrers, and recent clicks for user dashboard.
// =========================================================================

class AnalyticsService {

    /**
     * Retrieves analytics summary for a specific short link.
     */
    async getLinkAnalytics(shortCode) {
        // 1. Link details check karo
        const urlRes = await query('SELECT short_code, long_url, click_count, created_at FROM urls WHERE short_code = $1', [shortCode]);
        if (urlRes.rows.length === 0) {
            const err = new Error('URL not found');
            err.statusCode = 404;
            throw err;
        }
        const urlInfo = urlRes.rows[0];

        // 2. Recent 20 click events fetch karo
        const clicksRes = await query(`
            SELECT user_agent, referrer, ip_address, clicked_at
            FROM url_clicks
            WHERE short_code = $1
            ORDER BY clicked_at DESC
            LIMIT 20;
        `, [shortCode]);

        // 3. Top referrers aggregation (SQL GROUP BY)
        const referrersRes = await query(`
            SELECT referrer, COUNT(*) as count
            FROM url_clicks
            WHERE short_code = $1
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 5;
        `, [shortCode]);

        return {
            info: urlInfo,
            recentClicks: clicksRes.rows,
            topReferrers: referrersRes.rows
        };
    }
}

module.exports = new AnalyticsService();