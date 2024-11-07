// src/controllers/companyController.ts

import { Request, Response } from 'express';
import { prisma } from '../utils/db';

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    const formattedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      email: company.email,
      status: company.status,
      createdAt: company.createdAt,
      usersCount: company._count.users
    }));

    res.json(formattedCompanies);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching companies' });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      id: company.id,
      name: company.name,
      email: company.email,
      status: company.status,
      createdAt: company.createdAt,
      usersCount: company._count.users
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching company' });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        email,
        status: 'active'
      }
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: 'Error creating company' });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        email,
        status
      }
    });

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Error updating company' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.company.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting company' });
  }
};

export const getCompanyUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const users = await prisma.user.findMany({
      where: { companyId: id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedUsers = users.map(user => ({
      ...user,
      companyName: user.company.name
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching company users' });
  }
};