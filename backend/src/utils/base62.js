// Node.js crypto module import kar rahe hain secure random numbers ke liye
const crypto = require('crypto');

// =========================================================================
// SYSTEM DESIGN CONCEPT: BASE62 ENCODING & 7-CHARACTER KEY GENERATION
// Characters: [0-9, a-z, A-Z] = 10 + 26 + 26 = 62 characters
// 62^7 = 3,521,614,606,208 (3.5+ Trillion unique combinations)
// Satisfies the 10-year volume requirement (PDF Page 4).
// =========================================================================
const BASE62_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BASE62_CHARSET.length; // 62

/**
 * Number (Integer ID) ko Base62 string me convert karta hai.
 * Example: 125 -> Base62 string
 * @param {number|bigint} num 
 * @returns {string}
 */
function encodeBase62(num) {
    if (num === 0) return BASE62_CHARSET[0];
    let encoded = '';
    let current = BigInt(num);
    const bigBase = BigInt(BASE);

    while (current > 0n) {
        const remainder = Number(current % bigBase);
        encoded = BASE62_CHARSET[remainder] + encoded;
        current = current / bigBase;
    }
    return encoded;
}

/**
 * Base62 string ko waapis original integer ID me decode karta hai.
 * @param {string} str 
 * @returns {bigint}
 */
function decodeBase62(str) {
    let decoded = 0n;
    const bigBase = BigInt(BASE);

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const index = BASE62_CHARSET.indexOf(char);
        if (index === -1) {
            throw new Error(`Invalid Base62 character found: ${char}`);
        }
        decoded = decoded * bigBase + BigInt(index);
    }
    return decoded;
}

/**
 * Cryptographically secure random 7-character Base62 string generate karta hai.
 * System Design Note: Used to generate non-predictable keys so attackers
 * cannot guess sequential short URLs (PDF Page 12 - Obfuscation requirement).
 * @param {number} length Default 7 characters
 * @returns {string}
 */
function generateRandomBase62Key(length = 7) {
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        // Byte ko 0-61 index range me map karte hain
        result += BASE62_CHARSET[bytes[i] % BASE];
    }
    return result;
}

// Functions export karte hain
module.exports = {
    BASE62_CHARSET,
    encodeBase62,
    decodeBase62,
    generateRandomBase62Key
};