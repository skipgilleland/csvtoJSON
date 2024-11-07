
// backend/src/api/auth/routes.ts

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/database';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { 
    LoginRequest, 
    RegisterUserRequest, 
    ResetPasswordRequest, 
    ChangePasswordRequest 
} from '../types/auth';

// ... rest of the code remains the same ...

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password }: LoginRequest = req.body;

        const result = await pool.query(
            `SELECT u.*, c.name as company_name 
             FROM users u 
             LEFT JOIN companies c ON u.company_id = c.id 
             WHERE u.email = $1 AND u.is_active = true`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.*, c.name as company_name 
             FROM users u 
             LEFT JOIN companies c ON u.company_id = c.id 
             WHERE u.id = $1`,
            [req.user?.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            companyId: user.company_id,
            companyName: user.company_name
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new user (requires auth and proper role)
router.post('/register', authenticateToken, authorizeRoles('SUPER_ADMIN', 'COMPANY_ADMIN'), async (req, res) => {
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            role, 
            companyId 
        }: RegisterUserRequest = req.body;

        // For COMPANY_ADMIN, verify they're creating user for their own company
        if (req.user?.role === 'COMPANY_ADMIN' && req.user.companyId !== companyId) {
            return res.status(403).json({ error: 'Can only create users for your own company' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                role, 
                company_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, first_name, last_name, role, company_id`,
            [email, passwordHash, firstName, lastName, role, companyId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;