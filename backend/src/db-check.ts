// src/db-check.ts

import pool from './config/database';

async function checkDatabaseSetup() {
    try {
        // Check if tables exist
        const tableQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        const tables = await pool.query(tableQuery);
        console.log('\nExisting tables:', tables.rows.map(row => row.table_name));

        // Check users table specifically
        try {
            const usersQuery = `
                SELECT count(*) as user_count
                FROM users
            `;
            const userCount = await pool.query(usersQuery);
            console.log('\nUser count:', userCount.rows[0].user_count);
        } catch (error) {
            console.log('\nUsers table not found or error:', error);
        }

    } catch (error) {
        console.error('Database check failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkDatabaseSetup().catch(console.error);