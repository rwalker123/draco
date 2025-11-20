import { Prisma, PrismaClient } from '#prisma/client';
import { dbPasswordResetToken, dbPasswordResetTokenCreateInput } from '../types/dbTypes.js';
import { IPasswordResetTokenRepository } from '../interfaces/IPasswordResetTokenRepository.js';

const passwordResetTokenSelect = {
  id: true,
  userid: true,
  token: true,
  expiresat: true,
  used: true,
  createdat: true,
} satisfies Prisma.passwordresettokensSelect;

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async invalidateTokensForUser(userId: string): Promise<number> {
    const result = await this.prisma.passwordresettokens.updateMany({
      where: { userid: userId, used: false },
      data: { used: true },
    });

    return result.count;
  }

  async createToken(data: dbPasswordResetTokenCreateInput): Promise<dbPasswordResetToken> {
    return this.prisma.passwordresettokens.create({
      data,
      select: passwordResetTokenSelect,
    });
  }

  async findValidToken(token: string, referenceDate: Date): Promise<dbPasswordResetToken | null> {
    return this.prisma.passwordresettokens.findFirst({
      where: {
        token,
        used: false,
        expiresat: {
          gt: referenceDate,
        },
      },
      select: passwordResetTokenSelect,
    });
  }

  async markTokenAsUsed(id: string): Promise<dbPasswordResetToken> {
    return this.prisma.passwordresettokens.update({
      where: { id },
      data: { used: true },
      select: passwordResetTokenSelect,
    });
  }

  async deleteExpiredTokens(referenceDate: Date): Promise<number> {
    const result = await this.prisma.passwordresettokens.deleteMany({
      where: {
        expiresat: {
          lt: referenceDate,
        },
      },
    });

    return result.count;
  }
}
