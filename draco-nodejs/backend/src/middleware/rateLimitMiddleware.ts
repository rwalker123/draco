import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  keyGenerator?: (req: Request) => string;
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
    keyGenerator,
  } = options;

  // Configure validation based on environment
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const validate = isDevelopment
    ? {
        // In development, disable problematic validations from Next.js proxy
        xForwardedForHeader: false,
        trustProxy: false,
        default: true,
      }
    : {
        // In production, enable all validations for security
        default: true,
      };

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
    keyGenerator,
    validate,
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
 * 20 attempts per 15 minutes per IP
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: 'Too many authentication attempts, please try again in 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

/**
 * Signup rate limiting for new user registration
 * 3 attempts per hour per IP
 */
export const signupRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many signup attempts. Please try again later.',
  skipSuccessfulRequests: false,
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

/**
 * Teams Wanted rate limiting for anonymous submissions
 * 3 posts per hour per IP address
 */
export const teamsWantedRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 posts per hour
  message: 'Rate limit exceeded: Maximum 20 teams wanted posts per hour per IP',
  skipSuccessfulRequests: false,
});

/**
 * Hall of Fame nomination rate limiting for public submissions
 * 5 nominations per hour per IP address
 */
export const hofNominationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many Hall of Fame nominations from this IP. Please try again later.',
  skipSuccessfulRequests: false,
});

/**
 * Account creation rate limiting for organization provisioning
 * 3 creations per hour per authenticated user (or IP if unauthenticated)
 */
export const accountCreationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many account creation attempts. Please try again later.',
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim();
      if (first) {
        return `ip:${ipKeyGenerator(first)}`;
      }
    }

    const ipKey = ipKeyGenerator(req.ip ?? '');
    return `ip:${ipKey}`;
  },
});

/**
 * Cleanup service rate limiting for manual cleanup operations
 * 10 requests per day per authenticated user
 */
export const cleanupRateLimit = createRateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 requests per day
  message: 'Rate limit exceeded: Maximum 10 cleanup operations per day per user',
  skipSuccessfulRequests: false, // Count all requests
});

/**
 * Health monitoring rate limiting
 * 30 requests per minute per IP
 */
export const monitoringHealthRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Rate limit exceeded: Too many health check requests, please slow down.',
  skipSuccessfulRequests: false,
});
