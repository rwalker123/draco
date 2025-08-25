// PlayerClassified Service for Draco Sports Manager
// Orchestrator service that coordinates between specialized services following SOLID principles

import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IClassifiedListResponse,
  IPlayersWantedResponse,
  ITeamsWantedResponse,
  ITeamsWantedOwnerResponse,
  IClassifiedSearchParams,
  IPlayersWantedUpdateRequest,
} from '../interfaces/playerClassifiedInterfaces.js';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';
import { BCRYPT_CONSTANTS } from '../config/playerClassifiedConstants.js';

// Import specialized services
import { PlayerClassifiedValidationService } from './player-classified/PlayerClassifiedValidationService.js';
import { PlayerClassifiedDataService } from './player-classified/PlayerClassifiedDataService.js';
import { PlayerClassifiedEmailService } from './player-classified/PlayerClassifiedEmailService.js';
import { PlayerClassifiedAccessService } from './player-classified/PlayerClassifiedAccessService.js';

// Database record types for type safety (kept for backward compatibility)
// These types are also defined in the specialized services

/**
 * PlayerClassifiedService - Orchestrator
 *
 * Acts as a facade/orchestrator that coordinates between specialized services.
 * This service maintains the original public API while delegating specific responsibilities
 * to focused services that follow Single Responsibility Principle:
 *
 * - PlayerClassifiedValidationService: Input validation
 * - PlayerClassifiedDataService: Data access and transformation
 * - PlayerClassifiedEmailService: Email operations
 * - PlayerClassifiedAccessService: Security and permissions
 *
 * Benefits of this architecture:
 * - Each service has a single, well-defined responsibility
 * - Services are loosely coupled through dependency injection
 * - Easy to test individual components in isolation
 * - Maintains existing API for backward compatibility
 * - Follows SOLID principles (especially Single Responsibility and Dependency Inversion)
 *
 * @example
 * ```typescript
 * const service = new PlayerClassifiedService(prismaClient);
 * const classified = await service.createPlayersWanted(accountId, contactId, request);
 * ```
 */
export class PlayerClassifiedService {
  private prisma: PrismaClient;
  public validationService: PlayerClassifiedValidationService;
  private dataService: PlayerClassifiedDataService;
  public emailService: PlayerClassifiedEmailService;
  private accessService: PlayerClassifiedAccessService;

  // Configuration constants
  private readonly DEFAULT_EXPIRATION_DAYS = {
    playersWanted: 30,
    teamsWanted: 60,
  };

  private readonly MAX_EXPIRATION_DAYS = {
    playersWanted: 90,
    teamsWanted: 120,
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    // Initialize specialized services with dependency injection
    this.validationService = new PlayerClassifiedValidationService();
    this.dataService = new PlayerClassifiedDataService(prisma);
    this.emailService = new PlayerClassifiedEmailService();
    this.accessService = new PlayerClassifiedAccessService(prisma);

    // Set up service dependencies to avoid circular references
    this.accessService.setDataService(this.dataService);
  }

  // ============================================================================
  // PUBLIC API METHODS - Orchestrate calls to specialized services
  // ============================================================================

  // ============================================================================
  // PLAYERS WANTED OPERATIONS - Orchestrated through specialized services
  // ============================================================================

  /**
   * Create a new Players Wanted classified
   *
   * Creates a Players Wanted classified for authenticated account users.
   * Orchestrates validation, data transformation, creation, and response building
   * through specialized services following SOLID principles.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param contactId - ID of authenticated contact creating the classified
   * @param request - Validated Players Wanted creation request
   * @returns Newly created classified with creator and account information
   *
   * @throws {ValidationError} When request validation fails
   * @throws {InternalServerError} When database operation fails or creator/account not found
   *
   * @example
   * ```typescript
   * const classified = await service.createPlayersWanted(
   *   123n, 789n,
   *   { teamEventName: 'Spring Tournament', description: 'Need pitcher', positionsNeeded: 'P,1B' }
   * );
   * ```
   */
  async createPlayersWanted(
    accountId: bigint,
    contactId: bigint,
    request: IPlayersWantedCreateRequest,
  ): Promise<IPlayersWantedResponse> {
    // Validate input data using specialized validation service
    const validation = this.validationService.validatePlayersWantedCreateRequest(request);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Transform request to database format using data service
    const dbData = this.dataService.transformPlayersWantedCreateRequest(
      request,
      accountId,
      contactId,
    );

    // Create the classified using data service
    const classified = await this.dataService.createPlayersWantedRecord(dbData);

    // Get creator and account details for response using data service
    const [creator, account] = await Promise.all([
      this.dataService.getContactById(contactId),
      this.dataService.getAccountById(accountId),
    ]);

    if (!creator || !account) {
      throw new InternalServerError('Failed to retrieve creator or account information');
    }

    // Transform database record to response format using data service
    return this.dataService.transformPlayersWantedToResponse(classified, creator, account);
  }

