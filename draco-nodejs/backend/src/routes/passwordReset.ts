import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PasswordResetModel } from '../models/PasswordReset.js';
import { EmailService, EmailConfig } from '../services/emailService.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, InternalServerError } from '../utils/customErrors.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();

// Email configuration - you'll need to update these with your actual email settings
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

const emailService = new EmailService(
  emailConfig,
  process.env.FROM_EMAIL || 'noreply@dracosports.com',
  process.env.BASE_URL || 'http://localhost:3000',
);

/**
 * Request password reset
 * POST /api/password-reset/request
 */
router.post(
  '/request',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, testMode = false } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    // Find user by email
    const user = await prisma.aspnetusers.findFirst({
      where: { username: email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');

    // Save token to database
    await PasswordResetModel.createToken(user.id, resetToken, 24); // 24 hours expiry

    if (testMode) {
      // Test mode: return the token directly instead of sending email
      res.status(200).json({
        token: resetToken,
        userId: user.id,
        email: user.username,
      });

      return;
    }

    // Send email
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      user.username || email,
      resetToken,
    );

    if (!emailSent) {
      throw new InternalServerError('Failed to send password reset email. Please try again later.');
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
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Reset token is required');
    }

    const tokenData = await PasswordResetModel.findValidToken(token);
    const isValid = !!tokenData;

    res.status(200).json({ valid: isValid });
  }),
);

/**
 * Reset password using token
 * POST /api/password-reset/reset
 */
router.post(
  '/reset',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError('Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Verify token and get user
    const tokenData = await PasswordResetModel.findValidToken(token);

    if (!tokenData) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.aspnetusers.update({
      where: { id: tokenData.userId },
      data: { passwordhash: hashedPassword },
    });

    // Mark token as used
    await PasswordResetModel.markTokenAsUsed(tokenData.id);

    res.status(200).json(true);
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
    const deletedCount = await PasswordResetModel.cleanupExpiredTokens();

    res.status(200).json(deletedCount);
  }),
);

export default router;
