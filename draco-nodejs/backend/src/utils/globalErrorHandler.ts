import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { ApiError, AuthorizationError, NotFoundError } from './customErrors.js';
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

function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError;
}

function logError(err: Error, req: Request): void {
  if (err.name === 'NoDomainAccount') {
    return;
  }

  if (
    err instanceof AuthorizationError &&
    req.method === 'GET' &&
    req.path?.toLowerCase().endsWith('/contacts/me')
  ) {
    return;
  }

  // Users without membership routinely hit the account team list; avoid noisy logs.
  if (
    err instanceof AuthorizationError &&
    req.method === 'GET' &&
    /\/api\/accounts\/[^/]+\/user-teams$/i.test(req.path ?? '')
  ) {
    return;
  }

  const shouldSuppressLog =
    err instanceof NotFoundError &&
    req.method === 'GET' &&
    ((/\/api\/accounts\/[^/]+\/surveys\/answers\/[^/]+$/i.test(req.path ?? '') &&
      /survey not available/i.test(err.message)) ||
      /\/api\/accounts\/[^/]+\/user-teams$/i.test(req.path ?? '') ||
      /\/api\/accounts\/[^/]+\/contacts\/me$/i.test(req.path ?? ''));

  if (shouldSuppressLog) {
    return;
  }

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
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logError(err, req);

  // Handle custom application errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toErrorResponse());
    return;
  }

  // Handle Zod validation errors
  if (isZodError(err)) {
    const message = err.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    res.status(400).json({
      message: `Validation failed: ${message}`,
      statusCode: 400,
      isRetryable: false,
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
      message,
      statusCode: 401,
      isRetryable: false,
    });
    return;
  }

  // Handle Prisma errors
  if (isPrismaError(err)) {
    switch (err.code) {
      case 'P2025':
        res.status(404).json({
          message: 'Resource not found',
          statusCode: 404,
          isRetryable: false,
        });
        return;
      case 'P2002':
        res.status(409).json({
          message: 'Resource already exists',
          statusCode: 409,
          isRetryable: false,
        });
        return;
      case 'P2014':
        res.status(400).json({
          message: 'Invalid data provided',
          statusCode: 400,
          isRetryable: false,
        });
        return;
      case 'P2003':
        res.status(400).json({
          message: 'Invalid reference to related resource',
          statusCode: 400,
          isRetryable: false,
        });
        return;
      default:
        res.status(500).json({
          message: 'Database error occurred',
          statusCode: 500,
          isRetryable: true,
        });
        return;
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      message: err.message || 'Validation failed',
      statusCode: 400,
      isRetryable: false,
    });
    return;
  }

  // Handle generic errors - always return a safe generic message
  res.status(500).json({
    message: err.message || 'Internal server error',
    statusCode: 500,
    isRetryable: true,
  });
}
