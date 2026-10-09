const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Config and Services
dotenv.config();
const { testDbConnection } = require('./config/db');
const { testRedisConnection } = require('./config/redis');
const rateLimiter = require('./middlewares/rateLimiter');

// Controllers
const urlController = require('./controllers/urlController');
const analyticsController = require('./controllers/analyticsController');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// MIDDLEWARES SETUP
// =========================================================================
app.use(cors());                    // Cross-Origin Resource Sharing
app.use(express.json());            // Parse JSON body payload
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiter middleware to all API routes
app.use('/api', rateLimiter);

// =========================================================================
// ROUTES DEFINITION
// =========================================================================

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbStatus = await testDbConnection();
    const redisStatus = await testRedisConnection();
    return res.status(200).json({
        status: 'UP',
        services: {
            database: dbStatus ? 'HEALTHY' : 'DOWN',
            redisCache: redisStatus ? 'HEALTHY' : 'DOWN'
        },
        timestamp: new Date().toISOString()
    });
});

// API Route: Create Short URL (POST /api/urls)
app.post('/api/urls', (req, res) => urlController.createShortUrl(req, res));

// API Route: Get Analytics for a Short Code (GET /api/urls/:shortCode/analytics)
app.get('/api/urls/:shortCode/analytics', (req, res) => analyticsController.getAnalytics(req, res));

// Public Redirection Route: GET /:shortCode (Catch-all for short code redirection)
app.get('/:shortCode', (req, res) => urlController.redirectToLongUrl(req, res));

// =========================================================================
// SERVER INITIALIZATION & BOOTSTRAP
// =========================================================================
async function startServer() {
    console.log('🔄 Initializing system components...');
    
    // Verify PostgreSQL and Redis connections
    await testDbConnection();
    await testRedisConnection();

    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 URL Shortener Backend Server running on port ${PORT}`);
        console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`👉 Health Check: http://localhost:${PORT}/health`);
        console.log(`=======================================================`);
    });
}

startServer();