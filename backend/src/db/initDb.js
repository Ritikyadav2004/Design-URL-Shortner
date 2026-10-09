const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

async function initializeTables() {
    try {
        console.log('⏳ [DB Init] Reading init.sql and initializing database tables...');
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the entire SQL script
        await query(sql);
        console.log('✅ [DB Init] All database tables created successfully!');
    } catch (error) {
        console.error('❌ [DB Init Error]:', error.message);
    }
}

if (require.main === module) {
    initializeTables().then(() => process.exit(0));
}

module.exports = { initializeTables };