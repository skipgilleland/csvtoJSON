import { Request, Response } from 'express';
import { UserModel, CreateUserDTO, UpdateUserDTO } from '../models/User';

export const userController = {
    async create(req: Request, res: Response) {
        try {
            const { company_id, email, password, first_name, last_name, role } = req.body;

            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    error: 'User with this email already exists'
                });
            }

            const userData: CreateUserDTO = {
                company_id,
                email,
                password,
                first_name,
                last_name,
                role
            };

            const user = await UserModel.create(userData);
            res.status(201).json(user);
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                error: 'Failed to create user'
            });
        }
    },

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const company_id = req.query.company_id as string;
            const search = req.query.search as string;

            const { users, total } = await UserModel.findAll(
                page,
                limit,
                company_id,
                search
            );

            res.json({
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                error: 'Failed to retrieve users'
            });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const user = await UserModel.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json(user);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                error: 'Failed to retrieve user'
            });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { email, password, first_name, last_name, role, is_active } = req.body;
            const { id } = req.params;

            const existingUser = await UserModel.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            if (email && email !== existingUser.email) {
                const emailExists = await UserModel.findByEmail(email);
                if (emailExists) {
                    return res.status(400).json({
                        error: 'Email already in use'
                    });
                }
            }

            const updateData: UpdateUserDTO = {
                email,
                password,
                first_name,
                last_name,
                role,
                is_active
            };

            const updatedUser = await UserModel.update(id, updateData);
            if (!updatedUser) {
                return res.status(400).json({
                    error: 'No valid fields to update'
                });
            }

            res.json(updatedUser);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                error: 'Failed to update user'
            });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            const deleted = await UserModel.delete(id);
            if (!deleted) {
                return res.status(400).json({
                    error: 'Failed to delete user'
                });
            }

            res.json({
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                error: 'Failed to delete user'
            });
        }
    }
};