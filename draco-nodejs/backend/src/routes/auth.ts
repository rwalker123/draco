import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  authRateLimit,
  passwordRateLimit,
  signupRateLimit,
} from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, AuthenticationError } from '../utils/customErrors.js';
import { SignInCredentialsSchema } from '@draco/shared-schemas';
import { z } from 'zod';
import { getStringParam } from '../utils/paramExtraction.js';

const LoginCredentialsSchema = SignInCredentialsSchema.extend({
  password: z.string().trim().min(1),
});

const router = Router();
const authService = ServiceFactory.getAuthService();
const roleService = ServiceFactory.getRoleVerification();
const turnstileService = ServiceFactory.getTurnstileService();

/**
 * POST /api/auth/login
 * Login a user
 */
router.post(
  '/login',
  authRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const loginCredentials = LoginCredentialsSchema.parse(req.body);
    const result = await authService.login(loginCredentials);
    res.json(result);
  }),
);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  signupRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    await turnstileService.assertValid(req.get(turnstileService.getHeaderName()), req.ip);

    const registerCredentials = SignInCredentialsSchema.parse(req.body);
    const result = await authService.register(registerCredentials);

    res.json(result);
  }),
);

/**
 * POST /api/auth/logout
 * Logout a user
 */
router.post('/logout', (req: Request, res: Response, _next: NextFunction) => {
  // JWT tokens are stateless, so logout is handled client-side
  // This endpoint can be used for logging purposes
  res.status(200);
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const { accountId } = req.query;
    const result = await authService.getUserById(
      req.user.id,
      accountId ? (accountId as string) : undefined,
    );
    res.status(200).json(result);
  }),
);

/**
 * POST /api/auth/verify
 * Verify token
 */
router.post(
  '/verify',
  authRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    const result = await authService.verifyToken(token);
    res.json(result);
  }),
);

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post(
  '/change-password',
  passwordRateLimit,
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    // Validate password strength
    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  }),
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const result = await authService.refreshToken(req.user.id);
    res.json(result);
  }),
);

/**
 * GET /api/auth/check-role/:roleId
 * Check if current user has a specific role
 */
router.get(
  '/check-role/:roleId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new AuthenticationError('User not authenticated');
    }

    const roleId = getStringParam(req.params.roleId)!;
    const { accountId, teamId, leagueId } = req.query;

    const context = {
      accountId: accountId ? BigInt(accountId as string) : BigInt(0),
      teamId: teamId ? BigInt(teamId as string) : undefined,
      leagueId: leagueId ? BigInt(leagueId as string) : undefined,
    };

    const roleCheck = await roleService.hasRole(req.user.id, roleId, context);

    res.status(200).json({
      hasRole: roleCheck.hasRole,
      roleLevel: roleCheck.roleLevel,
      context: roleCheck.context,
    });
  }),
);

export default router;
