import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/customErrors.js';
import { IUserRepository, RepositoryFactory } from '../repositories/index.js';
import { BaseContactType, RegisteredUserType, SignInCredentialsType } from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';
import { ContactService } from './contactService.js';

export interface JWTPayload {
  userId: string;
  username: string;
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

  private readonly userRepository: IUserRepository;
  private readonly contactService: ContactService;

  constructor() {
    this.userRepository = RepositoryFactory.getUserRepository();
    this.contactService = ServiceFactory.getContactService();
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

    const user = await this.userRepository.findByUsername(userName);

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
      this.userRepository.update(BigInt(user.id), {
        accessfailedcount: 0,
      });
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.username || '');

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
  async register(credentials: SignInCredentialsType): Promise<RegisteredUserType> {
    const { userName, password } = credentials;

    // Check if username already exists
    const existingUser = await this.userRepository.findByUsername(userName);

    if (existingUser) {
      throw new ValidationError('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate user ID (GUID format)
    const userId = this.generateUserId();

    // Create user
    const newUser = await this.userRepository.create({
      id: userId,
      username: userName,
      email: '',
      emailconfirmed: false,
      passwordhash: hashedPassword,
      securitystamp: this.generateSecurityStamp(),
      phonenumberconfirmed: false,
      twofactorenabled: false,
      lockoutenabled: true,
      accessfailedcount: 0,
    });

    // Generate JWT token
    const token = this.generateToken(newUser.id, newUser.username || '');

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
    // Find user
    const user = await this.userRepository.findByUserId(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    if (!user.passwordhash) {
      throw new AuthenticationError('User has no password set');
    }

    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordhash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepository.updatePassword(userId, hashedNewPassword);

    return {
      userId: user.id,
      userName: user.username || '',
    };
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(userId: string): Promise<RegisteredUserType> {
    // Find user
    const user = await this.userRepository.findByUserId(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is locked out
    if (user.lockoutenabled && user.lockoutenddateutc && user.lockoutenddateutc > new Date()) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    // Generate new token
    const token = this.generateToken(user.id, user.username || '');

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
  private generateToken(userId: string, username: string): string {
    return jwt.sign({ userId, username }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
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
  private generateSecurityStamp(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Increment failed login count
   */
  private async incrementFailedLoginCount(userId: string): Promise<void> {
    await this.userRepository.updateUser(userId, {
      accessfailedcount: 1,
    });
  }
}
