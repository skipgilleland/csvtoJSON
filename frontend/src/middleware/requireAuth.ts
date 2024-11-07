// src/middleware/requireAuth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as UserPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.currentUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// src/middleware/requireRole.ts

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.currentUser || req.currentUser.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
};

export const requireCompanyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.currentUser || 
      (req.currentUser.role !== 'COMPANY_ADMIN' && 
       req.currentUser.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
};

// src/middleware/validateRequest.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
};