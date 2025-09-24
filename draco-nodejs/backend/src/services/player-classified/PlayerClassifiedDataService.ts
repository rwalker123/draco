// PlayerClassifiedDataService for Draco Sports Manager
// Single responsibility: Handles data transformation and basic CRUD operations for player classifieds

import { PrismaClient, Prisma } from '@prisma/client';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IPlayersWantedResponse,
  ITeamsWantedResponse,
  ITeamsWantedPublicResponse,
  ITeamsWantedOwnerResponse,
  IClassifiedListResponse,
  IClassifiedSearchParams,
  IClassifiedSearchFilters,
} from '../../interfaces/playerClassifiedInterfaces.js';
import { DateUtils } from '../../utils/dateUtils.js';
import { PaginationHelper } from '../../utils/pagination.js';
import { DEFAULT_VALUES } from '../../config/playerClassifiedConstants.js';
import { getContactPhotoUrl } from '../../config/logo.js';
import { NotFoundError } from '../../utils/customErrors.js';

// Database record types for type safety
interface PlayersWantedDbRecord {
  id: bigint;
  accountid: bigint;
  datecreated: Date;
  createdbycontactid: bigint;
  teameventname: string;
  description: string;
  positionsneeded: string;
}

interface TeamsWantedDbRecord {
  id: bigint;
  accountid: bigint;
  datecreated: Date;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsplayed: string;
  accesscode: string;
  birthdate: Date;
}

interface ContactDbRecord {
  id: bigint;
  firstname: string;
  lastname: string;
}

interface AccountDbRecord {
  id: bigint;
  name: string;
}

interface PlayersWantedWithRelations {
  id: bigint;
  accountid: bigint;
  datecreated: Date;
  createdbycontactid: bigint;
  teameventname: string;
  description: string;
  positionsneeded: string;
  contacts: ContactDbRecord;
  accounts: AccountDbRecord;
}

/**
 * PlayerClassifiedDataService
 *
 * Handles data transformation and basic CRUD operations for player classifieds including:
 * - Data transformation between database records and API responses
 * - Database query operations with proper type safety
 * - Pagination and filtering support
 * - Account boundary enforcement for multi-tenant security
 *
 * This service follows Single Responsibility Principle by focusing solely on data access
 * and transformation. It doesn't handle validation, business logic, or external services.
 *
 * @example
 * ```typescript
 * const dataService = new PlayerClassifiedDataService(prismaClient);
 * const classified = await dataService.createPlayersWanted(accountId, contactId, dbData);
 * const response = dataService.transformPlayersWantedToResponse(classified, creator, account);
 * ```
 */
