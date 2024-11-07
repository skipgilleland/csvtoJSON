import express from 'express';
import { userController } from '../controllers/userController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import authorizeRole from '../middleware/authorizeRole';

const router = express.Router();

// User validation schemas
const createUserSchema = {
    company_id: {
        in: ['body'],
        isUUID: true,
        errorMessage: 'Valid company ID is required'
    },
    email: {
        in: ['body'],
        trim: true,
        isEmail: true,
        normalizeEmail: true,
        errorMessage: 'Valid email is required'
    },
    password: {
        in: ['body'],
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be at least 8 characters long'
        }
    },
    first_name: {
        in: ['body'],
        trim: true,
        notEmpty: true,
        errorMessage: 'First name is required'
    },
    last_name: {
        in: ['body'],
        trim: true,
        notEmpty: true,
        errorMessage: 'Last name is required'
    },
    role: {
        in: ['body'],
        isIn: {
            options: [['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER']],
            errorMessage: 'Invalid role'
        }
    }
};

const updateUserSchema = {
    email: {
        in: ['body'],
        trim: true,
        isEmail: true,
        normalizeEmail: true,
        optional: true
    },
    password: {
        in: ['body'],
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be at least 8 characters long'
        },
        optional: true
    },
    first_name: {
        in: ['body'],
        trim: true,
        optional: true
    },
    last_name: {
        in: ['body'],
        trim: true,
        optional: true
    },
    role: {
        in: ['body'],
        isIn: {
            options: [['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER']],
            errorMessage: 'Invalid role'
        },
        optional: true
    }
};

// Apply authentication to all routes
router.use(authenticateToken);

// Create user (Super Admin and Company Admin only)
router.post('/',
    authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    validateRequest(createUserSchema),
    userController.create
);

// Get all users (filtered by company for Company Admin)
router.get('/',
    authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    userController.getAll
);

// Get user by ID
router.get('/:id',
    authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    userController.getById
);

// Update user
router.put('/:id',
    authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    validateRequest(updateUserSchema),
    userController.update
);

// Delete user
router.delete('/:id',
    authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    userController.delete
);

export default router;
