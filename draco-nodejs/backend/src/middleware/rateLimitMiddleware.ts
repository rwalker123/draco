import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Creates a rate limit middleware with custom configuration
 */
export const createRateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    skipSuccessfulRequests,
    standardHeaders,
    legacyHeaders,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
    // Use default key generator which properly handles IPv6
  });
};

/**
 * Strict rate limiting for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again in 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

/**
 * More lenient rate limiting for password-related endpoints
 * 3 attempts per 15 minutes per IP
 */
export const passwordRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: 'Too many password change attempts, please try again in 15 minutes.',
  skipSuccessfulRequests: true,
});

/**
 * General API rate limiting
 * 100 requests per 15 minutes per IP
 */
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
});
