// PlayerClassifiedAccessService for Draco Sports Manager
// Single responsibility: Handles access control, permissions, and security for player classifieds
import bcrypt from 'bcrypt';
import validator from 'validator';
import { NotFoundError, ValidationError, InternalServerError } from '../../utils/customErrors.js';
import { logSecurely } from '../../utils/auditLogger.js';
import { TeamsWantedOwnerClassifiedType } from '@draco/shared-schemas';
import {
  dbTeamsWanted,
  IPlayersWantedRepository,
  ITeamsWantedRepository,
  RepositoryFactory,
} from '../../repositories/index.js';
import { ServiceFactory } from '../serviceFactory.js';
import { AccountsService } from '../accountsService.js';
import { TeamsWantedResponseFormatter } from '../../responseFormatters/index.js';
import { ROLE_IDS } from '../../config/roles.js';
import { RoleNamesType } from '../../types/roles.js';

/**
 * PlayerClassifiedAccessService
 *
 * Handles access control and security operations for player classifieds including:
 * - Role-based access control for Players Wanted operations
 * - Access code verification for Teams Wanted classifieds
 * - Permission checking for edit/delete operations
 * - User role lookup and authorization
 * - Account boundary enforcement for multi-tenant security
 *
 * This service follows Single Responsibility Principle by focusing solely on access control
 * and security. It doesn't handle data transformation, validation, or email operations.
 *
 */
export class PlayerClassifiedAccessService {
  private teamsWantedRepository: ITeamsWantedRepository;
  private playersWantedRepository: IPlayersWantedRepository;
  private accountService: AccountsService;

  constructor() {
    this.teamsWantedRepository = RepositoryFactory.getTeamsWantedRepository();
    this.playersWantedRepository = RepositoryFactory.getPlayersWantedRepository();
    this.accountService = ServiceFactory.getAccountsService();
  }

  /**
   * Verify access code for Teams Wanted classified
   *
   * Authenticates anonymous users to access their Teams Wanted classified using the
   * access code sent via email. Uses bcrypt to securely compare the provided code
   * against the hashed version stored in the database.
   *
   * @param classifiedId - ID of the classified to verify access for
   * @param accessCode - Plain-text access code provided by user (from email)
   * @param accountId - Account ID for boundary enforcement
   * @returns Owner response with full classified details if access code is valid
   *
   * @throws {NotFoundError} When classified doesn't exist or belongs to different account
   * @throws {ValidationError} When access code doesn't match stored hash
   * @throws {InternalServerError} When account information cannot be retrieved
   *
   * @security Uses bcrypt.compare() for secure hash verification. Prevents timing attacks
   * by using constant-time comparison. Never logs or exposes access codes.
   *
   * @example
   * ```typescript
   * const classified = await accessService.verifyTeamsWantedAccess(
   *   456n,
   *   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // UUID from email
   *   123n
   * );
   * console.log(classified.name); // 'John Doe'
   * ```
   */
  async verifyTeamsWantedAccess(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    // Find the classified with account boundary enforcement
    const classified = await this.teamsWantedRepository.findById(classifiedId);

    if (!classified || classified.accountid !== accountId) {
      throw new NotFoundError('Classified not found');
    }

    // Verify access code using secure bcrypt comparison
    const isValid = await bcrypt.compare(accessCode, classified.accesscode);
    if (!isValid) {
      throw new ValidationError('Invalid access code');
    }

    // Get account details for response
    const account = await this.accountService.getAccountName(accountId);
    if (!account) {
      throw new InternalServerError('Failed to retrieve account information');
    }

    // Transform database record to owner response format
    return TeamsWantedResponseFormatter.transformTeamsWantedToOwnerResponse(classified, account);
  }

  /**
   * Find Teams Wanted classified by access code (for unauthenticated users)
   *
   * Allows anonymous users to retrieve their Teams Wanted classified using
   * the access code sent via email. Must check all classifieds in the account
   * since access codes are hashed and cannot be used for direct database lookup.
   *
   * @param accountId - Account ID to scope the search to
   * @param accessCode - Plain-text access code from user (originally from email)
   * @returns Owner response with full PII data if access code matches
   *
   * @throws {NotFoundError} When no classified matches the provided access code
   * @throws {InternalServerError} When account information cannot be retrieved
   *
   * @security Uses bcrypt.compare() for secure access code verification against
   * all stored hashes. This prevents timing attacks and ensures cryptographic security.
   * Never returns the access code itself, only the classified data.
   *
   * @performance Requires iteration through all account classifieds to compare
   * hashed access codes. Consider adding indexed lookup if volume becomes high.
   *
   */
  async findTeamsWantedByAccessCode(
    accountId: bigint,
    accessCode: string,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    // Find all classifieds for the account (we need to verify access code with bcrypt)
    const classifieds = await this.teamsWantedRepository.findMany({
      accountid: accountId,
    });

    // Find the classified by comparing the access code with each hashed version
    let matchedClassified: dbTeamsWanted | null = null;
    for (const classified of classifieds) {
      const isValid = await bcrypt.compare(accessCode, classified.accesscode);
      if (isValid) {
        matchedClassified = classified;
        break;
      }
    }

    if (!matchedClassified) {
      throw new NotFoundError('Teams Wanted classified not found with this access code');
    }

    // Get account details for response
    const account = await this.accountService.getAccountName(accountId);
    if (!account) {
      throw new InternalServerError('Failed to retrieve account information');
    }

    // Transform database record to response format
    // Note: This returns full PII (email, phone, birthDate) but never the accessCode
    return TeamsWantedResponseFormatter.transformTeamsWantedToOwnerResponse(
      matchedClassified,
      account,
    );
  }

