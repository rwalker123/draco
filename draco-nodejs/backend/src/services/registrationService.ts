import prisma from '../lib/prisma.js';
import { AuthService } from './authService.js';
import validator from 'validator';

interface ServiceResult<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  payload?: T;
}

interface NewUserPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  accountId: bigint;
}

interface ExistingUserPayload {
  usernameOrEmail: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  accountId: bigint;
}

export class RegistrationService {
  private readonly authService = new AuthService();

  async registerAndCreateContactNewUser(
    data: NewUserPayload,
  ): Promise<
    ServiceResult<{
      token: string;
      user: { id: string; username: string; email: string };
      contact: unknown;
    }>
  > {
    const { email, password, firstName, middleName, lastName, accountId } = data;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return { success: false, statusCode: 400, message: 'Missing required fields' };
    }
    if (!validator.isEmail(email)) {
      return { success: false, statusCode: 400, message: 'Invalid email format' };
    }
    if (password.length < 6) {
      return { success: false, statusCode: 400, message: 'Password must be at least 6 characters' };
    }

    return await prisma.$transaction(async (tx) => {
      // Register user via AuthService
      const registerResult = await this.authService.register({
        username: email,
        email,
        password,
        firstName,
        lastName,
      });
      if (!registerResult.success || !registerResult.token || !registerResult.user) {
        return {
          success: false,
          statusCode: 400,
          message: registerResult.message || 'Registration failed',
        } as ServiceResult<never>;
      }

      // Create contact linked to new user
      const created = await tx.contacts.create({
        data: {
          userid: registerResult.user.id,
          creatoraccountid: accountId,
          firstname: firstName,
          lastname: lastName,
          middlename: middleName || '',
          email,
          dateofbirth: new Date('1900-01-01'),
        },
      });

      return {
        success: true,
        payload: {
          token: registerResult.token,
          user: registerResult.user,
          contact: {
            id: created.id.toString(),
            firstname: created.firstname,
            lastname: created.lastname,
            middlename: created.middlename,
            email: created.email || undefined,
          },
        },
      } as ServiceResult<{
        token: string;
        user: { id: string; username: string; email: string };
        contact: unknown;
      }>;
    });
  }

  async loginAndCreateContactExistingUser(
    data: ExistingUserPayload,
  ): Promise<
    ServiceResult<{
      token: string;
      user: { id: string; username: string; email: string };
      contact: unknown;
    }>
  > {
    const { usernameOrEmail, password, firstName, middleName, lastName, accountId } = data;

    if (!usernameOrEmail || !password || !firstName) {
      return { success: false, statusCode: 400, message: 'Missing required fields' };
    }

    return await prisma.$transaction(async (tx) => {
      // Support login by username; call AuthService.login
      const loginResult = await this.authService.login({ username: usernameOrEmail, password });
      if (!loginResult.success || !loginResult.token || !loginResult.user) {
        return {
          success: false,
          statusCode: 401,
          message: loginResult.message || 'Invalid credentials',
        } as ServiceResult<never>;
      }

      // Guard: ensure not already registered in this account
      const existing = await tx.contacts.findFirst({
        where: { userid: loginResult.user.id, creatoraccountid: accountId },
      });
      if (existing) {
        return {
          success: false,
          statusCode: 409,
          message: 'Already registered',
        } as ServiceResult<never>;
      }

      const created = await tx.contacts.create({
        data: {
          userid: loginResult.user.id,
          creatoraccountid: accountId,
          firstname: firstName,
          lastname: lastName || '',
          middlename: middleName || '',
          email: loginResult.user.email || null,
          dateofbirth: new Date('1900-01-01'),
        },
      });

      return {
        success: true,
        payload: {
          token: loginResult.token,
          user: loginResult.user,
          contact: {
            id: created.id.toString(),
            firstname: created.firstname,
            lastname: created.lastname,
            middlename: created.middlename,
            email: created.email || undefined,
          },
        },
      } as ServiceResult<{
        token: string;
        user: { id: string; username: string; email: string };
        contact: unknown;
      }>;
    });
  }
}
