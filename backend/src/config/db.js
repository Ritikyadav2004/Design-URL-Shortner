// dotenv package import kar rahe hain taaki .env variables read ho sakein
const dotenv = require('dotenv');
// Environment variables ko process.env me load karte hain
dotenv.config();

// PostgreSQL 'pg' library se Pool class import karte hain
const { Pool } = require('pg');

// =========================================================================
// SYSTEM DESIGN CONCEPT: CONNECTION POOLING
// Kyu zaroorat hai? Har request par naya TCP connection banane se DB choke
// ho jayega. Pool pehle se 20 reusable connections ready rakhta hai.
// =========================================================================
const pool = new Pool({
    // Database host (e.g. 'localhost' ya docker service name 'postgres')
    host: process.env.DB_HOST || 'localhost',
    
    // Default PostgreSQL port 5432
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    
    // Database username
    user: process.env.DB_USER || 'postgres',
    
    // Database user password
    password: process.env.DB_PASSWORD || 'postgres',
    
    // Target database name
    database: process.env.DB_NAME || 'url_shortener_db',
    
    // Maximum simultaneous open connections in pool
    max: 20,
    
    // Connection agar 30 seconds tak idle rahe to close ho jayega
    idleTimeoutMillis: 30000,
    
    // Agar pool me koi connection free na ho to max 2 second wait karega
    connectionTimeoutMillis: 2000,
});

// Jab bhi naya client pool me connect hota hai, ye event trigger hota hai
pool.on('connect', () => {
    console.log('✅ [PostgreSQL] Connected to database pool successfully.');
});

// Agar idle client me koi unexpected error aaye to application crash hone se bachata hai
pool.on('error', (err) => {
    console.error('❌ [PostgreSQL] Unexpected error on idle client:', err.message);
});

// Helper function: Ek generic query runner with automatic client release
const query = async (text, params) => {
    // Query start time measure karte hain (telemetry / latency tracking ke liye)
    const start = Date.now();
    try {
        // Query execute karte hain
        const res = await pool.query(text, params);
        // Kitna time laga calculate karte hain
        const duration = Date.now() - start;
        // console.log(`[SQL Query] Executed in ${duration}ms: ${text}`);
        return res;
    } catch (error) {
        console.error('❌ [PostgreSQL Query Error]:', error.message);
        throw error;
    }
};

// Application start hote waqt database connectivity verify karne ke liye helper function
const testDbConnection = async () => {
    try {
        // Simple ping query: SELECT NOW()
        const res = await query('SELECT NOW() as current_time');
        console.log('✅ [PostgreSQL Health Check] DB Time:', res.rows[0].current_time);
        return true;
    } catch (err) {
        console.error('❌ [PostgreSQL Health Check Failed]:', err.message);
        return false;
    }
};

// Export karte hain pool, query helper, aur health check function
module.exports = {
    pool,
    query,
    testDbConnection
};