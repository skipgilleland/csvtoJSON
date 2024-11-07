// database/seeds/initial_seed.ts

import bcrypt from 'bcrypt';
import pool from '../config';

export async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        // Begin transaction
        await client.query('BEGIN');

        console.log('Starting to seed database...');

        // Create system admin company
        const companyResult = await client.query(
            `INSERT INTO companies (
                name,
                max_users,
                max_templates
            ) VALUES ($1, $2, $3)
            ON CONFLICT (name) DO NOTHING
            RETURNING id`,
            ['System Administrator', 999999, 999999]
        );

        const companyId = companyResult.rows[0]?.id;

        if (companyId) {
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
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (email) DO NOTHING`,
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

            console.log('Created super admin user:');
            console.log('Email: superadmin@example.com');
            console.log('Password: superadmin123');
        }

        // Create a sample company
        const sampleCompanyResult = await client.query(
            `INSERT INTO companies (
                name,
                max_users,
                max_templates,
                sftp_config
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (name) DO NOTHING
            RETURNING id`,
            [
                'Sample Company',
                5,
                10,
                JSON.stringify({
                    host: 'sftp.sample.com',
                    port: 22,
                    username: 'sample',
                    password: 'sample123',
                    remotePath: '/uploads'
                })
            ]
        );

        const sampleCompanyId = sampleCompanyResult.rows[0]?.id;

        if (sampleCompanyId) {
            // Create company admin
            const adminPasswordHash = await bcrypt.hash('admin123', 10);
            
            await client.query(
                `INSERT INTO users (
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    role,
                    company_id,
                    is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (email) DO NOTHING`,
                [
                    'admin@sample.com',
                    adminPasswordHash,
                    'Company',
                    'Admin',
                    'COMPANY_ADMIN',
                    sampleCompanyId,
                    true
                ]
            );

            console.log('\nCreated sample company admin:');
            console.log('Email: admin@sample.com');
            console.log('Password: admin123');

            // Create sample user
            const userPasswordHash = await bcrypt.hash('user123', 10);
            
            await client.query(
                `INSERT INTO users (
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    role,
                    company_id,
                    is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (email) DO NOTHING`,
                [
                    'user@sample.com',
                    userPasswordHash,
                    'Sample',
                    'User',
                    'COMPANY_USER',
                    sampleCompanyId,
                    true
                ]
            );

            console.log('\nCreated sample user:');
            console.log('Email: user@sample.com');
            console.log('Password: user123');
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log('\nDatabase seeded successfully!');

    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedDatabase().catch(console.error);
}