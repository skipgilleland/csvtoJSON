import { Request, Response } from 'express';
import { CompanyModel } from '../models/Company';

export const companyController = {
  // Create a new company
  async create(req: Request, res: Response) {
    try {
      const { name, email } = req.body;

      // Check if company exists
      const existingCompany = await CompanyModel.findByEmail(email);
      if (existingCompany) {
        return res.status(400).json({
          error: 'Company with this email already exists'
        });
      }

      const company = await CompanyModel.create({ name, email });
      res.status(201).json(company);
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({
        error: 'Failed to create company'
      });
    }
  },

  // Get all companies with pagination and filtering
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const { companies, total } = await CompanyModel.findAll(
        page,
        limit,
        search,
        status
      );

      res.json({
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json({
        error: 'Failed to retrieve companies'
      });
    }
  },

  // Get a single company by ID
  async getById(req: Request, res: Response) {
    try {
      const company = await CompanyModel.findById(req.params.id);
      
      if (!company) {
        return res.status(404).json({
          error: 'Company not found'
        });
      }

      res.json(company);
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({
        error: 'Failed to retrieve company'
      });
    }
  },

  // Update a company
  async update(req: Request, res: Response) {
    try {
      const { name, email, status } = req.body;
      const { id } = req.params;

      // Check if company exists
      const existingCompany = await CompanyModel.findById(id);
      if (!existingCompany) {
        return res.status(404).json({
          error: 'Company not found'
        });
      }

      // If email is being updated, check for duplicates
      if (email && email !== existingCompany.email) {
        const emailExists = await CompanyModel.findByEmail(email);
        if (emailExists) {
          return res.status(400).json({
            error: 'Company with this email already exists'
          });
        }
      }

      const updatedCompany = await CompanyModel.update(id, {
        name,
        email,
        status: status as 'active' | 'inactive'
      });

      if (!updatedCompany) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      res.json(updatedCompany);
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({
        error: 'Failed to update company'
      });
    }
  },

  // Delete a company
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if company exists and has no users
      const company = await CompanyModel.findById(id);
      if (!company) {
        return res.status(404).json({
          error: 'Company not found'
        });
      }

      if (company.user_count > 0) {
        return res.status(400).json({
          error: 'Cannot delete company with active users'
        });
      }

      await CompanyModel.delete(id);
      res.json({
        message: 'Company deleted successfully'
      });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({
        error: 'Failed to delete company'
      });
    }
  },

  // Update company user count
  async updateUserCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { change } = req.body;

      const company = await CompanyModel.updateUserCount(id, change);
      
      if (!company) {
        return res.status(400).json({
          error: 'Failed to update user count. Company not found or invalid count.'
        });
      }

      res.json(company);
    } catch (error) {
      console.error('Update user count error:', error);
      res.status(500).json({
        error: 'Failed to update user count'
      });
    }
  }
};