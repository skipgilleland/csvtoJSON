// src/routes/authRoutes.ts

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

// Define types
declare global {
    namespace Express {
        interface Request {
            currentUser?: {
                id: string;
                email: string;
                role: string;
                companyId?: string;
            };
        }
    }
}

const router = Router();

// Validation schemas
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .trim(),
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .trim(),
    body('role')
        .isIn(['COMPANY_ADMIN', 'COMPANY_USER'])
        .withMessage('Invalid role')
];

const passwordResetValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail()
];

// Login route
router.post('/login', loginValidation, async (req: Request, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Find user
        const userQuery = `
            SELECT u.*, c.name as company_name 
            FROM users u 
            LEFT JOIN companies c ON u.company_id = c.id 
            WHERE LOWER(u.email) = LOWER($1) AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [email]);
        const user = result.rows[0];

        if (!user) {
            console.log('User not found or inactive:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Log password hash from database
        console.log('Password hash from database:', user.password_hash);

        // Verify password
        const isValidPassword = await bcryptjs.compare(password, user.password_hash);
        console.log('Password provided:', password);
        console.log('Password validation result:', isValidPassword);

        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                role: user.role,
                companyId: user.company_id
            },
            process.env.JWT_SECRET || 'your-fallback-secret-key',
            { expiresIn: '24h' }
        );

        // Update last login timestamp
        await pool.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Log successful login
        await pool.query(
            `INSERT INTO activity_logs (user_id, action_type, details)
             VALUES ($1, 'LOGIN', $2)`,
            [user.id, JSON.stringify({ success: true })]
        );

        // Send response
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
        res.status(500).json({ 
            error: 'Error during login',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

// The rest of the code remains unchanged
// Get current user profile, Register new user, Logout, Password reset

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userQuery = `
            SELECT u.*, c.name as company_name 
            FROM users u 
            LEFT JOIN companies c ON u.company_id = c.id 
            WHERE u.id = $1 AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [req.currentUser!.id]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

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
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});

// Register new user
router.post(
    '/register',
    authenticateToken,
    authorizeRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    registerValidation,
    validateRequest,
    async (req: Request, res: Response) => {
        try {
            const { email, password, firstName, lastName, role, companyId } = req.body;

            // Check if email exists
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Hash password
            const hashedPassword = await bcryptjs.hash(password, 10);

            // Create user
            const userQuery = `
                INSERT INTO users (
                    email, password_hash, first_name, last_name, 
                    role, company_id, is_active, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)
                RETURNING id, email, first_name, last_name, role, company_id
            `;

            const finalCompanyId = companyId || req.currentUser?.companyId;
            const userResult = await pool.query(userQuery, [
                email.toLowerCase(),
                hashedPassword,
                firstName,
                lastName,
                role,
                finalCompanyId
            ]);

            const user = userResult.rows[0];

            // Get company name
            const companyResult = await pool.query(
                'SELECT name FROM companies WHERE id = $1',
                [user.company_id]
            );

            res.status(201).json({
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                companyId: user.company_id,
                companyName: companyResult.rows[0]?.name
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Error during registration' });
        }
    }
);

// Logout route
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Log logout activity
        await pool.query(
            `INSERT INTO activity_logs (user_id, action_type, details)
             VALUES ($1, 'LOGOUT', $2)`,
            [req.currentUser!.id, JSON.stringify({ success: true })]
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Error during logout' });
    }
});

// Password reset request
router.post('/reset-password', passwordResetValidation, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const userQuery = 'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true';
        const result = await pool.query(userQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // In a real application, you would:
        // 1. Generate a reset token
        // 2. Save it to the database with an expiration
        // 3. Send an email to the user with the reset link
        // For this example, we'll just acknowledge the request

        res.json({ message: 'Password reset instructions sent to email' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Error processing password reset request' });
    }
});

export default router;
