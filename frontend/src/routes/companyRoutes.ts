// src/routes/companyRoutes.ts

import express from 'express';
import { body } from 'express-validator';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUsers
} from '../controllers/companyController';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/requireAuth';
import { requireSuperAdmin, requireCompanyAdmin } from '../middleware/requireRole';

const router = express.Router();

// Validation middleware
const companyValidation = [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
];

// Get all companies (Super Admin only)
router.get('/', requireAuth, requireSuperAdmin, getCompanies);

// Get specific company
router.get('/:id', requireAuth, requireCompanyAdmin, getCompanyById);

// Create new company (Super Admin only)
router.post('/', 
  requireAuth, 
  requireSuperAdmin, 
  companyValidation,
  validateRequest,
  createCompany
);

// Update company (Super Admin only)
router.put('/:id', 
  requireAuth, 
  requireSuperAdmin, 
  companyValidation,
  validateRequest,
  updateCompany
);

// Delete company (Super Admin only)
router.delete('/:id', requireAuth, requireSuperAdmin, deleteCompany);

// Get company users
router.get('/:id/users', requireAuth, requireCompanyAdmin, getCompanyUsers);

export default router;