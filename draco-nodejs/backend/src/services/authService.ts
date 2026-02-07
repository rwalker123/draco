import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/customErrors.js';
import { IUserRepository, RepositoryFactory } from '../repositories/index.js';
import { BaseContactType, RegisteredUserType, SignInCredentialsType } from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';
import { ContactService } from './contactService.js';
import type { EmailService } from './emailService.js';

export interface JWTPayload {
  userId: string;
  username: string;
  securityStamp?: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly JWT_SECRET = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  })();
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly JWT_EXTENDED_EXPIRES_IN = '365d';
  private readonly MAX_FAILED_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  private readonly userRepository: IUserRepository;
  private readonly contactService: ContactService;
  private readonly emailService: EmailService;

  constructor() {
    this.userRepository = RepositoryFactory.getUserRepository();
    this.contactService = ServiceFactory.getContactService();
    this.emailService = ServiceFactory.getEmailService();
  }
  /**
   * Get user by ID
   */
  async getUserById(userId: string, accountId?: string): Promise<RegisteredUserType | null> {
    const user = await this.userRepository.findByUserId(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const result: RegisteredUserType = {
      userId: userId,
      userName: user.username || '',
    };

    if (accountId) {
      try {
        const contact: BaseContactType = (await this.contactService.getContactByUserId(
          userId,
          BigInt(accountId),
        )) as BaseContactType;
        if (contact) {
          result.contact = contact;
        }
      } catch {
        // Ignore errors fetching contact
      }
    }

    return result;
  }

  /**
   * Authenticate user with username and password
   */
  async login(credentials: SignInCredentialsType): Promise<RegisteredUserType> {
    const { userName, password } = credentials;
    const normalizedUsername = userName.toLowerCase().trim();

    const user = await this.userRepository.findByUsername(normalizedUsername);

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Check if user is locked out
    if (user.lockoutenabled && user.lockoutenddateutc && user.lockoutenddateutc > new Date()) {
      throw new AuthenticationError('Account is temporarily locked. Please try again later.');
    }

    // Verify password
    if (!user.passwordhash) {
      throw new AuthenticationError('Invalid username or password');
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordhash);
    if (!isPasswordValid) {
      // Increment failed login count
      await this.incrementFailedLoginCount(user.id);
      throw new AuthenticationError('Invalid username or password');
    }

    // Reset failed login count on successful login
    if (user.accessfailedcount > 0) {
      await this.userRepository.updateUser(user.id, {
        accessfailedcount: 0,
      });
    }

    let securityStamp = user.securitystamp;
    if (!securityStamp) {
      securityStamp = this.generateSecurityStamp();
      await this.userRepository.updateUser(user.id, { securitystamp: securityStamp });
    }

    const expiresIn = credentials.rememberMe ? this.JWT_EXTENDED_EXPIRES_IN : undefined;
    const token = this.generateToken(user.id, user.username || '', securityStamp, expiresIn);

    const registeredUser: RegisteredUserType = {
      token,
      userId: user.id,
      userName: user.username || '',
    };

    if (token && credentials.accountId) {
      try {
        const contact: BaseContactType = (await this.contactService.getContactByUserId(
          user.id,
          BigInt(credentials.accountId),
        )) as BaseContactType;
        if (contact) {
          registeredUser.contact = contact;
        }
      } catch {
        // Ignore errors fetching contact
      }
    }

    return registeredUser;
  }

  /**
   * Register a new user
   */
  async register(
    credentials: SignInCredentialsType,
    options?: { sendWelcomeEmail?: boolean },
  ): Promise<RegisteredUserType> {
    const { userName, password } = credentials;
    const normalizedUsername = userName.toLowerCase().trim();

    const existingUser = await this.userRepository.findByUsername(normalizedUsername);

    if (existingUser) {
      throw new ValidationError('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = this.generateUserId();
    const securityStamp = this.generateSecurityStamp();

    const newUser = await this.userRepository.create({
      id: userId,
      username: normalizedUsername,
      email: '',
      emailconfirmed: false,
      passwordhash: hashedPassword,
      securitystamp: securityStamp,
      phonenumberconfirmed: false,
      twofactorenabled: false,
      lockoutenabled: true,
      accessfailedcount: 0,
    });

    const token = this.generateToken(newUser.id, newUser.username || '', securityStamp);

    const welcomeEmailRecipient = newUser.username || userName;
    if (options?.sendWelcomeEmail !== false) {
      void this.emailService.sendGeneralWelcomeEmail(welcomeEmailRecipient);
    }

    return {
      token,
      userId: newUser.id,
      userName: newUser.username || '',
    };
  }

  /**
   * Verify JWT token and return user info
   */
  async verifyToken(token: string): Promise<RegisteredUserType> {
    const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

    const user = await this.userRepository.findByUserId(decoded.userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return {
      userId: user.id,
      userName: user.username || '',
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<RegisteredUserType> {
    const user = await this.userRepository.findByUserId(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.passwordhash) {
      throw new AuthenticationError('User has no password set');
    }

    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordhash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    const newSecurityStamp = this.generateSecurityStamp();

    await this.userRepository.updateUser(userId, {
      passwordhash: hashedNewPassword,
      securitystamp: newSecurityStamp,
    });

    const token = this.generateToken(userId, user.username || '', newSecurityStamp);

    return {
      token,
      userId: user.id,
      userName: user.username || '',
    };
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(userId: string): Promise<RegisteredUserType> {
    const user = await this.userRepository.findByUserId(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.lockoutenabled && user.lockoutenddateutc && user.lockoutenddateutc > new Date()) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    let securityStamp = user.securitystamp;
    if (!securityStamp) {
      securityStamp = this.generateSecurityStamp();
      await this.userRepository.updateUser(user.id, { securitystamp: securityStamp });
    }

    const token = this.generateToken(user.id, user.username || '', securityStamp);

    return {
      userId: user.id,
      userName: user.username || '',
      token,
    };
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private generateToken(
    userId: string,
    username: string,
    securityStamp: string,
    expiresIn?: jwt.SignOptions['expiresIn'],
  ): string {
    return jwt.sign({ userId, username, securityStamp }, this.JWT_SECRET, {
      expiresIn: expiresIn ?? this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Generate user ID (GUID format)
   */
  private generateUserId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate security stamp
   */
  generateSecurityStamp(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Prepare user credentials for transaction-based user creation.
   * Returns hashed password, security stamp, and generated user ID.
   */
  async prepareUserCredentials(password: string): Promise<{
    hashedPassword: string;
    securityStamp: string;
    userId: string;
  }> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return {
      hashedPassword,
      securityStamp: this.generateSecurityStamp(),
      userId: this.generateUserId(),
    };
  }

  /**
   * Generate a JWT token for a user (for use after transaction-based user creation).
   */
  generateTokenForUser(userId: string, username: string, securityStamp: string): string {
    return this.generateToken(userId, username, securityStamp);
  }

  /**
   * Increment failed login count
   */
  private async incrementFailedLoginCount(userId: string): Promise<void> {
    const user = await this.userRepository.findByUserId(userId);
    if (!user) return;

    const newCount = (user.accessfailedcount || 0) + 1;

    if (user.lockoutenabled && newCount >= this.MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockoutEnd = new Date();
      lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
      await this.userRepository.updateUser(userId, {
        accessfailedcount: 0,
        lockoutenddateutc: lockoutEnd,
      });
    } else {
      await this.userRepository.updateUser(userId, {
        accessfailedcount: newCount,
      });
    }
  }
}
