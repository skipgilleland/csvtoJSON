// src/test-db.ts

import pool, { testConnection, checkDatabaseTables } from './config/database';

async function testDatabase() {
    try {
        // Test connection
        await testConnection();
        
        // Check tables
        await checkDatabaseTables();
        
        console.log('All database tests passed!');
    } catch (error) {
        console.error('Database test failed:', error);
    } finally {
        // Close pool
        await pool.end();
    }
}

testDatabase();