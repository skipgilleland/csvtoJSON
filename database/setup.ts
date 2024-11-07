// database/setup.ts

import { promises as fs } from 'fs';
import path from 'path';
import pool, { testConnection } from './config';

async function setupDatabase() {
    try {
        // Test database connection first
        console.log('Testing database connection...');
        await testConnection();

        const client = await pool.connect();
        console.log('Connected to database, beginning setup...');

        try {
            // Begin transaction
            await client.query('BEGIN');

            // Read migration file
            const migrationPath = path.join(__dirname, 'migrations', '001_initial_setup.sql');
            console.log('Reading migration file from:', migrationPath);
            
            const migrationSQL = await fs.readFile(migrationPath, 'utf8');
            console.log('Migration file read successfully');

            // Execute migration
            console.log('Executing migration...');
            await client.query(migrationSQL);
            console.log('Migration completed successfully');

            // Commit transaction
            await client.query('COMMIT');
            console.log('Database schema created successfully');

            // Run seed
            console.log('Starting database seed...');
            const { seedDatabase } = require('./seeds/initial_seed');
            await seedDatabase();
            console.log('Database seeded successfully');

            console.log('Complete database setup finished successfully');
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Error during database setup:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Database setup failed:', error);
        throw error;
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase().catch((error) => {
        console.error('Database setup failed:', error);
        process.exit(1);
    });
}

export default setupDatabase;