import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'draco-sports-manager-secret';
  private readonly JWT_EXPIRES_IN = '24h';

  /**
   * Authenticate user with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { username, password } = credentials;

      // Find user by username
      const user = await prisma.aspnetusers.findUnique({
        where: { username },
        include: {
          aspnetuserroles: {
            include: {
              aspnetroles: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Check if user is locked out
      if (user.lockoutenabled && user.lockoutenddateutc && user.lockoutenddateutc > new Date()) {
        return {
          success: false,
          message: 'Account is temporarily locked. Please try again later.',
        };
      }

      // Verify password
      if (!user.passwordhash) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      const isPasswordValid = await this.verifyPassword(password, user.passwordhash);
      if (!isPasswordValid) {
        // Increment failed login count
        await this.incrementFailedLoginCount(user.id);
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Reset failed login count on successful login
      if (user.accessfailedcount > 0) {
        await prisma.aspnetusers.update({
          where: { id: user.id },
          data: { accessfailedcount: 0 },
        });
      }

      // Generate JWT token
      const token = this.generateToken(user.id, user.username || '');

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username || '',
          email: user.email || '',
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login',
      };
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const { username, email, password, firstName, lastName } = data;

      // Check if username already exists
      const existingUser = await prisma.aspnetusers.findUnique({
        where: { username },
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Username already exists',
        };
      }

      // Check if email already exists
      if (email) {
        const existingEmail = await prisma.aspnetusers.findFirst({
          where: { email },
        });

        if (existingEmail) {
          return {
            success: false,
            message: 'Email already exists',
          };
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate user ID (GUID format)
      const userId = this.generateUserId();

      // Create user
      const newUser = await prisma.aspnetusers.create({
        data: {
          id: userId,
          username,
          email,
          emailconfirmed: false,
          passwordhash: hashedPassword,
          securitystamp: this.generateSecurityStamp(),
          phonenumberconfirmed: false,
          twofactorenabled: false,
          lockoutenabled: true,
          accessfailedcount: 0,
        },
      });

      // Create contact record if name provided
      if (firstName || lastName) {
        // Find a default account to associate with
        const defaultAccount = await prisma.accounts.findFirst();
        if (defaultAccount) {
          await prisma.contacts.create({
            data: {
              id: BigInt(Date.now()), // Generate a unique BigInt ID
              userid: userId,
              firstname: firstName || '',
              lastname: lastName || '',
              middlename: '', // Required field, use empty string as default
              email,
              creatoraccountid: defaultAccount.id,
              dateofbirth: new Date('1900-01-01'), // Default date
            },
          });
        }
      }

      // Generate JWT token
      const token = this.generateToken(newUser.id, newUser.username || '');

      return {
        success: true,
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          username: newUser.username || '',
          email: newUser.email || '',
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An error occurred during registration',
      };
    }
  }

  /**
   * Verify JWT token and return user info
   */
  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      const user = await prisma.aspnetusers.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'Token valid',
        user: {
          id: user.id,
          username: user.username || '',
          email: user.email || '',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token',
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    try {
      // Find user
      const user = await prisma.aspnetusers.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify current password
      if (!user.passwordhash) {
        return {
          success: false,
          message: 'User has no password set',
        };
      }

      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordhash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.aspnetusers.update({
        where: { id: userId },
        data: { passwordhash: hashedNewPassword },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'An error occurred while changing password',
      };
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(userId: string): Promise<AuthResponse> {
    try {
      // Find user
      const user = await prisma.aspnetusers.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if user is locked out
      if (user.lockoutenabled && user.lockoutenddateutc && user.lockoutenddateutc > new Date()) {
        return {
          success: false,
          message: 'Account is temporarily locked',
        };
      }

      // Generate new token
      const token = this.generateToken(user.id, user.username || '');

      return {
        success: true,
        message: 'Token refreshed successfully',
        token,
        user: {
          id: user.id,
          username: user.username || '',
          email: user.email || '',
        },
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'An error occurred while refreshing token',
      };
    }
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
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
    await prisma.aspnetusers.update({
      where: { id: userId },
      data: {
        accessfailedcount: {
          increment: 1,
        },
      },
    });
  }
}
