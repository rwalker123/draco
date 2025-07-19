import prisma from '../lib/prisma';

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export class PasswordResetModel {
  /**
   * Create a new password reset token
   */
  static async createToken(
    userId: string,
    token: string,
    expiresInHours: number = 24,
  ): Promise<PasswordResetToken> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Invalidate any existing tokens for this user
    await prisma.passwordresettokens.updateMany({
      where: { userid: userId, used: false },
      data: { used: true },
    });

    // Create new token
    const resetToken = await prisma.passwordresettokens.create({
      data: {
        userid: userId,
        token: token,
        expiresat: expiresAt,
        used: false,
      },
    });

    return {
      id: resetToken.id,
      userId: resetToken.userid,
      token: resetToken.token,
      expiresAt: resetToken.expiresat,
      used: resetToken.used,
      createdAt: resetToken.createdat,
    };
  }

  /**
   * Find a valid reset token
   */
  static async findValidToken(token: string): Promise<PasswordResetToken | null> {
    const resetToken = await prisma.passwordresettokens.findFirst({
      where: {
        token: token,
        used: false,
        expiresat: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return null;
    }

    return {
      id: resetToken.id,
      userId: resetToken.userid,
      token: resetToken.token,
      expiresAt: resetToken.expiresat,
      used: resetToken.used,
      createdAt: resetToken.createdat,
    };
  }

  /**
   * Mark a token as used
   */
  static async markTokenAsUsed(tokenId: string): Promise<void> {
    await prisma.passwordresettokens.update({
      where: { id: tokenId },
      data: { used: true },
    });
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.passwordresettokens.deleteMany({
      where: {
        expiresat: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
