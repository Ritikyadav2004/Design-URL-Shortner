const analyticsService = require('../services/analyticsService');

class AnalyticsController {

    /**
     * Endpoint: GET /api/urls/:shortCode/analytics
     */
    async getAnalytics(req, res) {
        try {
            const { shortCode } = req.params;
            const analytics = await analyticsService.getLinkAnalytics(shortCode);
            return res.status(200).json(analytics);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ error: error.message });
        }
    }
}

module.exports = new AnalyticsController();