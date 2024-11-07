// src/controllers/authController.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

export const authController = {
  // Login user
  login: asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now(); // For performance logging
    console.log('Received login request:', {
      email: req.body.email,
      timestamp: new Date().toISOString()
    });

    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      console.error('Login attempt failed: Missing email or password');
      throw new AppError(400, 'Email and password are required');
    }

    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        console.error('Login failed: No user found for email:', email);
        throw new AppError(401, 'Invalid credentials');
      }

      // Verify password
      console.log('Verifying password for user:', email);
      const isValidPassword = await UserModel.verifyPassword(user, password);
      
      if (!isValidPassword) {
        console.error('Login failed: Invalid password for email:', email);
        throw new AppError(401, 'Invalid credentials');
      }

      // Generate JWT token
      console.log('Generating JWT token for user:', email);
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          companyId: user.company_id
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      // Update last login timestamp
      await UserModel.updateLastLogin(user.id);

      // Remove sensitive data from response
      const { password_hash, ...userWithoutPassword } = user;

      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`Login successful for ${email}. Duration: ${duration}ms`);

      // Send response
      res.json({
        user: userWithoutPassword,
        token,
        expiresIn: config.jwtExpiresIn
      });

    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'An unexpected error occurred during login');
    }
  }),

  // Refresh token
  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    console.log('Received refresh token request for user:', req.user?.userId);

    try {
      const user = await UserModel.findById(req.user!.userId);
      
      if (!user) {
        console.error('Token refresh failed: User not found');
        throw new AppError(404, 'User not found');
      }

      // Generate new token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          companyId: user.company_id
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      console.log('Token refreshed successfully for user:', user.email);
      res.json({
        token,
        expiresIn: config.jwtExpiresIn
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Error refreshing token');
    }
  }),

  // Get current user profile
  profile: asyncHandler(async (req: Request, res: Response) => {
    console.log('Fetching profile for user:', req.user?.userId);

    try {
      const user = await UserModel.findById(req.user!.userId);
      
      if (!user) {
        console.error('Profile fetch failed: User not found');
        throw new AppError(404, 'User not found');
      }

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;

      console.log('Profile fetched successfully for user:', user.email);
      res.json(userWithoutPassword);

    } catch (error) {
      console.error('Profile fetch error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Error fetching user profile');
    }
  }),

  // Logout
  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    console.log('Logout request received for user:', userId);

    try {
      // Even though we're using JWTs and don't need server-side logout,
      // we can use this endpoint to clean up any session-related data
      // or log the logout event
      await UserModel.logUserAction(userId, 'logout');

      console.log('User logged out successfully:', userId);
      res.json({
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      throw new AppError(500, 'Error processing logout');
    }
  })
};

export default authController;