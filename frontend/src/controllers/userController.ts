// src/controllers/userController.ts

import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = req.currentUser!;
    
    // Build the query based on user role
    const whereClause = currentUser.role === 'SUPER_ADMIN' 
      ? {} 
      : { companyId: currentUser.companyId };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedUsers = users.map(user => ({
      ...user,
      companyName: user.company?.name
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.currentUser!;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has permission to view this user
    if (currentUser.role !== 'SUPER_ADMIN' && 
        user.companyId !== currentUser.companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      ...user,
      companyName: user.company?.name
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      password, 
      role, 
      companyId 
    } = req.body;

    const currentUser = req.currentUser!;

    // Validate permissions
    if (currentUser.role !== 'SUPER_ADMIN' && 
        (role === 'SUPER_ADMIN' || companyId !== currentUser.companyId)) {
      return res.status(403).json({ error: 'Not authorized to create this type of user' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        companyId: companyId || currentUser.companyId,
        status: 'active'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      ...user,
      companyName: user.company?.name
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      email, 
      firstName, 
      lastName, 
      password, 
      role, 
      companyId,
      status 
    } = req.body;

    const currentUser = req.currentUser!;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
      where: { id } 
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate permissions
    if (currentUser.role !== 'SUPER_ADMIN' && 
        (existingUser.companyId !== currentUser.companyId || 
         role === 'SUPER_ADMIN' || 
         companyId !== currentUser.companyId)) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    // Prepare update data
    const updateData: any = {
      email,
      firstName,
      lastName,
      role,
      status,
      companyId
    };

    // Only hash and update password if it's provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      ...user,
      companyName: user.company?.name
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Error updating user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.currentUser!;

    // Check if user exists
    const user = await prisma.user.findUnique({ 
      where: { id } 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate permissions
    if (currentUser.role !== 'SUPER_ADMIN' && 
        user.companyId !== currentUser.companyId) {
      return res.status(403).json({ error: 'Not authorized to delete this user' });
    }

    // Prevent deleting yourself
    if (id === currentUser.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
};