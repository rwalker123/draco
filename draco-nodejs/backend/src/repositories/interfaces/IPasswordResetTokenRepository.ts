import {
  dbPasswordResetToken,
  dbPasswordResetTokenCreateInput,
} from '../types/dbTypes.js';

export interface IPasswordResetTokenRepository {
  invalidateTokensForUser(userId: string): Promise<number>;
  createToken(data: dbPasswordResetTokenCreateInput): Promise<dbPasswordResetToken>;
  findValidToken(token: string, referenceDate: Date): Promise<dbPasswordResetToken | null>;
  markTokenAsUsed(id: string): Promise<dbPasswordResetToken>;
  deleteExpiredTokens(referenceDate: Date): Promise<number>;
}