  /**
   * Check if user can edit a Players Wanted classified
   *
   * Implements role-based access control for editing Players Wanted classifieds.
   * Returns true if the user is either the creator of the classified or has
   * AccountAdmin/Administrator permissions within the account.
   *
   * @param classifiedId - ID of the classified to check edit permissions for
   * @param contactId - ID of the contact requesting edit access
   * @param accountId - Account ID for boundary enforcement
   * @returns True if user can edit, false otherwise
   *
   * @security Enforces multi-level access control:
   * - Account boundary: Only users within the same account
   * - Ownership: Creator can always edit their own classified
   * - Role-based: AccountAdmin and Administrator can edit any
   *
   */
  async canEditPlayersWanted(
    classifiedId: bigint,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Get the classified to check ownership and account boundary
    const classified = await this.playersWantedRepository.findPlayersWantedById(
      classifiedId,
      accountId,
    );

    if (!classified || classified.accountid !== accountId) {
      throw new NotFoundError('Players Wanted classified not found');
    }

    // Creator can always edit their own classified
    if (classified.createdbycontactid === contactId) {
      return true;
    }

    const userRoleService = ServiceFactory.getRoleService();
    const userRoles = await userRoleService.getUserRolesByContactId(contactId, accountId);

    // Check if user has AccountAdmin role
    const hasAccountAdminRole = userRoles.contactRoles.some(
      (role) => role.roleId === 'AccountAdmin',
    );
    const hasGlobalAdminRole = userRoles.globalRoles.includes(
      ROLE_IDS[RoleNamesType.ADMINISTRATOR],
    );

    return hasAccountAdminRole || hasGlobalAdminRole;
  }

  /**
   * Check if user can delete a Players Wanted classified
   *
   * Determines if a user has permission to delete a specific Players Wanted
   * classified. Uses the same logic as canEditPlayersWanted since delete and
   * edit permissions follow the same rules.
   *
   * @param classifiedId - ID of the classified to check delete permissions for
   * @param contactId - ID of the contact requesting delete access
   * @param accountId - Account ID for boundary enforcement
   * @returns True if user can delete, false otherwise
   *
   * @security Implements same access control as editing:
   * - Creator can delete their own classified
   * - AccountAdmin and Administrator can delete any classified in their account
   *
   * ```
   */
  async canDeletePlayersWanted(
    classifiedId: bigint,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Same logic as canEdit - delete and edit permissions are equivalent
    return this.canEditPlayersWanted(classifiedId, contactId, accountId);
  }

  /**
   * Validate access code format and basic security checks
   *
   * Performs basic validation on access codes before attempting database
   * verification. Helps prevent unnecessary database operations for obviously
   * invalid access codes.
   *
   * @param accessCode - Access code to validate
   * @returns True if access code format is valid, false otherwise
   *
   * @security Performs basic format validation to reduce attack surface
   * and prevent malformed input from reaching cryptographic operations.
   *
   * @example
   * ```typescript
   * if (!accessService.isValidAccessCodeFormat('abc123')) {
   *   throw new ValidationError('Invalid access code format');
   * }
   * ```
   */
  isValidAccessCodeFormat(accessCode: string): boolean {
    // Access codes should be UUIDs generated by randomUUID()
    // Use validator library for robust UUID validation
    if (!accessCode || typeof accessCode !== 'string') {
      return false;
    }

    return validator.isUUID(accessCode);
  }

  /**
   * Log access attempt for audit trail
   *
   * Records access attempts for security auditing purposes. This helps
   * with monitoring unauthorized access attempts and security analysis.
   *
   * @param action - The action being attempted
   * @param contactId - ID of the contact attempting access (null for anonymous)
   * @param accountId - Account ID being accessed
   * @param classifiedId - ID of the classified being accessed (if applicable)
   * @param success - Whether the access attempt was successful
   * @param details - Additional details about the access attempt
   *
   * @security Creates audit trail for all access attempts, both successful and failed
   *
   * @example
   * ```typescript
   * accessService.logAccessAttempt(
   *   'verify_teams_wanted_access',
   *   null, // anonymous user
   *   123n,
   *   456n,
   *   true,
   *   { accessCodeUsed: true }
   * );
   * ```
   */
  logAccessAttempt(
    action: string,
    contactId: bigint | null,
    accountId: bigint,
    classifiedId: bigint | null = null,
    success: boolean = true,
    details: Record<string, unknown> = {},
  ): void {
    logSecurely('info', `Classified access attempt: ${action}`, {
      action,
      contactId: contactId ? String(contactId) : 'anonymous',
      accountId: String(accountId),
      classifiedId: classifiedId ? String(classifiedId) : null,
      success,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}
