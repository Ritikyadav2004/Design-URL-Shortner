// Database connection pool import
const { pool } = require('../config/db');
// Random 7-char key generator import
const { generateRandomBase62Key } = require('../utils/base62');

// =========================================================================
// SYSTEM DESIGN CONCEPT: KGS PRE-GENERATION WORKER (PDF Page 8-9)
// "We can generate all the possible keys with 7 characters and store
// them in a database as keys... where key is the generated URL and boolean is false."
// Ye script batch me 10,000 unique keys insert karta hai taaki runtime par zero delay ho!
// =========================================================================

async function seedKeyPool(batchSize = 10000) {
    console.log(`⏳ [KGS Seeder] Generating and inserting ${batchSize} unique 7-character keys...`);
    const startTime = Date.now();

    // Set use karte hain taaki memory me hi duplicates filter ho jayein
    const keysSet = new Set();
    while (keysSet.size < batchSize) {
        keysSet.add(generateRandomBase62Key(7));
    }

    const uniqueKeys = Array.from(keysSet);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // High-performance batch insertion using unnest() in PostgreSQL
        // Single INSERT with array is 100x faster than 10,000 separate INSERT queries!
        const insertQuery = `
            INSERT INTO available_keys (key, is_used)
            SELECT unnest($1::text[]), FALSE
            ON CONFLICT (key) DO NOTHING;
        `;

        const res = await client.query(insertQuery, [uniqueKeys]);
        await client.query('COMMIT');

        const elapsed = Date.now() - startTime;
        console.log(`✅ [KGS Seeder] Successfully seeded keys! (Rows affected: ${res.rowCount}) in ${elapsed}ms.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ [KGS Seeder Error]:', err.message);
    } finally {
        client.release();
    }
}

// Agar command line se directly run kiya jaye (`node src/db/seedKeys.js`)
if (require.main === module) {
    seedKeyPool(10000)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedKeyPool };