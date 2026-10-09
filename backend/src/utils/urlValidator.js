// URL class Node.js ke standard 'url' module se aati hai
const { URL } = require('url');

// =========================================================================
// SYSTEM DESIGN CONCEPT: INPUT SANITIZATION & SECURITY (PDF Page 12)
// Attackers malicious protocols (javascript:, file:, data:) bhej sakte hain.
// Hum ensure karte hain ki sirf valid HTTP aur HTTPS protocols allow hon.
// =========================================================================

/**
 * Checks whether a given string is a valid, well-formed HTTP/HTTPS URL.
 * @param {string} inputUrl 
 * @returns {boolean}
 */
function isValidUrl(inputUrl) {
    // Agar empty string ya null hai to turant reject karo
    if (!inputUrl || typeof inputUrl !== 'string') {
        return false;
    }

    try {
        // WHAT IT DOES: WHATWG standard URL parser se string parse karta hai
        const parsed = new URL(inputUrl.trim());
        
        // WHY IT MATTERS: XSS injection roko (only http:// or https:// permitted)
        const isHttpOrHttps = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        
        // Hostname empty nahi hona chahiye (e.g. 'http://' without domain is invalid)
        const hasValidHostname = parsed.hostname && parsed.hostname.includes('.');
        
        return isHttpOrHttps && hasValidHostname;
    } catch (err) {
        // Agar URL parse nahi ho payi to invalid syntax hai
        return false;
    }
}

/**
 * Strips unnecessary whitespace and normalizes the URL.
 * @param {string} inputUrl 
 * @returns {string}
 */
function sanitizeUrl(inputUrl) {
    // Leading and trailing spaces remove karte hain
    return inputUrl.trim();
}

module.exports = {
    isValidUrl,
    sanitizeUrl
};