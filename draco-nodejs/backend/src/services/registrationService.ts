import prisma from '../lib/prisma.js';
import { AuthService } from './authService.js';
import { ContactValidationService, ValidationType } from '../utils/contactValidation.js';
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
  validationType?: ValidationType;
  streetAddress?: string;
  dateOfBirth?: string;
}

interface ExistingUserPayload {
  usernameOrEmail: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  accountId: bigint;
  validationType?: ValidationType;
  streetAddress?: string;
  dateOfBirth?: string;
}

export class RegistrationService {
  private readonly authService = new AuthService();

  async registerAndCreateContactNewUser(data: NewUserPayload): Promise<
    ServiceResult<{
      token: string;
      user: { id: string; username: string; email: string };
      contact: unknown;
    }>
  > {
    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      accountId,
      validationType,
      streetAddress,
      dateOfBirth,
    } = data;

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

    // Validate contact information FIRST (before creating user)
    if (validationType) {
      const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
        firstName,
        middleName,
        lastName,
        validationType,
        streetAddress,
        dateOfBirth,
      });

      if (!validationResult.success) {
        return {
          success: false,
          statusCode: validationResult.statusCode || 400,
          message: validationResult.error || 'Contact validation failed',
        };
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Step 1: Find and validate contact again within transaction (to avoid race conditions)
      let contact;
      if (validationType) {
        const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
          firstName,
          middleName,
          lastName,
          validationType,
          streetAddress,
          dateOfBirth,
        });

        if (!validationResult.success) {
          return {
            success: false,
            statusCode: validationResult.statusCode || 400,
            message: validationResult.error || 'Contact validation failed',
          } as ServiceResult<never>;
        }
        contact = validationResult.contact!;
      }

      // Step 2: Register user via AuthService
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
          message: registerResult.message || 'User registration failed',
        } as ServiceResult<never>;
      }

      let linkedContact;
      if (validationType && contact) {
        // Step 3: Link existing contact to new user
        linkedContact = await tx.contacts.update({
          where: { id: contact.id },
          data: { userid: registerResult.user.id },
        });
      } else {
        // Legacy: Create new contact (for backward compatibility when no validation type provided)
        linkedContact = await tx.contacts.create({
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
      }

      return {
        success: true,
        payload: {
          token: registerResult.token,
          user: registerResult.user,
          contact: {
            id: linkedContact.id.toString(),
            firstname: linkedContact.firstname,
            lastname: linkedContact.lastname,
            middlename: linkedContact.middlename,
            email: linkedContact.email || undefined,
          },
        },
      } as ServiceResult<{
        token: string;
        user: { id: string; username: string; email: string };
        contact: unknown;
      }>;
    });
  }

  async loginAndCreateContactExistingUser(data: ExistingUserPayload): Promise<
    ServiceResult<{
      token: string;
      user: { id: string; username: string; email: string };
      contact: unknown;
    }>
  > {
    const {
      usernameOrEmail,
      password,
      firstName,
      middleName,
      lastName,
      accountId,
      validationType,
      streetAddress,
      dateOfBirth,
    } = data;

    if (!usernameOrEmail || !password || !firstName) {
      return { success: false, statusCode: 400, message: 'Missing required fields' };
    }

    // Validate contact information FIRST (before login)
    if (validationType) {
      const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
        firstName,
        middleName,
        lastName: lastName || '', // lastName can be optional for existing user
        validationType,
        streetAddress,
        dateOfBirth,
      });

      if (!validationResult.success) {
        return {
          success: false,
          statusCode: validationResult.statusCode || 400,
          message: validationResult.error || 'Contact validation failed',
        };
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Step 1: Login user via AuthService
      const loginResult = await this.authService.login({ username: usernameOrEmail, password });
      if (!loginResult.success || !loginResult.token || !loginResult.user) {
        return {
          success: false,
          statusCode: 401,
          message: loginResult.message || 'Invalid credentials',
        } as ServiceResult<never>;
      }

      // Step 2: Guard - ensure not already registered in this account
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

      let linkedContact;
      if (validationType) {
        // Step 3: Find and validate contact again within transaction
        const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
          firstName,
          middleName,
          lastName: lastName || '',
          validationType,
          streetAddress,
          dateOfBirth,
        });

        if (!validationResult.success) {
          return {
            success: false,
            statusCode: validationResult.statusCode || 400,
            message: validationResult.error || 'Contact validation failed',
          } as ServiceResult<never>;
        }

        const contact = validationResult.contact!;

        // Step 4: Link existing contact to logged-in user
        linkedContact = await tx.contacts.update({
          where: { id: contact.id },
          data: { userid: loginResult.user.id },
        });
      } else {
        // Legacy: Create new contact (for backward compatibility when no validation type provided)
        linkedContact = await tx.contacts.create({
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
      }

      return {
        success: true,
        payload: {
          token: loginResult.token,
          user: loginResult.user,
          contact: {
            id: linkedContact.id.toString(),
            firstname: linkedContact.firstname,
            lastname: linkedContact.lastname,
            middlename: linkedContact.middlename,
            email: linkedContact.email || undefined,
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
