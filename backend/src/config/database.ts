// src/config/database.ts

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the database configuration interface
interface DatabaseConfig {
    user: string;
    password: string | undefined;
    host: string;
    database: string;
    port: number;
    ssl: boolean | { rejectUnauthorized: boolean };
}

// Database configuration object
const dbConfig: DatabaseConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'csv_transformer',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Log database configuration (excluding password)
console.log('Database Configuration:', {
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port
});

// Validate database configuration
function validateConfig(config: DatabaseConfig): void {
    const requiredFields: (keyof DatabaseConfig)[] = ['user', 'password', 'host', 'database', 'port'];
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing required database configuration fields: ${missingFields.join(', ')}`);
    }
}

// Validate configuration
validateConfig(dbConfig);

// Create pool
const pool = new Pool(dbConfig);

// Pool error handling
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Pool connect handling
pool.on('connect', () => {
    console.log('New client connected to database');
});

// Test database connection function
export const testConnection = async (): Promise<boolean> => {
    let client: PoolClient | null = null;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        console.log('Database connection test successful:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
};

// Utility function to get a client from the pool with timeout
export const getClient = async (timeout = 5000): Promise<PoolClient> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Database connection timed out after ${timeout}ms`));
        }, timeout);
    });

    try {
        const client = await Promise.race([
            pool.connect(),
            timeoutPromise
        ]) as PoolClient;
        return client;
    } catch (error) {
        console.error('Error getting database client:', error);
        throw error;
    }
};

// Function to check if tables exist
export const checkDatabaseTables = async (): Promise<void> => {
    const client = await pool.connect();
    try {
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('Available database tables:', tables.rows.map(row => row.table_name));
        
        // Check for required tables
        const requiredTables = ['users', 'companies'];
        const missingTables = requiredTables.filter(
            table => !tables.rows.find(row => row.table_name === table)
        );
        
        if (missingTables.length > 0) {
            console.warn('Missing required tables:', missingTables);
        }
    } finally {
        client.release();
    }
};

// Function to gracefully close pool
export const closePool = async (): Promise<void> => {
    try {
        await pool.end();
        console.log('Database pool closed successfully');
    } catch (error) {
        console.error('Error closing database pool:', error);
        throw error;
    }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
    try {
        await closePool();
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
});

// Export pool as default
export default pool;