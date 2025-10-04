import { RegisteredUserType, SignInUserNameType } from '@draco/shared-schemas';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import {
  IPasswordResetTokenRepository,
  IUserRepository,
  RepositoryFactory,
  dbPasswordResetTokenCreateInput,
  dbUser,
} from '../repositories/index.js';
import {
  PasswordResetVerificationResponse,
  UserResponseFormatter,
} from '../responseFormatters/userResponseFormatter.js';
import { InternalServerError, ValidationError } from '../utils/customErrors.js';
import { EmailService } from './emailService.js';

const RESET_TOKEN_BYTES = 32;
const PASSWORD_SALT_ROUNDS = 12;

interface UserServiceDependencies {
  userRepository?: IUserRepository;
  passwordResetTokenRepository?: IPasswordResetTokenRepository;
  emailService?: EmailService;
  tokenExpiryHours?: number;
}

export type PasswordResetRequestResult =
  | { kind: 'user-not-found' }
  | { kind: 'test-token'; user: RegisteredUserType }
  | { kind: 'email-sent' };

export class UserService {
  private readonly userRepository: IUserRepository;
  private readonly passwordResetTokenRepository: IPasswordResetTokenRepository;
  private readonly emailService: EmailService;
  private readonly tokenExpiryHours: number;

  constructor(dependencies: UserServiceDependencies = {}) {
    this.userRepository =
      dependencies.userRepository ?? RepositoryFactory.getUserRepository();
    this.passwordResetTokenRepository =
      dependencies.passwordResetTokenRepository ??
      RepositoryFactory.getPasswordResetTokenRepository();
    this.emailService = dependencies.emailService ?? new EmailService();
    this.tokenExpiryHours = dependencies.tokenExpiryHours ?? 24;
  }

  async requestPasswordReset({
    email,
    testMode = false,
  }: {
    email: SignInUserNameType;
    testMode?: boolean;
  }): Promise<PasswordResetRequestResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByUsername(normalizedEmail);

    if (!user) {
      return { kind: 'user-not-found' };
    }

    const resetToken = this.generateResetToken();
    await this.invalidateExistingTokens(user.id);
    await this.createResetToken(user.id, resetToken);

    if (testMode) {
      const formattedUser = UserResponseFormatter.formatRegisteredUserWithToken(user, resetToken);
      return { kind: 'test-token', user: formattedUser };
    }

    const emailSent = await this.emailService.sendPasswordResetEmail(
      normalizedEmail,
      user.username ?? normalizedEmail,
      resetToken,
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

  private generateResetToken(): string {
    return randomBytes(RESET_TOKEN_BYTES).toString('hex');
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
