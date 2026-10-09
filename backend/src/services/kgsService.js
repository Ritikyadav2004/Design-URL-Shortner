// Database pool import karte hain queries aur transactions execute karne ke liye
const { pool } = require('../config/db');
// Random key generator import karte hain fallback generation ke liye
const { generateRandomBase62Key } = require('../utils/base62');

// =========================================================================
// SYSTEM DESIGN CONCEPT: KEY GENERATION SERVICE (KGS) (PDF Page 8-9)
// Problem: Direct hashing can lead to collisions.
// Solution: Pre-generate unique 7-char keys and reserve them using
// PostgreSQL ACID transactions with `FOR UPDATE SKIP LOCKED`.
// This guarantees that concurrent web server instances never pick the same key.
// =========================================================================

class KeyGenerationService {

    /**
     * Atomically reserves and returns an unused 7-character key from the database.
     * Uses ACID transaction isolation to guarantee zero race conditions.
     * @returns {Promise<string>}
     */
    async getNextAvailableKey() {
        // Dedicated client pool se lete hain taaki transaction run kar sakein
        const client = await pool.connect();

        try {
            // STEP 1: Transaction shuru karo (ACID Isolation)
            await client.query('BEGIN');

            // STEP 2: Ek unused key dhundo aur row ko lock karo
            // WHAT IT DOES: 
            // - `FOR UPDATE`: Row ko lock karta hai taaki koi aur transaction use na padh sake.
            // - `SKIP LOCKED`: Agar koi doosra worker kisi row par kaam kar raha hai,
            //   to ye wait nahi karega balki next available free row uthayega!
            const selectQuery = `
                SELECT key 
                FROM available_keys 
                WHERE is_used = FALSE 
                LIMIT 1 
                FOR UPDATE SKIP LOCKED;
            `;
            const result = await client.query(selectQuery);

            let selectedKey;

            if (result.rows.length > 0) {
                // Pre-generated key mil gayi
                selectedKey = result.rows[0].key;

                // STEP 3: Key ko used mark karo
                const updateQuery = `
                    UPDATE available_keys 
                    SET is_used = TRUE 
                    WHERE key = $1;
                `;
                await client.query(updateQuery, [selectedKey]);
            } else {
                // Agar pre-generated table empty ho jaye (Safety Fallback):
                // On-the-fly naya unique random key generate karke insert karte hain
                console.warn('⚠️ [KGS Warning] Pre-generated key pool exhausted! Generating on-the-fly key...');
                selectedKey = await this._generateFallbackKey(client);
            }

            // STEP 4: Transaction commit karo (changes permanently save)
            await client.query('COMMIT');
            return selectedKey;

        } catch (error) {
            // Agar koi bhi error aayi to transaction rollback karo (database safe rahega)
            await client.query('ROLLBACK');
            console.error('❌ [KGS Error] Failed to allocate key:', error.message);
            throw error;
        } finally {
            // Client ko waapis connection pool me release karo
            client.release();
        }
    }

    /**
     * Fallback key generator: Generates a random key and ensures no duplicate in DB.
     * @private
     */
    async _generateFallbackKey(client) {
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            const randomKey = generateRandomBase62Key(7);
            
            // Check if key already exists in urls table
            const check = await client.query('SELECT 1 FROM urls WHERE short_code = $1', [randomKey]);
            if (check.rows.length === 0) {
                // Key is completely free to use
                return randomKey;
            }
            attempts++;
        }
        throw new Error('Could not generate unique key after 5 attempts.');
    }

    /**
     * Unused keys ka count check karta hai (Monitoring/Replenishment alert ke liye).
     */
    async getRemainingKeyCount() {
        const res = await pool.query('SELECT COUNT(*) as count FROM available_keys WHERE is_used = FALSE');
        return parseInt(res.rows[0].count, 10);
    }
}

// Singleton instance export karte hain
module.exports = new KeyGenerationService();