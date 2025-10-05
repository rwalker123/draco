import { Router, Request, Response } from 'express';
import {
  ChangePasswordRequestSchema,
  SignInUserNameSchema,
  VerifyTokenRequestSchema,
} from '@draco/shared-schemas';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();
const userService = ServiceFactory.getUserService();

const PASSWORD_RESET_ACKNOWLEDGEMENT =
  'If an account with that email exists, a password reset link has been sent.';

function parseTestModeFlag(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
}

/**
 * Request password reset
 * POST /api/password-reset/request
 */
router.post(
  '/request',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    const parsedEmail = SignInUserNameSchema.parse(email);
    const testMode = parseTestModeFlag(req.body?.testMode);

    const result = await userService.requestPasswordReset({
      email: parsedEmail,
      testMode,
    });

    if (result.kind === 'user-not-found') {
      res.status(200).json({
        success: true,
        message: PASSWORD_RESET_ACKNOWLEDGEMENT,
      });
      return;
    }

    if (result.kind === 'test-token') {
      res.status(200).json(result.user);
      return;
    }

    res.status(200).json(true);
  }),
);

/**
 * Verify password reset token
 * POST /api/password-reset/verify
 */
router.post(
  '/verify',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = VerifyTokenRequestSchema.parse(req.body);

    const verification = await userService.verifyPasswordResetToken(token);

    res.status(200).json(verification);
  }),
);

/**
 * Reset password using token
 * POST /api/password-reset/reset
 */
router.post(
  '/reset',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = VerifyTokenRequestSchema.pick({ token: true }).parse({
      token: req.body?.token,
    });
    const { newPassword } = ChangePasswordRequestSchema.pick({ newPassword: true }).parse({
      newPassword: req.body?.newPassword,
    });

    const resetResult = await userService.resetPasswordWithToken(token, newPassword);

    res.status(200).json(resetResult);
  }),
);

/**
 * Cleanup expired tokens (maintenance endpoint)
 * DELETE /api/password-reset/cleanup
 */
router.delete(
  '/cleanup',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const deletedCount = await userService.cleanupExpiredPasswordResetTokens();

    res.status(200).json(deletedCount);
  }),
);

export default router;
