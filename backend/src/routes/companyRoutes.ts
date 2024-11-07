// companyRoutes.ts
import express from 'express';
import { companyController } from '../controllers/companyController';
import { validateRequest } from '../middleware/validateRequest';
import authenticateToken from '../middleware/authenticateToken';
import authorizeRole from '../middleware/authorizeRole';

const router = express.Router();

// Company validation schemas
const createCompanySchema = {
  name: {
    in: ['body'],
    trim: true,
    notEmpty: {
      errorMessage: 'Company name is required'
    }
  },
  email: {
    in: ['body'],
    trim: true,
    isEmail: {
      errorMessage: 'Valid email is required'
    },
    normalizeEmail: true
  }
};

const updateCompanySchema = {
  name: {
    in: ['body'],
    trim: true,
    optional: true
  },
  email: {
    in: ['body'],
    trim: true,
    isEmail: {
      errorMessage: 'Valid email is required'
    },
    normalizeEmail: true,
    optional: true
  },
  status: {
    in: ['body'],
    isIn: {
      options: [['active', 'inactive']],
      errorMessage: 'Status must be either active or inactive'
    },
    optional: true
  }
};

// Routes
router.use((req, res, next) => {
  if (typeof authenticateToken === 'function') {
    return authenticateToken(req, res, next);
  }
  next(new Error('Invalid authentication middleware'));
});

// Create company (Super Admin only)
router.post('/',
  authorizeRole(['SUPER_ADMIN']),
  validateRequest(createCompanySchema),
  companyController.create
);

// Get all companies (Super Admin only)
router.get('/',
  authorizeRole(['SUPER_ADMIN']),
  companyController.getAll
);

// Get company by ID (Super Admin and Company Admin)
router.get('/:id',
  authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  companyController.getById
);

// Update company (Super Admin only)
router.put('/:id',
  authorizeRole(['SUPER_ADMIN']),
  validateRequest(updateCompanySchema),
  companyController.update
);

// Delete company (Super Admin only)
router.delete('/:id',
  authorizeRole(['SUPER_ADMIN']),
  companyController.delete
);

// Update company user count (Super Admin and Company Admin)
router.patch('/:id/user-count',
  authorizeRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
  validateRequest({
    change: {
      in: ['body'],
      isInt: {
        errorMessage: 'Change must be an integer'
      }
    }
  }),
  companyController.updateUserCount
);

export default router;
