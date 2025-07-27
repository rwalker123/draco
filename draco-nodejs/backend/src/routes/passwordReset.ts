import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PasswordResetModel } from '../models/PasswordReset';
import { EmailService, EmailConfig } from '../services/emailService';
import prisma from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, InternalServerError } from '../utils/customErrors';

const router = Router();
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
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save token to database
    await PasswordResetModel.createToken(user.id, resetToken, 24); // 24 hours expiry

    if (testMode) {
      // Test mode: return the token directly instead of sending email
      res.status(200).json({
        success: true,
        message: 'Password reset token generated (test mode)',
        testData: {
          token: resetToken,
          userId: user.id,
          email: user.username,
        },
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

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
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

    res.status(200).json({
      success: true,
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid or expired',
    });
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

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  }),
);

/**
 * Cleanup expired tokens (maintenance endpoint)
 * DELETE /api/password-reset/cleanup
 */
router.delete(
  '/cleanup',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const deletedCount = await PasswordResetModel.cleanupExpiredTokens();

    res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount} expired tokens`,
      deletedCount,
    });
  }),
);

export default router;
