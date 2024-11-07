// src/routes/userRoutes.ts

import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/requireAuth';
import { requireSuperAdmin, requireCompanyAdmin } from '../middleware/requireRole';

const router = express.Router();

// Validation middleware
const userValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER'])
    .withMessage('Invalid role'),
  body('companyId').optional().isString().withMessage('Invalid company ID'),
  body('password').optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Get all users (Super Admin) or company users (Company Admin)
router.get('/', requireAuth, getUsers);

// Get specific user
router.get('/:id', requireAuth, getUserById);

// Create new user
router.post('/', 
  requireAuth,
  requireSuperAdmin,
  userValidation,
  validateRequest,
  createUser
);

// Update user
router.put('/:id',
  requireAuth,
  requireSuperAdmin,
  userValidation,
  validateRequest,
  updateUser
);

// Delete user
router.delete('/:id', requireAuth, requireSuperAdmin, deleteUser);

export default router;