export class PlayerClassifiedDataService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================================================
  // TRANSFORM METHODS (Database <-> Interface)
  // ============================================================================

  /**
   * Transform database Players Wanted record to interface response
   *
   * Converts internal database record format to the standardized API response format,
   * formatting dates and restructuring data to match interface requirements.
   *
   * @param dbRecord - Raw database record from playerswantedclassified table
   * @param creator - Contact record of the user who created the classified
   * @param account - Account record that owns the classified
   * @returns Standardized Players Wanted response object with formatted dates
   *
   * @example
   * ```typescript
   * const response = dataService.transformPlayersWantedToResponse(
   *   dbRecord, creatorContact, accountRecord
   * );
   * console.log(response.dateCreated); // '2024-01-15T10:30:00Z'
   * ```
   */
  transformPlayersWantedToResponse(
    dbRecord: PlayersWantedDbRecord,
    creator: ContactDbRecord,
    account: AccountDbRecord,
  ): IPlayersWantedResponse {
    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      createdByContactId: dbRecord.createdbycontactid.toString(),
      teamEventName: dbRecord.teameventname,
      description: dbRecord.description,
      positionsNeeded: dbRecord.positionsneeded,
      creator: {
        id: creator.id.toString(),
        firstName: creator.firstname,
        lastName: creator.lastname,
        photoUrl: getContactPhotoUrl(account.id.toString(), creator.id.toString()),
      },
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to interface response (for authenticated account members)
   *
   * Converts internal database record to standardized API response format for authenticated users
   * within the same account. This method exposes PII data (email, phone, birth date) but never
   * the access code for security reasons.
   *
   * @param dbRecord - Raw database record from teamswantedclassified table
   * @param account - Account record that owns the classified
   * @returns Standardized Teams Wanted response object with PII data included
   *
   * @security This method exposes PII data and should only be called for authenticated
   * users with appropriate permissions within the same account boundary.
   *
   * @example
   * ```typescript
   * const response = dataService.transformTeamsWantedToResponse(dbRecord, accountRecord);
   * console.log(response.email); // 'player@example.com' - PII exposed for account members
   * ```
   */
  transformTeamsWantedToResponse(
    dbRecord: TeamsWantedDbRecord,
    account: AccountDbRecord,
  ): ITeamsWantedResponse {
    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      birthDate: DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate),
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to public response (excludes contact info)
   *
   * Converts database record to public API response format that excludes sensitive
   * PII data (email, phone). This method is used for list responses where contact
   * information should not be exposed until explicitly requested.
   *
   * @param dbRecord - Raw database record from teamswantedclassified table
   * @param account - Account record that owns the classified
   * @returns Public Teams Wanted response object without PII data
   *
   * @security This method excludes email and phone for privacy protection.
   * Contact information must be requested separately through the contact endpoint.
   *
   * @example
   * ```typescript
   * const publicResponse = dataService.transformTeamsWantedToPublicResponse(dbRecord, account);
   * console.log(publicResponse.email); // undefined - PII not exposed
   * console.log(publicResponse.name); // 'John Doe' - non-PII data included
   * ```
   */
  transformTeamsWantedToPublicResponse(
    dbRecord: TeamsWantedDbRecord,
    account: AccountDbRecord,
  ): ITeamsWantedPublicResponse {
    const birthDateForResponse = DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate);
    const age = birthDateForResponse !== null ? DateUtils.calculateAge(birthDateForResponse) : null;

    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      age,
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to owner response (excludes accessCode for security)
   *
   * Converts database record to response format for the classified owner (person who created it).
   * This transformation includes all personal information but never exposes the hashed access code
   * to prevent security vulnerabilities.
   *
   * @param dbRecord - Raw database record from teamswantedclassified table
   * @param account - Account record that owns the classified
   * @returns Owner response object with full PII but no access code
   *
   * @security The access code is never included in any response to prevent
   * unauthorized access. Only the original plain-text code is sent via email.
   *
   * @example
   * ```typescript
   * const ownerResponse = dataService.transformTeamsWantedToOwnerResponse(dbRecord, account);
   * console.log(ownerResponse.email); // 'owner@example.com'
   * console.log(ownerResponse.accessCode); // undefined - never exposed
   * ```
   */
  transformTeamsWantedToOwnerResponse(
    dbRecord: TeamsWantedDbRecord,
    account: AccountDbRecord,
  ): ITeamsWantedOwnerResponse {
    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      birthDate: DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate),
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  /**
   * Transform interface request to database create data
   *
   * Converts API request format to Prisma database input format for creating
   * Players Wanted classifieds. Maps interface field names to database column names
   * and adds audit fields (creation date, account/contact IDs).
   *
   * @param request - Validated API request data from client
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param contactId - ID of the authenticated contact creating the classified
   * @returns Prisma input object ready for database insertion
   *
   * @example
   * ```typescript
   * const dbData = dataService.transformPlayersWantedCreateRequest(
   *   { teamEventName: 'Spring Tournament', description: 'Need pitcher', positionsNeeded: 'P' },
   *   123n,
   *   456n
   * );
   * // Returns: { accountid: 123n, createdbycontactid: 456n, datecreated: Date, ... }
   * ```
   */
  transformPlayersWantedCreateRequest(
    request: IPlayersWantedCreateRequest,
    accountId: bigint,
    contactId: bigint,
  ): Prisma.playerswantedclassifiedUncheckedCreateInput {
    return {
      accountid: accountId,
      datecreated: new Date(),
      createdbycontactid: contactId,
      teameventname: request.teamEventName,
      description: request.description,
      positionsneeded: request.positionsNeeded,
    };
  }

  /**
   * Transform interface request to database create data
   *
   * Converts API request to Prisma database input format for creating Teams Wanted classifieds.
   * This method handles the security-critical access code storage and date parsing,
   * ensuring proper data formatting and validation.
   *
   * @param request - Validated API request data from anonymous/public user
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param hashedAccessCode - Pre-hashed access code for secure storage (never store plain text)
   * @returns Prisma input object ready for database insertion
   *
   * @security The access code must be pre-hashed using bcrypt before calling this method.
   * Never store plain-text access codes in the database.
   *
   * @example
   * ```typescript
   * const hashedCode = await bcrypt.hash(accessCode, BCRYPT_CONSTANTS.ACCESS_CODE_SALT_ROUNDS);
   * const dbData = dataService.transformTeamsWantedCreateRequest(request, 123n, hashedCode);
   * ```
   */
  transformTeamsWantedCreateRequest(
    request: ITeamsWantedCreateRequest,
    accountId: bigint,
    hashedAccessCode: string,
  ): Prisma.teamswantedclassifiedUncheckedCreateInput {
    return {
      accountid: accountId,
      datecreated: new Date(),
      name: request.name,
      email: request.email,
      phone: request.phone,
      experience: request.experience,
      positionsplayed: request.positionsPlayed,
      accesscode: hashedAccessCode,
      birthdate:
        DateUtils.parseDateForDatabase(request.birthDate) || DEFAULT_VALUES.DEFAULT_BIRTH_DATE,
    };
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new Players Wanted classified in database
   *
   * Creates a Players Wanted database record with proper audit trail.
   * This method only handles the database operation and doesn't include
   * business logic, validation, or external service calls.
   *
   * @param dbData - Prisma input object for database creation
   * @returns Newly created database record
   *
   * @throws {InternalServerError} When database operation fails
   *
   * @example
   * ```typescript
   * const dbData = dataService.transformPlayersWantedCreateRequest(request, accountId, contactId);
   * const created = await dataService.createPlayersWantedRecord(dbData);
   * ```
   */
  async createPlayersWantedRecord(
    dbData: Prisma.playerswantedclassifiedUncheckedCreateInput,
  ): Promise<PlayersWantedDbRecord> {
    return await this.prisma.playerswantedclassified.create({
      data: dbData,
    });
  }

  /**
   * Create a new Teams Wanted classified in database
   *
   * Creates a Teams Wanted database record with hashed access code.
   * This method only handles the database operation without business logic.
   *
   * @param dbData - Prisma input object for database creation
   * @returns Newly created database record
   *
   * @throws {InternalServerError} When database operation fails
   *
   * @example
   * ```typescript
   * const dbData = dataService.transformTeamsWantedCreateRequest(request, accountId, hashedCode);
   * const created = await dataService.createTeamsWantedRecord(dbData);
   * ```
   */
  async createTeamsWantedRecord(
    dbData: Prisma.teamswantedclassifiedUncheckedCreateInput,
  ): Promise<TeamsWantedDbRecord> {
    return await this.prisma.teamswantedclassified.create({
      data: dbData,
    });
  }

  /**
   * Get Players Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Players Wanted classifieds within account boundary.
   * Supports sorting, pagination, and filtering while maintaining data security through
   * account isolation. Uses the generic pagination helper for consistent pagination logic.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param params - Search parameters including pagination, sorting, and filtering options
   * @returns Paginated response with classified data, total count, pagination metadata, and applied filters
   *
   * @throws {ValidationError} When invalid pagination parameters are provided
   * @throws {InternalServerError} When database query fails
   *
   * @example
   * ```typescript
   * const results = await dataService.getPlayersWanted(123n, {
   *   page: 1,
   *   limit: 10,
   *   sortBy: 'dateCreated',
   *   sortOrder: 'desc'
   * });
   * console.log(results.data.length); // Up to 10 classified listings
   * console.log(results.pagination.totalPages); // Total pages available
   * ```
   */
  async getPlayersWanted(
    accountId: bigint,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<IPlayersWantedResponse>> {
    const {
      page = DEFAULT_VALUES.DEFAULT_PAGE,
      limit = DEFAULT_VALUES.DEFAULT_LIMIT,
      sortBy = DEFAULT_VALUES.DEFAULT_SORT_BY,
      sortOrder = DEFAULT_VALUES.DEFAULT_SORT_ORDER,
    } = params;

    // Build where clause with proper Prisma type safety
    const where: Prisma.playerswantedclassifiedWhereInput = {
      accountid: accountId,
    };

    // Build order by clause with proper Prisma type safety
    const orderBy: Prisma.playerswantedclassifiedOrderByWithRelationInput = {
      datecreated: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Override with specific sort field if provided
    switch (sortBy) {
      case 'dateCreated':
        orderBy.datecreated = sortOrder === 'asc' ? 'asc' : 'desc';
        break;
      default:
        orderBy.datecreated = 'desc';
        break;
    }

    // Execute query with pagination using generic helper
    const { data, total } = await PaginationHelper.executePaginatedQuery<IPlayersWantedResponse>(
      () =>
        this.prisma.playerswantedclassified.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            contacts: {
              select: { id: true, firstname: true, lastname: true },
            },
            accounts: {
              select: { id: true, name: true },
            },
          },
        }),
      () => this.prisma.playerswantedclassified.count({ where }),
      (classifications) =>
        (classifications as PlayersWantedWithRelations[]).map((c) =>
          this.transformPlayersWantedToResponse(c, c.contacts, c.accounts),
        ),
    );

    // Build pagination info
    const pagination = PaginationHelper.createMeta(page, limit, total);

    // Build filters info
    const filters: IClassifiedSearchFilters = {
      type: 'players',
      positions: [],
      experience: [],
      dateRange: { from: null, to: null },
      searchQuery: params.searchQuery || null,
    };

    return {
      data,
      total,
      pagination,
      filters,
    };
  }

  /**
   * Get Teams Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Teams Wanted classifieds for authenticated account members.
   * This method exposes PII data (email, phone, birth date) to authorized users within
   * the same account boundary, following role-based access control principles.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param params - Search parameters including pagination, sorting, and filtering options
   * @returns Paginated response with classified data including PII for account members
   *
   * @throws {ValidationError} When invalid pagination parameters are provided
   * @throws {InternalServerError} When database query fails
   *
   * @security This method exposes PII data and should only be called for authenticated
   * users with appropriate permissions within the account boundary.
   *
   * @example
   * ```typescript
   * const results = await dataService.getTeamsWanted(123n, {
   *   page: 2,
   *   limit: 20,
   *   sortOrder: 'asc'
   * });
   * console.log(results.data[0].email); // PII exposed for account members
   * ```
   */
  async getTeamsWanted(
    accountId: bigint,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<ITeamsWantedPublicResponse>> {
    const {
      page = DEFAULT_VALUES.DEFAULT_PAGE,
      limit = DEFAULT_VALUES.DEFAULT_LIMIT,
      sortBy = DEFAULT_VALUES.DEFAULT_SORT_BY,
      sortOrder = DEFAULT_VALUES.DEFAULT_SORT_ORDER,
    } = params;

    // Build where clause with proper Prisma type safety
    const where: Prisma.teamswantedclassifiedWhereInput = {
      accountid: accountId,
    };

    // Build order by clause with proper Prisma type safety
    const orderBy: Prisma.teamswantedclassifiedOrderByWithRelationInput = {
      datecreated: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Override with specific sort field if provided
    switch (sortBy) {
      case 'dateCreated':
        orderBy.datecreated = sortOrder === 'asc' ? 'asc' : 'desc';
        break;
      default:
        orderBy.datecreated = 'desc';
        break;
    }

    // Execute query with pagination using generic helper
    const { data, total } =
      await PaginationHelper.executePaginatedQuery<ITeamsWantedPublicResponse>(
        () =>
          this.prisma.teamswantedclassified.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
              accounts: {
                select: { id: true, name: true },
              },
            },
          }),
        () => this.prisma.teamswantedclassified.count({ where }),
        (classifications) =>
          (classifications as (TeamsWantedDbRecord & { accounts: AccountDbRecord })[]).map((c) =>
            this.transformTeamsWantedToPublicResponse(c, c.accounts),
          ),
      );

    // Build pagination info
    const pagination = PaginationHelper.createMeta(page, limit, total);

    // Build filters info
    const filters: IClassifiedSearchFilters = {
      type: 'teams',
      positions: [],
      experience: [],
      dateRange: { from: null, to: null },
      searchQuery: params.searchQuery || null,
    };

    return {
      data,
      total,
      pagination,
      filters,
    };
  }

  /**
   * Get Teams Wanted contact information for a specific classified
   *
   * Retrieves only contact information (email and phone) for a specific Teams Wanted
   * classified within the account boundary. This method provides secure, on-demand access
   * to sensitive PII data while maintaining account isolation and access control.
   *
   * @param classifiedId - ID of the Teams Wanted classified
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @returns Contact information object with email and phone
   *
   * @throws {NotFoundError} When classified is not found or not accessible within account boundary
   * @throws {ValidationError} When parameters are invalid
   *
   * @security Only returns contact info for classifieds within the specified account boundary.
   * This prevents cross-account data exposure and maintains tenant isolation.
   *
   * @example
   * ```typescript
   * const contactInfo = await dataService.getTeamsWantedContactInfo(123n, 456n);
   * console.log(contactInfo); // { email: 'player@example.com', phone: '+1234567890' }
   * ```
   */
  async getTeamsWantedContactInfo(
    classifiedId: bigint,
    accountId: bigint,
  ): Promise<{ email: string; phone: string; birthDate: string | null }> {
    const classified = await this.prisma.teamswantedclassified.findFirst({
      where: {
        id: classifiedId,
        accountid: accountId, // Enforce account boundary
      },
      select: {
        email: true,
        phone: true,
        birthdate: true,
      },
    });

    if (!classified) {
      throw new NotFoundError('Teams Wanted classified not found or not accessible');
    }

    return {
      email: classified.email,
      phone: classified.phone,
      birthDate: DateUtils.formatDateOfBirthForResponse(classified.birthdate),
    };
  }

  /**
   * Get contact information by ID
   *
   * Retrieves contact information for response building. Used when creating
   * or updating classifieds to include creator information in responses.
   *
   * @param contactId - ID of the contact to retrieve
   * @returns Contact record or null if not found
   *
   * @example
   * ```typescript
   * const creator = await dataService.getContactById(contactId);
   * if (!creator) {
   *   throw new InternalServerError('Creator information not found');
   * }
   * ```
   */
  async getContactById(contactId: bigint): Promise<ContactDbRecord | null> {
    return await this.prisma.contacts.findUnique({
      where: { id: contactId },
      select: { id: true, firstname: true, lastname: true },
    });
  }

  /**
   * Get account information by ID
   *
   * Retrieves account information for response building. Used throughout
   * classified operations to include account details in API responses.
   *
   * @param accountId - ID of the account to retrieve
   * @returns Account record or null if not found
   *
   * @example
   * ```typescript
   * const account = await dataService.getAccountById(accountId);
   * if (!account) {
   *   throw new InternalServerError('Account information not found');
   * }
   * ```
   */
  async getAccountById(accountId: bigint): Promise<AccountDbRecord | null> {
    return await this.prisma.accounts.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    });
  }

  /**
   * Find Teams Wanted classified by ID and account (with boundary enforcement)
   *
   * Retrieves a Teams Wanted classified by ID while enforcing account boundary.
   * Returns null if the classified doesn't exist or belongs to a different account.
   *
   * @param classifiedId - ID of the classified to find
   * @param accountId - Account ID for boundary enforcement
   * @returns Teams Wanted record or null if not found or wrong account
   *
   * @security Enforces account boundary by including accountid in the where clause
   *
   * @example
   * ```typescript
   * const classified = await dataService.findTeamsWantedById(456n, 123n);
   * if (!classified) {
   *   throw new NotFoundError('Classified not found');
   * }
   * ```
   */
  async findTeamsWantedById(
    classifiedId: bigint,
    accountId: bigint,
  ): Promise<TeamsWantedDbRecord | null> {
    return await this.prisma.teamswantedclassified.findFirst({
      where: {
        id: classifiedId,
        accountid: accountId,
      },
    });
  }

  /**
   * Find Players Wanted classified by ID and account (with boundary enforcement)
   *
   * Retrieves a Players Wanted classified by ID while enforcing account boundary.
   * Returns null if the classified doesn't exist or belongs to a different account.
   *
   * @param classifiedId - ID of the classified to find
   * @param accountId - Account ID for boundary enforcement
   * @returns Players Wanted record or null if not found or wrong account
   *
   * @security Enforces account boundary by including accountid in the where clause
   *
   * @example
   * ```typescript
   * const classified = await dataService.findPlayersWantedById(456n, 123n);
   * if (!classified) {
   *   throw new NotFoundError('Classified not found');
   * }
   * ```
   */
  async findPlayersWantedById(
    classifiedId: bigint,
    accountId: bigint,
  ): Promise<PlayersWantedDbRecord | null> {
    return await this.prisma.playerswantedclassified.findFirst({
      where: {
        id: classifiedId,
        accountid: accountId,
      },
      select: {
        createdbycontactid: true,
        accountid: true,
        id: true,
        datecreated: true,
        teameventname: true,
        description: true,
        positionsneeded: true,
      },
    });
  }

  /**
   * Update Teams Wanted classified
   *
   * Updates a Teams Wanted classified record with the provided data.
   * This method only handles the database update operation.
   *
   * @param classifiedId - ID of the classified to update
   * @param updateData - Partial update data for the classified
   * @returns Updated Teams Wanted record
   *
   * @throws {InternalServerError} When database update fails
   *
   * @example
   * ```typescript
   * const updated = await dataService.updateTeamsWanted(456n, { phone: '555-9999' });
   * ```
   */
  async updateTeamsWanted(
    classifiedId: bigint,
    updateData: Prisma.teamswantedclassifiedUpdateInput,
  ): Promise<TeamsWantedDbRecord> {
    return await this.prisma.teamswantedclassified.update({
      where: { id: classifiedId },
      data: updateData,
    });
  }

  /**
   * Update Players Wanted classified
   *
   * Updates a Players Wanted classified record with the provided data.
   * This method only handles the database update operation.
   *
   * @param classifiedId - ID of the classified to update
   * @param updateData - Partial update data for the classified
   * @returns Updated Players Wanted record with relations
   *
   * @throws {InternalServerError} When database update fails
   *
   * @example
   * ```typescript
   * const updated = await dataService.updatePlayersWanted(456n, { description: 'Updated description' });
   * ```
   */
  async updatePlayersWanted(
    classifiedId: bigint,
    updateData: Prisma.playerswantedclassifiedUpdateInput,
  ): Promise<PlayersWantedWithRelations> {
    return await this.prisma.playerswantedclassified.update({
      where: { id: classifiedId },
      data: updateData,
      include: {
        contacts: {
          select: { id: true, firstname: true, lastname: true },
        },
        accounts: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Delete Teams Wanted classified
   *
   * Permanently deletes a Teams Wanted classified from the database.
   * This method only handles the database deletion operation.
   *
   * @param classifiedId - ID of the classified to delete
   *
   * @throws {InternalServerError} When database deletion fails
   *
   * @example
   * ```typescript
   * await dataService.deleteTeamsWanted(456n);
   * ```
   */
  async deleteTeamsWanted(classifiedId: bigint): Promise<void> {
    await this.prisma.teamswantedclassified.delete({
      where: { id: classifiedId },
    });
  }

  /**
   * Delete Players Wanted classified
   *
   * Permanently deletes a Players Wanted classified from the database.
   * This method only handles the database deletion operation.
   *
   * @param classifiedId - ID of the classified to delete
   *
   * @throws {InternalServerError} When database deletion fails
   *
   * @example
   * ```typescript
   * await dataService.deletePlayersWanted(456n);
   * ```
   */
  async deletePlayersWanted(classifiedId: bigint): Promise<void> {
    await this.prisma.playerswantedclassified.delete({
      where: { id: classifiedId },
    });
  }

  /**
   * Find all Teams Wanted classifieds for account (for access code verification)
   *
   * Retrieves all Teams Wanted classifieds for an account. This is used for
   * access code verification where we need to check all classifieds since
   * access codes are hashed and cannot be used for direct lookup.
   *
   * @param accountId - Account ID to get classifieds for
   * @returns Array of Teams Wanted records
   *
   * @performance This method retrieves all classifieds for verification purposes.
   * Consider optimization if the volume becomes high.
   *
   * @example
   * ```typescript
   * const classifieds = await dataService.findAllTeamsWantedByAccount(123n);
   * // Used for access code verification loops
   * ```
   */
  async findAllTeamsWantedByAccount(accountId: bigint): Promise<TeamsWantedDbRecord[]> {
    return await this.prisma.teamswantedclassified.findMany({
      where: {
        accountid: accountId,
      },
    });
  }
}
