import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './customErrors.js';
import { DateUtils } from './dateUtils.js';

export function hasCodeProperty(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return hasCodeProperty(err) && err.code.startsWith('P');
}

function isJWTError(err: unknown): err is jwt.JsonWebTokenError {
  return err instanceof jwt.JsonWebTokenError;
}

function logError(err: Error, req: Request): void {
  const logData = {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: DateUtils.formatDateTimeForResponse(new Date()),
  };

  console.error('Error occurred:', logData);
}

export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logError(err, req);

  // Handle custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle JWT errors
  if (isJWTError(err)) {
    let message = 'Authentication failed';

    if (err instanceof jwt.TokenExpiredError) {
      message = 'Token expired';
    } else if (err instanceof jwt.JsonWebTokenError) {
      message = 'Invalid token';
    }

    res.status(401).json({
      success: false,
      message,
    });
    return;
  }

  // Handle Prisma errors
  if (isPrismaError(err)) {
    switch (err.code) {
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
        return;
      case 'P2002':
        res.status(409).json({
          success: false,
          message: 'Resource already exists',
        });
        return;
      case 'P2014':
        res.status(400).json({
          success: false,
          message: 'Invalid data provided',
        });
        return;
      case 'P2003':
        res.status(400).json({
          success: false,
          message: 'Invalid reference to related resource',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          message: 'Database error occurred',
        });
        return;
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: err.message || 'Validation failed',
    });
    return;
  }

  // Handle generic errors - always return a safe generic message
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
