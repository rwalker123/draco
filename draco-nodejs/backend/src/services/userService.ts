import { PasswordResetRequestType } from '@draco/shared-schemas';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import {
  IPasswordResetTokenRepository,
  IUserRepository,
  RepositoryFactory,
  dbPasswordResetTokenCreateInput,
  dbUser,
  IContactRepository,
} from '../repositories/index.js';
import {
  PasswordResetVerificationResponse,
  UserResponseFormatter,
} from '../responseFormatters/userResponseFormatter.js';
import { InternalServerError, ValidationError } from '../utils/customErrors.js';
import { EmailService } from './emailService.js';
import { AccountsService } from './accountsService.js';
import { ServiceFactory } from './serviceFactory.js';

const RESET_TOKEN_BYTES = 32;
const PASSWORD_SALT_ROUNDS = 12;

interface UserServiceDependencies {
  tokenExpiryHours?: number;
}

export type PasswordResetRequestResult = { kind: 'user-not-found' } | { kind: 'email-sent' };

export class UserService {
  private readonly userRepository: IUserRepository;
  private readonly passwordResetTokenRepository: IPasswordResetTokenRepository;
  private readonly emailService: EmailService;
  private accountService: AccountsService;
  private readonly contactRepository: IContactRepository;
  private readonly tokenExpiryHours: number;

  constructor(dependencies: UserServiceDependencies = {}) {
    this.userRepository = RepositoryFactory.getUserRepository();
    this.passwordResetTokenRepository = RepositoryFactory.getPasswordResetTokenRepository();
    this.emailService = ServiceFactory.getEmailService();
    this.accountService = ServiceFactory.getAccountsService();
    this.contactRepository = RepositoryFactory.getContactRepository();

    this.tokenExpiryHours = dependencies.tokenExpiryHours ?? 24;
  }

  async requestPasswordReset({
    email,
    accountId,
  }: PasswordResetRequestType): Promise<PasswordResetRequestResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByUsername(normalizedEmail);

    if (!user) {
      return { kind: 'user-not-found' };
    }

    const accountName = await this.resolveAccountNameForMember(user.id, accountId);

    const resetToken = this.generateResetToken();
    await this.invalidateExistingTokens(user.id);
    await this.createResetToken(user.id, resetToken);

    const emailSent = await this.emailService.sendPasswordResetEmail(
      normalizedEmail,
      user.username ?? normalizedEmail,
      resetToken,
      accountName,
    );

    if (!emailSent) {
      throw new InternalServerError('Failed to send password reset email. Please try again later.');
    }

    return { kind: 'email-sent' };
  }

  async verifyPasswordResetToken(token: string): Promise<PasswordResetVerificationResponse> {
    const tokenRecord = await this.passwordResetTokenRepository.findValidToken(token, new Date());

    return UserResponseFormatter.formatPasswordResetVerification(tokenRecord);
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const tokenRecord = await this.passwordResetTokenRepository.findValidToken(token, new Date());

    if (!tokenRecord) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await this.userRepository.updatePassword(tokenRecord.userid, hashedPassword);
    await this.passwordResetTokenRepository.markTokenAsUsed(tokenRecord.id);

    return true;
  }

  async cleanupExpiredPasswordResetTokens(): Promise<number> {
    return this.passwordResetTokenRepository.deleteExpiredTokens(new Date());
  }

  /**
   * Generate a password reset token without sending an email. Caller is responsible for delivery.
   */
  async createPasswordResetTokenForUser(userId: string): Promise<string> {
    const user = await this.userRepository.findByUserId(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const resetToken = this.generateResetToken();
    await this.invalidateExistingTokens(user.id);
    await this.createResetToken(user.id, resetToken);

    return resetToken;
  }

  async isAccountOwner(userId: string, accountId: bigint): Promise<boolean> {
    const account = await this.accountService.getAccountById(accountId); // Ensure account exists
    if (!account) {
      throw new ValidationError('Account not found');
    }

    if (!userId) {
      return false;
    }

    return account.account.accountOwner?.user?.userId === userId;
  }

  private generateResetToken(): string {
    return randomBytes(RESET_TOKEN_BYTES).toString('hex');
  }

  private parseAccountId(accountId?: string): bigint | null {
    if (!accountId) {
      return null;
    }

    try {
      return BigInt(accountId);
    } catch {
      return null;
    }
  }

  private async resolveAccountNameForMember(
    userId: string,
    accountId?: string,
  ): Promise<string | undefined> {
    const parsedAccountId = this.parseAccountId(accountId);
    if (!parsedAccountId) {
      return undefined;
    }

    const contact = await this.contactRepository.findByUserId(userId, parsedAccountId);
    if (!contact) {
      return undefined;
    }

    const account = await this.accountService.getAccountName(parsedAccountId).catch(() => null);
    return account?.name;
  }

  private async invalidateExistingTokens(userId: dbUser['id']): Promise<void> {
    await this.passwordResetTokenRepository.invalidateTokensForUser(userId);
  }

  private async createResetToken(userId: dbUser['id'], token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.tokenExpiryHours);

    const tokenData: dbPasswordResetTokenCreateInput = {
      userid: userId,
      token,
      expiresat: expiresAt,
      used: false,
    };

    await this.passwordResetTokenRepository.createToken(tokenData);
  }
}
