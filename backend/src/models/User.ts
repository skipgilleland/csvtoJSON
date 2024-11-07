import pool from '../config/database';
import { QueryResult } from 'pg';
import bcryptjs from 'bcryptjs';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
    id: string;
    company_id: string | null;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    status: UserStatus;
    created_at: Date;
    updated_at: Date;
    last_login_at?: Date;
    is_active: boolean;
}

export interface CreateUserDTO {
    company_id: string | null;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole;
}

export interface UpdateUserDTO {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role?: UserRole;
    status?: UserStatus;
    is_active?: boolean;
}

export interface UserFilters {
    company_id?: string;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    is_active?: boolean;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export const UserModel = {
    // Create new user
    async create(userData: CreateUserDTO): Promise<Omit<User, 'password_hash'>> {
        try {
            console.log('Creating new user:', { email: userData.email, role: userData.role });

            const salt = await bcryptjs.genSalt(10);
            const password_hash = await bcryptjs.hash(userData.password, salt);

            const query = `
                INSERT INTO users (
                    company_id,
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    role,
                    status,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, company_id, email, first_name, last_name, role, status, created_at, updated_at, last_login_at, is_active
            `;

            const values = [
                userData.company_id,
                userData.email.toLowerCase(),
                password_hash,
                userData.first_name,
                userData.last_name,
                userData.role,
                'active',
                true
            ];

            const result: QueryResult<User> = await pool.query(query, values);
            const { password_hash: _, ...userWithoutPassword } = result.rows[0];
            
            console.log('User created successfully:', { id: userWithoutPassword.id, email: userWithoutPassword.email });
            return userWithoutPassword;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Find all users with filters and pagination
    async findAll(
        filters: UserFilters,
        pagination: PaginationParams
    ): Promise<{ users: Omit<User, 'password_hash'>[]; total: number }> {
        try {
            const conditions: string[] = ['1 = 1'];
            const values: any[] = [];
            let valueIndex = 1;

            if (filters.company_id) {
                conditions.push(`company_id = $${valueIndex}`);
                values.push(filters.company_id);
                valueIndex++;
            }

            if (filters.role) {
                conditions.push(`role = $${valueIndex}`);
                values.push(filters.role);
                valueIndex++;
            }

            if (filters.status) {
                conditions.push(`status = $${valueIndex}`);
                values.push(filters.status);
                valueIndex++;
            }

            if (filters.is_active !== undefined) {
                conditions.push(`is_active = $${valueIndex}`);
                values.push(filters.is_active);
                valueIndex++;
            }

            if (filters.search) {
                conditions.push(`(
                    email ILIKE $${valueIndex} OR
                    first_name ILIKE $${valueIndex} OR
                    last_name ILIKE $${valueIndex}
                )`);
                values.push(`%${filters.search}%`);
                valueIndex++;
            }

            const whereClause = conditions.join(' AND ');

            // Get total count
            const countQuery = `
                SELECT COUNT(*)
                FROM users
                WHERE ${whereClause}
            `;
            const countResult = await pool.query(countQuery, values);
            const total = parseInt(countResult.rows[0].count);

            // Get paginated results
            const query = `
                SELECT 
                    id,
                    company_id,
                    email,
                    first_name,
                    last_name,
                    role,
                    status,
                    created_at,
                    updated_at,
                    last_login_at,
                    is_active
                FROM users
                WHERE ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
            `;
            values.push(pagination.limit, (pagination.page - 1) * pagination.limit);

            const result: QueryResult<User> = await pool.query(query, values);
            const users = result.rows.map(({ password_hash: _, ...user }) => user);

            return { users, total };
        } catch (error) {
            console.error('Error finding users:', error);
            throw error;
        }
    },

    // Find user by ID
    async findById(id: string): Promise<User | null> {
        try {
            console.log('Finding user by ID:', id);
            
            const query = 'SELECT * FROM users WHERE id = $1';
            const result: QueryResult<User> = await pool.query(query, [id]);
            
            if (result.rows[0]) {
                console.log('User found:', { id: result.rows[0].id, email: result.rows[0].email });
            } else {
                console.log('No user found with ID:', id);
            }
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    },

    // Find user by email
    async findByEmail(email: string): Promise<User | null> {
        try {
            console.log('Finding user by email:', email);
            
            const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
            const result: QueryResult<User> = await pool.query(query, [email.toLowerCase()]);
            
            if (result.rows[0]) {
                console.log('User found:', { id: result.rows[0].id, email: result.rows[0].email });
            } else {
                console.log('No user found with email:', email);
            }
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    },

    // Update user
    async update(id: string, data: UpdateUserDTO): Promise<Omit<User, 'password_hash'> | null> {
        try {
            console.log('Updating user:', { id, ...data });

            const updates: string[] = [];
            const values: any[] = [id];
            let valueIndex = 2;

            if (data.email !== undefined) {
                updates.push(`email = $${valueIndex}`);
                values.push(data.email.toLowerCase());
                valueIndex++;
            }

            if (data.password !== undefined) {
                const salt = await bcryptjs.genSalt(10);
                const password_hash = await bcryptjs.hash(data.password, salt);
                updates.push(`password_hash = $${valueIndex}`);
                values.push(password_hash);
                valueIndex++;
            }

            if (data.first_name !== undefined) {
                updates.push(`first_name = $${valueIndex}`);
                values.push(data.first_name);
                valueIndex++;
            }

            if (data.last_name !== undefined) {
                updates.push(`last_name = $${valueIndex}`);
                values.push(data.last_name);
                valueIndex++;
            }

            if (data.role !== undefined) {
                updates.push(`role = $${valueIndex}`);
                values.push(data.role);
                valueIndex++;
            }

            if (data.status !== undefined) {
                updates.push(`status = $${valueIndex}`);
                values.push(data.status);
                valueIndex++;
            }

            if (data.is_active !== undefined) {
                updates.push(`is_active = $${valueIndex}`);
                values.push(data.is_active);
                valueIndex++;
            }

            if (updates.length === 0) {
                console.log('No updates provided for user:', id);
                return null;
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');

            const query = `
                UPDATE users
                SET ${updates.join(', ')}
                WHERE id = $1
                RETURNING id, company_id, email, first_name, last_name, role, status, created_at, updated_at, last_login_at, is_active
            `;

            const result: QueryResult<User> = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                console.log('No user found to update:', id);
                return null;
            }

            const { password_hash: _, ...userWithoutPassword } = result.rows[0];
            console.log('User updated successfully:', { id: userWithoutPassword.id, email: userWithoutPassword.email });
            
            return userWithoutPassword;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Delete user
    async delete(id: string): Promise<boolean> {
        try {
            console.log('Deleting user:', id);
            
            const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
            const result: QueryResult<User> = await pool.query(query, [id]);
            
            const success = result.rowCount > 0;
            console.log(success ? 'User deleted successfully:' : 'No user found to delete:', id);
            
            return success;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Verify password
    async verifyPassword(user: User, password: string): Promise<boolean> {
        try {
            console.log('Verifying password for user:', { id: user.id, email: user.email });
            const isValid = await bcryptjs.compare(password, user.password_hash);
            console.log('Password verification result:', { id: user.id, isValid });
            return isValid;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    },

    // Update last login timestamp
    async updateLastLogin(userId: string): Promise<void> {
        try {
            console.log('Updating last login timestamp for user:', userId);
            
            const query = `
                UPDATE users
                SET 
                    last_login_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `;
            
            await pool.query(query, [userId]);
            console.log('Last login timestamp updated successfully for user:', userId);
        } catch (error) {
            console.error('Error updating last login timestamp:', error);
            throw error;
        }
    },

    // Change password
    async changePassword(userId: string, newPassword: string): Promise<boolean> {
        try {
            console.log('Changing password for user:', userId);
            
            const salt = await bcryptjs.genSalt(10);
            const password_hash = await bcryptjs.hash(newPassword, salt);

            const query = `
                UPDATE users
                SET 
                    password_hash = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id
            `;

            const result = await pool.query(query, [userId, password_hash]);
            const success = result.rowCount > 0;
            
            console.log(success ? 'Password changed successfully for user:' : 'Failed to change password for user:', userId);
            return success;
        } catch (error) {
            console.error('Error changing password:', error);
            return false;
        }
    },

    // Log user action
    async logUserAction(userId: string | undefined, action: string, metadata: any = {}): Promise<void> {
        if (!userId) {
            console.warn('Attempted to log action for undefined user ID');
            return;
        }

        try {
            console.log('Logging user action:', { userId, action, metadata });
            
            const query = `
                INSERT INTO user_activity_logs (
                    user_id,
                    action,
                    metadata,
                    created_at
                ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            `;
            
            await pool.query(query, [userId, action, JSON.stringify(metadata)]);
            console.log('User action logged successfully:', { userId, action });
        } catch (error) {
            console.error('Error logging user action:', error);
            // Don't throw error for logging failures
        }
    }
};

export default UserModel;