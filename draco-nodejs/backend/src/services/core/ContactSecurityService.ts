// ContactSecurityService for Draco Sports Manager
// Centralized service for contact-account validation and security checks

import { PrismaClient } from '@prisma/client';
import { logSecurely } from '../../utils/auditLogger.js';

/**
 * ContactSecurityService
 *
 * Provides centralized contact-account validation logic to eliminate code duplication
 * and ensure consistent security checks across the application. This service handles:
 *
 * - Contact existence validation within account boundaries
 * - User-to-contact relationship validation
 * - Multi-tenant security enforcement for contact operations
 * - Batch validation for performance optimization
 *
 * This service consolidates validation logic that was previously duplicated across
 * 10+ files, reducing maintenance burden and improving security consistency.
 *
 * @example
 * ```typescript
 * const contactSecurity = ServiceFactory.getContactSecurityService();
 * const isValid = await contactSecurity.isContactInAccount(contactId, accountId);
 * const contact = await contactSecurity.getUserContactInAccount(userId, accountId);
 * ```
 */
/**
 * Base contact fields type for type-safe select operations
 * Contains only the fields actually used in ContactSecurityService calls
 */
type BaseContactFields = {
  id: bigint;
  userid: string | null;
  firstname: string;
  lastname: string;
  middlename: string;
  email: string | null;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: Date | null;
};

/**
 * Type utility that maps select fields to the actual contact field types
 * This ensures that when you select specific fields, you get back exactly those fields with correct types
 */
export type ContactSelectResult<T extends Record<string, boolean>> = {
  [K in keyof T as T[K] extends true ? K : never]: K extends keyof BaseContactFields
    ? BaseContactFields[K]
    : unknown;
};

