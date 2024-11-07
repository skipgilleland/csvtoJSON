import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

interface JwtPayload {
    id: string;
    email: string;
    role: string;
    companyId?: string;
}

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

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-fallback-secret-key'
        ) as JwtPayload;

        // Verify user still exists and is active
        const result = await pool.query(
            'SELECT id, email, role, company_id, is_active FROM users WHERE id = $1',
            [payload.id]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.currentUser = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            companyId: payload.companyId
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const authorizeRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.currentUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.currentUser.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        next();
    };
};