import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// Type definitions for Prisma query results
interface UserRole {
  userid: string;
  aspnetroles: {
    name: string;
  } | null;
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

// Extend Express Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      username: string;
    };
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Verify user still exists in database
    const user = await prisma.aspnetusers.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is locked out
    if (user.lockoutenabled && user.lockoutenddateutc && user.lockoutenddateutc > new Date()) {
      res.status(401).json({
        success: false,
        message: 'Account is temporarily locked',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username || '',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next(); // Continue without user if JWT_SECRET not configured
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.aspnetusers.findUnique({
      where: { id: decoded.userId },
    });

    if (
      user &&
      (!user.lockoutenabled || !user.lockoutenddateutc || user.lockoutenddateutc <= new Date())
    ) {
      req.user = {
        id: user.id,
        username: user.username || '',
      };
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userRoles = await prisma.aspnetuserroles.findMany({
        where: { userid: req.user.id },
        include: { aspnetroles: true },
      });

      const hasRole = userRoles.some(
        (userRole: UserRole) => userRole.aspnetroles?.name === roleName,
      );

      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Role '${roleName}' required`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};
