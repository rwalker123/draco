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

    // Step 1: Login user FIRST via AuthService
    const loginResult = await this.authService.login({ username: usernameOrEmail, password });

    if (!loginResult.success || !loginResult.token || !loginResult.user) {
      return {
        success: false,
        statusCode: 401,
        message: loginResult.message || 'Invalid credentials',
      };
    }

    // Extract user and token (TypeScript now knows they exist)
    const { user: authenticatedUser, token } = loginResult;

    return await prisma.$transaction(async (tx) => {
      // Step 2: Check if user is already registered in this account
      const existing = await tx.contacts.findFirst({
        where: { userid: authenticatedUser.id, creatoraccountid: accountId },
      });

      if (existing) {
        // User is already registered with this account
        // If validation info was provided, check if they're trying to register as a different contact
        if (validationType && (firstName || lastName)) {
          const existingFirstName = (existing.firstname || '').toLowerCase().trim();
          const existingLastName = (existing.lastname || '').toLowerCase().trim();
          const providedFirstName = (firstName || '').toLowerCase().trim();
          const providedLastName = (lastName || '').toLowerCase().trim();

          // Check if the provided names match the existing contact
          const namesMatch =
            existingFirstName === providedFirstName && existingLastName === providedLastName;

          if (!namesMatch) {
            // User is trying to register as a different contact
            return {
              success: false,
              statusCode: 409,
              message: `You are already registered as ${existing.firstname} ${existing.lastname}. You cannot register as a different contact in this account.`,
            };
          }
        }

        // Names match or no validation info provided - return success with existing contact
        return {
          success: true,
          payload: {
            token,
            user: authenticatedUser,
            contact: {
              id: existing.id.toString(),
              firstname: existing.firstname,
              lastname: existing.lastname,
              middlename: existing.middlename,
              email: existing.email || undefined,
            },
          },
        } as ServiceResult<{
          token: string;
          user: { id: string; username: string; email: string };
          contact: unknown;
        }>;
      }

      let linkedContact;
      if (validationType) {
        // Step 3: Find contact matching validation info (with skipUserIdCheck=true)
        const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
          firstName,
          middleName,
          lastName: lastName || '',
          validationType,
          streetAddress,
          dateOfBirth,
          skipUserIdCheck: true, // Allow finding contacts regardless of userid status
        });

        if (!validationResult.success) {
          return {
            success: false,
            statusCode: validationResult.statusCode || 400,
            message: validationResult.error || 'Contact validation failed',
          } as ServiceResult<never>;
        }

        const contact = validationResult.contact!;

        // Step 4: Check userid status and handle appropriately
        if (contact.userid === null) {
          // Contact is unlinked, link it to the authenticated user
          linkedContact = await tx.contacts.update({
            where: { id: contact.id },
            data: { userid: authenticatedUser.id },
          });
        } else if (contact.userid === authenticatedUser.id) {
          // Contact is already linked to this user (shouldn't happen due to step 2, but handle gracefully)
          linkedContact = contact;
        } else {
          // Contact is linked to a different user
          return {
            success: false,
            statusCode: 409,
            message: 'This contact is already registered to another user.',
          } as ServiceResult<never>;
        }
      } else {
        // Legacy: Create new contact (for backward compatibility when no validation type provided)
        linkedContact = await tx.contacts.create({
          data: {
            userid: authenticatedUser.id,
            creatoraccountid: accountId,
            firstname: firstName,
            lastname: lastName || '',
            middlename: middleName || '',
            email: authenticatedUser.email || null,
            dateofbirth: new Date('1900-01-01'),
          },
        });
      }

      return {
        success: true,
        payload: {
          token,
          user: authenticatedUser,
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