export class ContactSecurityService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check if contact exists and belongs to account
   *
   * Core validation method that checks if a contact ID belongs to the specified
   * account. This is the primary method for enforcing account boundary security
   * for contact-related operations.
   *
   * @param contactId - ID of the contact to validate
   * @param accountId - Account ID for boundary enforcement
   * @returns True if contact exists and belongs to account, false otherwise
   *
   * @security Enforces multi-tenant isolation by validating creatoraccountid
   *
   * @example
   * ```typescript
   * const isValid = await contactSecurity.isContactInAccount(789n, 123n);
   * if (!isValid) {
   *   throw new ValidationError('Contact not found in account');
   * }
   * ```
   */
  async isContactInAccount(contactId: bigint, accountId: bigint): Promise<boolean> {
    try {
      const contact = await this.prisma.contacts.findFirst({
        where: {
          id: contactId,
          creatoraccountid: accountId,
        },
        select: { id: true },
      });

      return !!contact;
    } catch (error) {
      logSecurely('error', 'Error checking contact account membership', {
        error: error instanceof Error ? error.message : String(error),
        contactId: String(contactId),
        accountId: String(accountId),
      });
      return false;
    }
  }

  /**
   * Get validated contact with specific fields
   *
   * Returns contact details if the contact exists and belongs to the specified
   * account. Uses generic typing to ensure return type matches selected fields.
   *
   * @param contactId - ID of the contact to retrieve
   * @param accountId - Account ID for boundary enforcement
   * @param selectFields - Fields to select with type safety
   * @returns Contact record with only selected fields if valid, null otherwise
   *
   * @security Enforces account boundary before returning any contact data
   *
   * @example
   * ```typescript
   * const contact = await contactSecurity.getValidatedContact(789n, 123n, {
   *   id: true,
   *   firstname: true,
   *   lastname: true
   * });
   * if (contact) {
   *   console.log(`Found: ${contact.firstname} ${contact.lastname}`);
   * }
   * ```
   */
  async getValidatedContact<T extends Record<string, boolean>>(
    contactId: bigint,
    accountId: bigint,
    selectFields: T,
  ): Promise<ContactSelectResult<T> | null> {
    try {
      const contact = await this.prisma.contacts.findFirst({
        where: {
          id: contactId,
          creatoraccountid: accountId,
        },
        select: selectFields,
      });

      return contact as ContactSelectResult<T> | null;
    } catch (error) {
      logSecurely('error', 'Error getting validated contact', {
        error: error instanceof Error ? error.message : String(error),
        contactId: String(contactId),
        accountId: String(accountId),
      });
      return null;
    }
  }

  /**
   * Get user's contact record within account with specific fields
   *
   * Finds the contact record associated with a user ID within the specified
   * account. Uses generic typing to ensure return type matches selected fields.
   *
   * @param userId - User ID to find contact for
   * @param accountId - Account ID to search within
   * @param selectFields - Fields to select with type safety
   * @returns Contact record with only selected fields if found, null otherwise
   *
   * @security Validates both userid and creatoraccountid for double security
   *
   * @example
   * ```typescript
   * const userContact = await contactSecurity.getUserContactInAccount('user123', 123n, {
   *   id: true,
   *   firstname: true,
   *   lastname: true
   * });
   * if (!userContact) {
   *   throw new Error('User not registered with this account');
   * }
   * ```
   */
  async getUserContactInAccount<T extends Record<string, boolean>>(
    userId: string,
    accountId: bigint,
    selectFields: T,
  ): Promise<ContactSelectResult<T> | null> {
    try {
      const contact = await this.prisma.contacts.findFirst({
        where: {
          userid: userId,
          creatoraccountid: accountId,
        },
        select: selectFields,
      });

      return contact as ContactSelectResult<T> | null;
    } catch (error) {
      logSecurely('error', 'Error getting user contact in account', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        accountId: String(accountId),
      });
      return null;
    }
  }

  /**
   * Validate multiple contacts in batch
   *
   * Efficiently validates multiple contact IDs against an account in a single
   * database query. Returns a Map for O(1) lookup of validation results.
   *
   * @param contactIds - Array of contact IDs to validate
   * @param accountId - Account ID for boundary enforcement
   * @returns Map with contactId as key and boolean validation result as value
   *
   * @performance Uses single query with IN clause for efficient batch validation
   *
   * @example
   * ```typescript
   * const validationMap = await contactSecurity.validateMultipleContacts([1n, 2n, 3n], 123n);
   * const isValid = validationMap.get('1') || false;
   * ```
   */
  async validateMultipleContacts(
    contactIds: bigint[],
    accountId: bigint,
  ): Promise<Map<string, boolean>> {
    const resultMap = new Map<string, boolean>();

    // Initialize all as false
    contactIds.forEach((id) => {
      resultMap.set(id.toString(), false);
    });

    if (contactIds.length === 0) {
      return resultMap;
    }

    try {
      const validContacts = await this.prisma.contacts.findMany({
        where: {
          id: { in: contactIds },
          creatoraccountid: accountId,
        },
        select: { id: true },
      });

      // Mark valid contacts as true
      validContacts.forEach((contact) => {
        resultMap.set(contact.id.toString(), true);
      });

      return resultMap;
    } catch (error) {
      logSecurely('error', 'Error validating multiple contacts', {
        error: error instanceof Error ? error.message : String(error),
        contactIds: contactIds.map(String),
        accountId: String(accountId),
      });
      return resultMap; // Return all false on error
    }
  }

  /**
   * Check if user exists as contact in any account
   *
   * Determines if a user ID has any contact records in any account.
   * Useful for registration flows and user management.
   *
   * @param userId - User ID to check
   * @returns True if user has any contact records, false otherwise
   *
   * @example
   * ```typescript
   * const hasContacts = await contactSecurity.hasUserContacts('user123');
   * if (!hasContacts) {
   *   // User needs to complete registration
   * }
   * ```
   */
  async hasUserContacts(userId: string): Promise<boolean> {
    try {
      const contact = await this.prisma.contacts.findFirst({
        where: { userid: userId },
        select: { id: true },
      });

      return !!contact;
    } catch (error) {
      logSecurely('error', 'Error checking user contacts existence', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return false;
    }
  }

  /**
   * Get all accounts where user has contact records
   *
   * Returns list of account IDs where the user has contact records.
   * Useful for account switching and permission context.
   *
   * @param userId - User ID to find accounts for
   * @returns Array of account IDs where user has contacts
   *
   * @example
   * ```typescript
   * const accounts = await contactSecurity.getUserAccounts('user123');
   * console.log(`User has access to ${accounts.length} accounts`);
   * ```
   */
  async getUserAccounts(userId: string): Promise<bigint[]> {
    try {
      const contacts = await this.prisma.contacts.findMany({
        where: { userid: userId },
        select: { creatoraccountid: true },
        distinct: ['creatoraccountid'],
      });

      return contacts.map((contact) => contact.creatoraccountid);
    } catch (error) {
      logSecurely('error', 'Error getting user accounts', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Log security validation attempt for audit trail
   *
   * Records validation attempts for security auditing and monitoring.
   * Helps track potential security violations and access patterns.
   *
   * @param action - The validation action being performed
   * @param contactId - Contact ID being validated (null if not applicable)
   * @param userId - User ID involved (null if not applicable)
   * @param accountId - Account ID for context
   * @param success - Whether the validation succeeded
   * @param details - Additional details for audit log
   *
   * @security Creates audit trail for all validation attempts
   *
   * @example
   * ```typescript
   * contactSecurity.logValidationAttempt(
   *   'contact_access_check',
   *   789n,
   *   'user123',
   *   123n,
   *   false,
   *   { reason: 'contact_not_in_account' }
   * );
   * ```
   */
  logValidationAttempt(
    action: string,
    contactId: bigint | null,
    userId: string | null,
    accountId: bigint,
    success: boolean,
    details: Record<string, unknown> = {},
  ): void {
    logSecurely('info', `Contact security validation: ${action}`, {
      action,
      contactId: contactId ? String(contactId) : null,
      userId,
      accountId: String(accountId),
      success,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}
