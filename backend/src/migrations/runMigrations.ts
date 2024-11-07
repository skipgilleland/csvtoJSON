// src/migrations/runMigrations.ts

import { promises as fs } from 'fs';
import path from 'path';
import pool from '../config/database';
import bcrypt from 'bcrypt';

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        // Begin transaction
        await client.query('BEGIN');

        // Read and execute migration file
        const migrationPath = path.join(__dirname, '001_initial_setup.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        await client.query(migrationSQL);
        
        console.log('Migrations completed successfully');

        // Create initial super admin company
        const companyResult = await client.query(
            `INSERT INTO companies (name, max_users, max_templates)
             VALUES ($1, $2, $3)
             RETURNING id`,
            ['System Administrator', 999999, 999999]
        );

        const companyId = companyResult.rows[0].id;

        // Create super admin user
        const passwordHash = await bcrypt.hash('superadmin123', 10);
        await client.query(
            `INSERT INTO users (
                email,
                password_hash,
                first_name,
                last_name,
                role,
                company_id,
                is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                'superadmin@example.com',
                passwordHash,
                'Super',
                'Admin',
                'SUPER_ADMIN',
                companyId,
                true
            ]
        );

        console.log('Initial super admin account created:');
        console.log('Email: superadmin@example.com');
        console.log('Password: superadmin123');

        // Commit transaction
        await client.query('COMMIT');
        
        console.log('Database setup completed successfully');
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Error during database setup:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migrations
runMigrations().catch(console.error);