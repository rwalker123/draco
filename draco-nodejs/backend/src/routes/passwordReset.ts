import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PasswordResetModel } from '../models/PasswordReset';
import { EmailService, EmailConfig } from '../services/emailService';
import prisma from '../lib/prisma';

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
router.post('/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, testMode = false } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
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
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
    });
  }
});

/**
 * Verify reset token
 * GET /api/password-reset/verify/:token
 */
router.get('/verify/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
      return;
    }

    // Find valid token
    const resetToken = await PasswordResetModel.findValidToken(token);

    if (!resetToken) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Get user info
    const user = await prisma.aspnetusers.findUnique({
      where: { id: resetToken.userId },
      select: { id: true, username: true },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        token: token,
        email: user.username,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the token.',
    });
  }
});

/**
 * Reset password with token
 * POST /api/password-reset/reset
 */
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Find valid token
    const resetToken = await PasswordResetModel.findValidToken(token);

    if (!resetToken) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.aspnetusers.update({
      where: { id: resetToken.userId },
      data: { passwordhash: hashedPassword },
    });

    // Mark token as used
    await PasswordResetModel.markTokenAsUsed(resetToken.id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting the password.',
    });
  }
});

/**
 * Clean up expired tokens (admin endpoint)
 * POST /api/password-reset/cleanup
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const deletedCount = await PasswordResetModel.cleanupExpiredTokens();

    res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount} expired tokens`,
    });
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while cleaning up tokens.',
    });
  }
});

export default router;