  /**
   * Get Players Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Players Wanted classifieds within account boundary.
   * Delegates to data service for consistent pagination and filtering logic.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param params - Search parameters including pagination, sorting, and filtering options
   * @returns Paginated response with classified data, total count, pagination metadata, and applied filters
   *
   * @example
   * ```typescript
   * const results = await service.getPlayersWanted(123n, {
   *   page: 1, limit: 10, sortBy: 'dateCreated', sortOrder: 'desc'
   * });
   * ```
   */
  async getPlayersWanted(
    accountId: bigint,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<IPlayersWantedResponse>> {
    // Delegate to specialized data service
    return await this.dataService.getPlayersWanted(accountId, params);
  }

  /**
   * Get Teams Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Teams Wanted classifieds for authenticated account members.
   * Delegates to data service which handles PII exposure securely within account boundary.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param params - Search parameters including pagination, sorting, and filtering options
   * @returns Paginated response with classified data including PII for account members
   *
   * @security Data service ensures PII is only exposed to authorized account members
   *
   * @example
   * ```typescript
   * const results = await service.getTeamsWanted(123n, { page: 2, limit: 20 });
   * ```
   */
  async getTeamsWanted(
    accountId: bigint,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<ITeamsWantedResponse>> {
    // Delegate to specialized data service
    return await this.dataService.getTeamsWanted(accountId, params);
  }

  // ============================================================================
  // TEAMS WANTED OPERATIONS - Orchestrated through specialized services
  // ============================================================================

  /**
   * Create a new Teams Wanted classified (public/anonymous)
   *
   * Creates a Teams Wanted classified for anonymous users through coordinated services.
   * Orchestrates validation, secure access code generation, database creation, and email verification.
   *
   * @param accountId - Account ID where the classified will be created
   * @param request - Validated request data containing player information and preferences
   * @returns Owner response object with classified details (no access code exposed)
   *
   * @throws {ValidationError} When request data validation fails
   * @throws {InternalServerError} When database operation or email sending fails
   *
   * @example
   * ```typescript
   * const classified = await service.createTeamsWanted(123n, {
   *   name: 'John Doe', email: 'john@example.com', positionsPlayed: 'SS,2B'
   * });
   * ```
   */
  async createTeamsWanted(
    accountId: bigint,
    request: ITeamsWantedCreateRequest,
  ): Promise<ITeamsWantedOwnerResponse> {
    // Validate input data using validation service
    const validation = this.validationService.validateTeamsWantedCreateRequest(request);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Generate secure access code
    const accessCode = randomUUID();
    const hashedAccessCode = await bcrypt.hash(
      accessCode,
      BCRYPT_CONSTANTS.ACCESS_CODE_SALT_ROUNDS,
    );

    // Transform request to database format using data service
    const dbData = this.dataService.transformTeamsWantedCreateRequest(
      request,
      accountId,
      hashedAccessCode,
    );

    // Create the classified using data service
    const classified = await this.dataService.createTeamsWantedRecord(dbData);

    // Get account details for response using data service
    const account = await this.dataService.getAccountById(accountId);
    if (!account) {
      throw new InternalServerError('Failed to retrieve account information');
    }

    // Send verification email with access code using email service (safe method)
    await this.emailService.sendVerificationEmailSafe(
      classified.id,
      request.email,
      accessCode,
      account,
      request,
    );

    // Transform database record to response format using data service
    return this.dataService.transformTeamsWantedToOwnerResponse(classified, account);
  }

  /**
   * Verify access code for Teams Wanted classified
   *
   * Authenticates anonymous users using access code through specialized access service.
   * Delegates security verification to ensure consistent access control implementation.
   *
   * @param classifiedId - ID of the classified to verify access for
   * @param accessCode - Plain-text access code provided by user (from email)
   * @param accountId - Account ID for boundary enforcement
   * @returns Owner response with full classified details if access code is valid
   *
   * @example
   * ```typescript
   * const classified = await service.verifyTeamsWantedAccess(456n, 'uuid-code', 123n);
   * ```
   */
  async verifyTeamsWantedAccess(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<ITeamsWantedOwnerResponse> {
    // Delegate to specialized access service for security verification
    return await this.accessService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
  }

  /**
   * Update Teams Wanted classified using access code
   *
   * Updates a Teams Wanted classified through coordinated validation and access services.
   * First verifies access code, validates all update fields, then performs database update.
   *
   * @param classifiedId - ID of the classified to update
   * @param accessCode - Plain-text access code for authentication
   * @param updateData - Partial update data - only provided fields will be updated
   * @param accountId - Account ID for boundary enforcement
   * @returns Updated classified with owner response format
   *
   * @example
   * ```typescript
   * const updated = await service.updateTeamsWanted(
   *   456n, 'uuid-code', { phone: '555-9999' }, 123n
   * );
   * ```
   */
  async updateTeamsWanted(
    classifiedId: bigint,
    accessCode: string,
    updateData: Partial<ITeamsWantedCreateRequest>,
    accountId: bigint,
  ): Promise<ITeamsWantedOwnerResponse> {
    // If access code is provided and not empty, verify it (anonymous user path)
    if (accessCode && accessCode.trim() !== '') {
      await this.accessService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
    } else {
      // For admin users (empty access code), just verify the classified exists and belongs to account
      const classified = await this.dataService.findTeamsWantedById(classifiedId, accountId);
      if (!classified) {
        throw new NotFoundError('Teams Wanted classified not found');
      }
    }

    // Validate update data using validation service for each provided field
    for (const [field, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const error = this.validationService.validateTeamsWantedField(field, value);
        if (error) {
          throw new ValidationError(error);
        }
      }
    }

    // Prepare update data with proper Prisma type safety
    const dbUpdateData: Prisma.teamswantedclassifiedUpdateInput = {};

    if (updateData.name) dbUpdateData.name = updateData.name;
    if (updateData.email) dbUpdateData.email = updateData.email;
    if (updateData.phone) dbUpdateData.phone = updateData.phone;
    if (updateData.experience) dbUpdateData.experience = updateData.experience;
    if (updateData.positionsPlayed) dbUpdateData.positionsplayed = updateData.positionsPlayed;
    if (updateData.birthDate) {
      const parsedBirthDate = DateUtils.parseDateForDatabase(updateData.birthDate);
      if (parsedBirthDate) {
        dbUpdateData.birthdate = parsedBirthDate;
      }
    }

    // Update the classified using data service
    const updatedClassified = await this.dataService.updateTeamsWanted(classifiedId, dbUpdateData);

    // Get account details for response using data service
    const account = await this.dataService.getAccountById(accountId);
    if (!account) {
      throw new InternalServerError('Failed to retrieve account information');
    }

    // Transform database record to response format using data service
    return this.dataService.transformTeamsWantedToOwnerResponse(updatedClassified, account);
  }

  /**
   * Delete Teams Wanted classified using access code or admin permissions
   *
   * Allows both anonymous users (with access code) and authenticated admin users
   * to delete Teams Wanted classifieds through coordinated access verification and data deletion services.
   *
   * @param classifiedId - ID of the classified to delete
   * @param accessCode - Plain-text access code for authentication (empty string for admin users)
   * @param accountId - Account ID for boundary enforcement
   *
   * @example
   * ```typescript
   * // Anonymous user with access code
   * await service.deleteTeamsWanted(456n, 'uuid-access-code', 123n);
   *
   * // Admin user without access code
   * await service.deleteTeamsWanted(456n, '', 123n);
   * ```
   */
  async deleteTeamsWanted(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<void> {
    // If access code is provided and not empty, verify it (anonymous user path)
    if (accessCode && accessCode.trim() !== '') {
      await this.accessService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
    } else {
      // For admin users (empty access code), just verify the classified exists and belongs to account
      const classified = await this.dataService.findTeamsWantedById(classifiedId, accountId);
      if (!classified) {
        throw new NotFoundError('Teams Wanted classified not found');
      }
    }

    // Delete the classified using data service
    await this.dataService.deleteTeamsWanted(classifiedId);
  }

  /**
   * Delete Players Wanted classified
   *
   * Deletes a Players Wanted classified with proper authorization checking through
   * access service and data deletion through data service.
   *
   * @param classifiedId - ID of the classified to delete
   * @param accountId - Account ID for boundary enforcement
   * @param contactId - Contact ID for permission checking
   *
   * @example
   * ```typescript
   * await service.deletePlayersWanted(456n, 123n, 789n);
   * ```
   */
  async deletePlayersWanted(
    classifiedId: bigint,
    accountId: bigint,
    _contactId: bigint,
  ): Promise<void> {
    // Verify the classified exists and belongs to account using data service
    const classified = await this.dataService.findPlayersWantedById(classifiedId, accountId);
    if (!classified) {
      throw new NotFoundError('Classified not found');
    }

    // Delete the classified using data service
    await this.dataService.deletePlayersWanted(classifiedId);
  }

  /**
   * Update Players Wanted classified
   *
   * Updates a Players Wanted classified through coordinated validation, access control,
   * and data services following SOLID principles.
   *
   * @param classifiedId - ID of the classified to update
   * @param accountId - Account ID for boundary enforcement
   * @param contactId - ID of the requesting contact for permission checking
   * @param request - Validated update request with new field values
   * @returns Updated classified with creator and account information
   *
   * @example
   * ```typescript
   * const updated = await service.updatePlayersWanted(
   *   456n, 123n, 789n,
   *   { description: 'Updated description', positionsNeeded: 'P,1B' }
   * );
   * ```
   */
  async updatePlayersWanted(
    classifiedId: bigint,
    accountId: bigint,
    contactId: bigint,
    request: IPlayersWantedUpdateRequest,
  ): Promise<IPlayersWantedResponse> {
    // Validate input data using validation service
    const validation = this.validationService.validatePlayersWantedUpdateRequest(request);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Check if user can edit this classified using access service
    const canEdit = await this.accessService.canEditPlayersWanted(
      classifiedId,
      contactId,
      accountId,
    );
    if (!canEdit) {
      throw new ValidationError('Insufficient permissions to edit this classified');
    }

    // Verify classified exists and belongs to account using data service
    const existingClassified = await this.dataService.findPlayersWantedById(
      classifiedId,
      accountId,
    );
    if (!existingClassified) {
      throw new NotFoundError('Players Wanted classified not found');
    }

    // Prepare update data
    const updateData: Prisma.playerswantedclassifiedUpdateInput = {};
    if (request.teamEventName !== undefined) {
      updateData.teameventname = request.teamEventName;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.positionsNeeded !== undefined) {
      updateData.positionsneeded = request.positionsNeeded;
    }

    // Update the classified using data service
    const updatedClassified = await this.dataService.updatePlayersWanted(classifiedId, updateData);

    // Transform database record to response format using data service
    return this.dataService.transformPlayersWantedToResponse(
      updatedClassified,
      updatedClassified.contacts,
      updatedClassified.accounts,
    );
  }

  /**
   * Check if user can edit a Players Wanted classified
   *
   * Delegates to specialized access service for consistent permission checking
   * across all classified operations.
   *
   * @param classifiedId - ID of the classified to check edit permissions for
   * @param contactId - ID of the contact requesting edit access
   * @param accountId - Account ID for boundary enforcement
   * @returns True if user can edit, false otherwise
   *
   * @example
   * ```typescript
   * const canEdit = await service.canEditPlayersWanted(456n, 789n, 123n);
   * ```
   */
  async canEditPlayersWanted(
    classifiedId: bigint,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Delegate to specialized access service
    return await this.accessService.canEditPlayersWanted(classifiedId, contactId, accountId);
  }

  /**
   * Check if user can delete a Players Wanted classified
   *
   * Delegates to specialized access service for consistent permission checking.
   *
   * @param classifiedId - ID of the classified to check delete permissions for
   * @param contactId - ID of the contact requesting delete access
   * @param accountId - Account ID for boundary enforcement
   * @returns True if user can delete, false otherwise
   *
   * @example
   * ```typescript
   * const canDelete = await service.canDeletePlayersWanted(456n, 789n, 123n);
   * ```
   */
  async canDeletePlayersWanted(
    classifiedId: bigint,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Delegate to specialized access service
    return await this.accessService.canDeletePlayersWanted(classifiedId, contactId, accountId);
  }

  /**
   * Find Teams Wanted classified by access code (for unauthenticated users)
   *
   * Delegates to specialized access service for secure access code verification.
   *
   * @param accountId - Account ID to scope the search to
   * @param accessCode - Plain-text access code from user (originally from email)
   * @returns Owner response with full PII data if access code matches
   *
   * @example
   * ```typescript
   * const classified = await service.findTeamsWantedByAccessCode(123n, 'uuid-from-email');
   * ```
   */
  async findTeamsWantedByAccessCode(
    accountId: bigint,
    accessCode: string,
  ): Promise<ITeamsWantedOwnerResponse> {
    // Delegate to specialized access service for secure verification
    return await this.accessService.findTeamsWantedByAccessCode(accountId, accessCode);
  }
}
