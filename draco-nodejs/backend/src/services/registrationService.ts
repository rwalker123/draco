import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/customErrors.js';
import {
  BaseContactType,
  ContactValidationType,
  ContactValidationWithSignInType,
  RegisteredUserType,
} from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';
import { Mutex } from 'async-mutex';
import type { EmailService } from './emailService.js';
import type { AccountsService } from './accountsService.js';

export class RegistrationService {
  private readonly authService = ServiceFactory.getAuthService();
  private readonly contactService = ServiceFactory.getContactService();
  private readonly emailService: EmailService = ServiceFactory.getEmailService();
  private readonly accountsService: AccountsService = ServiceFactory.getAccountsService();
  private userCreateMutex = new Mutex();

  /**
   * Register and create a contact for a new user
   * @param data - New user payload
   * @returns Service result with token, user, and contact
   */
  async registerAndCreateContactNewUser(
    accountId: bigint,
    data: ContactValidationWithSignInType,
  ): Promise<RegisteredUserType> {
    return await this.userCreateMutex.runExclusive(async () => {
      // Step 1: Find and validate contact
      const validatedContact = await this.findAndValidateContact(accountId, data);

      if (!validatedContact) {
        throw new ConflictError('Contact validation failed');
      }

      // If contact was found, check if it's already linked to another user
      if (validatedContact.userId) {
        throw new ConflictError('This contact is already registered to another user.');
      }

      if (!data.userName) {
        throw new ValidationError('userName is required');
      }

      // Step 2: Register user via AuthService (WITHIN TRANSACTION)
      const registerResult = await this.authService.register({
        userName: data.userName,
        password: data.password,
      });

      if (!registerResult || !registerResult.token || !registerResult.userId) {
        throw new ConflictError('User registration failed');
      }

      // Step 3: Link existing contact to new user
      const linkedContact = await this.contactService.registerContactUser(
        registerResult.userId,
        BigInt(validatedContact.id),
        registerResult.userName || data.userName,
      );

      await this.sendAccountWelcomeEmail(
        accountId,
        linkedContact,
        data.userName,
        registerResult.userName,
      );

      return {
        userId: registerResult.userId,
        userName: registerResult.userName,
        token: registerResult.token,
        contact: linkedContact,
      };
    });
  }

  async loginAndCreateContactExistingUser(
    accountId: bigint,
    data: ContactValidationWithSignInType,
  ): Promise<RegisteredUserType> {
    // Step 1: Login user FIRST via AuthService
    const authenticatedUser = await this.authService.login({
      userName: data.userName,
      password: data.password,
    });

    if (!authenticatedUser || !authenticatedUser.token || !authenticatedUser.userId) {
      throw new AuthenticationError('Invalid credentials');
    }

    return await this.userCreateMutex.runExclusive(async () => {
      // Step 2: Check if user is already registered in this account
      const existingContact = await this.contactService
        .getContactByUserId(authenticatedUser.userId, accountId)
        .catch(() => {
          return null;
        });

      if (existingContact) {
        // User is already registered with this account
        // If validation info was provided, check if they're trying to register as a different contact
        const existingFirstName = (existingContact.firstName || '').toLowerCase().trim();
        const existingLastName = (existingContact.lastName || '').toLowerCase().trim();
        const providedFirstName = (data.firstName || '').toLowerCase().trim();
        const providedLastName = (data.lastName || '').toLowerCase().trim();

        // Check if the provided names match the existing contact
        const namesMatch =
          existingFirstName === providedFirstName && existingLastName === providedLastName;

        if (!namesMatch) {
          // User is trying to register as a different contact
          throw new ConflictError(
            `You are already registered as ${existingContact.firstName} ${existingContact.lastName}. You cannot register as a different contact in this account.`,
          );
        }

        // Names match or no validation info provided - return success with existing contact
        return {
          userId: authenticatedUser.userId,
          userName: authenticatedUser.userName,
          token: authenticatedUser.token,
          contact: existingContact,
        };
      }

      // Step 3: Find contact matching validation info (with skipUserIdCheck=true)
      const validationResult = await this.findAndValidateContact(accountId, data);

      if (!validationResult) {
        throw new ConflictError('Contact validation failed');
      }

      const contact = validationResult;

      let linkedContact = null;

      // Step 4: Check userid status and handle appropriately
      if (contact.userId) {
        // Contact is linked to a different user
        throw new ConflictError('This contact is already registered to another user.');
      } else {
        // Contact is unlinked, link it to the authenticated user
        linkedContact = await this.contactService.registerContactUser(
          authenticatedUser.userId,
          BigInt(contact.id),
          authenticatedUser.userName || data.userName,
        );
      }

      const contactForWelcome = linkedContact ?? contact;
      await this.sendAccountWelcomeEmail(
        accountId,
        contactForWelcome,
        data.userName,
        authenticatedUser.userName,
      );

      return {
        userId: authenticatedUser.userId,
        userName: authenticatedUser.userName,
        token: authenticatedUser.token,
        contact: linkedContact,
      };
    });
  }

  /**
   * Link an authenticated user to an existing contact using validation data
   * @param userId - Authenticated user's ID
   * @param accountId - Account to register within
   * @param data - Validation payload (no credentials)
   */
  async selfRegisterContact(
    userId: string,
    accountId: bigint,
    data: ContactValidationType,
  ): Promise<RegisteredUserType> {
    return await this.userCreateMutex.runExclusive(async () => {
      const user = await this.authService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const validatedContact = await this.findAndValidateContact(accountId, data);
      const normalizedUserName = user.userName?.trim() ?? '';
      const linkedContact = await this.contactService.registerContactUser(
        userId,
        BigInt(validatedContact.id),
        normalizedUserName || undefined,
      );

      await this.sendAccountWelcomeEmail(
        accountId,
        linkedContact,
        normalizedUserName || undefined,
        normalizedUserName || undefined,
      );

      return {
        userId: user.userId,
        userName: user.userName,
        contact: linkedContact,
      };
    });
  }

  /**
   * Find and validate a contact for registration
   * @param accountId - Account ID to search within
   * @param input - Contact validation input
   * @returns Validation result with contact if found
   */
  private async findAndValidateContact(
    accountId: bigint,
    input: ContactValidationType,
  ): Promise<BaseContactType> {
    const candidates = await this.contactService.findAndValidateContact(accountId, input);
    if (candidates.length === 0) {
      throw new NotFoundError(
        'No contact found matching your information. Please verify your details or contact the administrator.',
      );
    }

    if (candidates.length > 1) {
      throw new ConflictError('Multiple contacts found. Please contact administrator.');
    }

    const contact = candidates[0];

    if (contact.userId) {
      throw new ConflictError('This contact is already registered to another user.');
    }

    return contact;
  }

  private async sendAccountWelcomeEmail(
    accountId: bigint,
    contact: BaseContactType,
    fallbackEmail?: string,
    userName?: string,
  ): Promise<void> {
    const candidateEmails = [contact.email, fallbackEmail].filter((value): value is string =>
      Boolean(value?.trim()),
    );
    const toEmail = candidateEmails[0];

    if (!toEmail) {
      return;
    }

    try {
      const account = await this.accountsService.getAccountName(accountId);
      const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();

      await this.emailService.sendAccountWelcomeEmail({
        toEmail,
        accountId: account.id,
        accountName: account.name,
        contactName: contactName || undefined,
        userName,
      });
    } catch (error) {
      console.error('Failed to send account welcome email:', error);
    }
  }
}
