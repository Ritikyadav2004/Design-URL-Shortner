const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Config and Services
dotenv.config();
const { testDbConnection } = require('./config/db');
const { testRedisConnection } = require('./config/redis');
const { initializeTables } = require('./db/initDb');
const kgsService = require('./services/kgsService');
const { seedKeyPool } = require('./db/seedKeys');
const rateLimiter = require('./middlewares/rateLimiter');

// Controllers
const urlController = require('./controllers/urlController');
const analyticsController = require('./controllers/analyticsController');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;
const SERVER_ID = process.env.SERVER_ID || 'standalone-node';

// =========================================================================
// MIDDLEWARES SETUP
// =========================================================================
app.use(cors());                    // Cross-Origin Resource Sharing
app.use(express.json());            // Parse JSON body payload
app.use(express.urlencoded({ extended: true }));

// SYSTEM DESIGN TELEMETRY HEADER: Identifies which backend replica processed the request
app.use((req, res, next) => {
    res.setHeader('X-Server-Id', SERVER_ID);
    next();
});

// Apply Rate Limiter middleware to all API routes
app.use('/api', rateLimiter);

// =========================================================================
// ROUTES DEFINITION
// =========================================================================

// Health check endpoint with node identity
app.get('/health', async (req, res) => {
    const dbStatus = await testDbConnection();
    const redisStatus = await testRedisConnection();
    return res.status(200).json({
        status: 'UP',
        serverId: SERVER_ID,
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
    console.log(`🔄 [${SERVER_ID}] Initializing system components...`);
    
    // Verify PostgreSQL and Redis connections
    const dbOk = await testDbConnection();
    await testRedisConnection();

    // Auto-initialize DB tables and Key Generation Service pool if needed
    if (dbOk) {
        try {
            await initializeTables();
            const remainingKeys = await kgsService.getRemainingKeyCount();
            console.log(`🔑 [KGS Pool Status] Available keys in pool: ${remainingKeys}`);
            if (remainingKeys < 1000) {
                console.log(`⚡ [KGS Auto-Replenish] Pool is low. Seeding 10,000 keys...`);
                await seedKeyPool(10000);
            }
        } catch (initErr) {
            console.warn(`⚠️ [${SERVER_ID} Init Warning]:`, initErr.message);
        }
    }

    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 [${SERVER_ID}] Backend Server running on port ${PORT}`);
        console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`👉 Health Check: http://localhost:${PORT}/health`);
        console.log(`=======================================================`);
    });
}

startServer();