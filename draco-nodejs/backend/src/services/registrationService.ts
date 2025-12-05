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
  AutoRegisterContactResponseType,
} from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';
import { Mutex } from 'async-mutex';
import type { EmailService } from './emailService.js';
import type { AccountsService } from './accountsService.js';
import { UserService } from './userService.js';
import { RepositoryFactory } from '../repositories/index.js';
import { randomUUID } from 'crypto';

export class RegistrationService {
  private readonly authService = ServiceFactory.getAuthService();
  private readonly contactService = ServiceFactory.getContactService();
  private readonly emailService: EmailService = ServiceFactory.getEmailService();
  private readonly accountsService: AccountsService = ServiceFactory.getAccountsService();
  private readonly userService: UserService = ServiceFactory.getUserService();
  private readonly userRepository = RepositoryFactory.getUserRepository();
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
      const registerResult = await this.authService.register(
        {
          userName: data.userName,
          password: data.password,
        },
        { sendWelcomeEmail: true },
      );

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

  /**
   * Auto-register contact by email: reuse existing user if present, otherwise create one, then send password-set email.
   */
  async autoRegisterContact(
    accountId: bigint,
    contactId: bigint,
  ): Promise<AutoRegisterContactResponseType> {
    return await this.userCreateMutex.runExclusive(async () => {
      const contact = await this.contactService.getContact(accountId, contactId);

      if (!contact.email) {
        return {
          status: 'missing-email',
          contactId: contact.id,
          message: 'Contact must have an email to auto-register.',
        };
      }

      const normalizedEmail = contact.email.trim().toLowerCase();

      if (contact.userId) {
        return {
          status: 'already-linked',
          contactId: contact.id,
          userId: contact.userId,
          userName: normalizedEmail,
        };
      }

      // Find existing user by username/email
      const resolvedUser = await this.userRepository.findByUsername(normalizedEmail);

      if (resolvedUser) {
        // Check if another contact in this account is already linked to this user
        const otherContact = await this.contactService
          .getContactByUserId(resolvedUser.id, accountId)
          .catch(() => null);

        if (otherContact && otherContact.id !== contact.id) {
          return {
            status: 'conflict-other-contact',
            contactId: contact.id,
            userId: resolvedUser.id,
            userName: resolvedUser.username ?? normalizedEmail,
            otherContactId: otherContact.id,
            otherContactName: `${otherContact.firstName} ${otherContact.lastName}`.trim(),
            message: 'User already linked to another contact in this account.',
          };
        }

        const linked = await this.contactService.registerContactUser(
          resolvedUser.id,
          contactId,
          normalizedEmail,
        );

        await this.sendAccountWelcomeEmail(
          accountId,
          linked,
          linked.email ?? normalizedEmail,
          resolvedUser.username ?? normalizedEmail,
        );

        return {
          status: 'linked-existing-user',
          contactId: linked.id,
          userId: resolvedUser.id,
          userName: resolvedUser.username ?? normalizedEmail,
          message:
            'Existing user found. Contact linked and welcome email sent. User can sign in with existing credentials; no password setup required.',
        };
      }

      // Create new user with generated password
      const tempPassword = this.generateTempPassword();
      const newUser = await this.authService.register(
        {
          userName: normalizedEmail,
          password: tempPassword,
        },
        { sendWelcomeEmail: false },
      );

      const linked = await this.contactService.registerContactUser(
        newUser.userId,
        contactId,
        normalizedEmail,
      );

      await this.sendPasswordSetEmail(
        accountId,
        newUser.userId,
        normalizedEmail,
        newUser.userName ?? normalizedEmail,
      );

      return {
        status: 'created-new-user',
        contactId: linked.id,
        userId: newUser.userId,
        userName: newUser.userName ?? normalizedEmail,
      };
    });
  }

  private generateTempPassword(): string {
    // Simple strong temp password; only valid until reset is completed
    return `Tmp${randomUUID().replace(/-/g, '').slice(0, 12)}!`;
  }

  private async sendPasswordSetEmail(
    accountId: bigint,
    userId: string,
    toEmail: string,
    username: string,
  ): Promise<void> {
    const token = await this.userService.createPasswordResetTokenForUser(userId).catch(() => null);
    if (!token) {
      throw new ValidationError(
        'Failed to create password reset token for user; cannot send password setup email.',
      );
    }

    const account = await this.accountsService.getAccountName(accountId).catch(() => null);
    const accountName = account?.name;

    await this.emailService.sendAccountPasswordSetupEmail({
      toEmail,
      username,
      resetToken: token,
      accountName,
      accountId: account?.id,
    });
  }
}
