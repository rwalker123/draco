import { PrismaClient, Prisma, teamswantedclassified } from '#prisma/client';
import { DateUtils } from '../../utils/dateUtils.js';
import { PaginationHelper } from '../../utils/pagination.js';
import { DEFAULT_VALUES } from '../../config/playerClassifiedConstants.js';
import { NotFoundError } from '../../utils/customErrors.js';
import { ITeamsWantedRepository } from '../interfaces/index.js';
import {
  dbClassifiedPageResponse,
  dbClassifiedSearchFilters,
  dbClassifiedSearchParams,
  dbContactInfo,
  dbTeamsWanted,
  dbTeamsWantedPublic,
} from '../types/dbTypes.js';

/**
 * PrismaTeamsWantedRepository
 */
export class PrismaTeamsWantedRepository implements ITeamsWantedRepository {
  constructor(private prisma: PrismaClient) {}
  /**
   * Find a Teams Wanted classified by its ID.
   *
   * @param id - The ID of the classified to find
   * @returns The classified record or null if not found
   */
  async findById(id: bigint): Promise<teamswantedclassified | null> {
    return await this.prisma.teamswantedclassified.findUnique({
      where: { id },
    });
  }

  /**
   * Find many Teams Wanted classifieds with optional filtering.
   *
   * @param where - Optional filter object
   * @returns Array of classified records
   */
  async findMany(where?: Record<string, unknown>): Promise<teamswantedclassified[]> {
    // Type narrowing for Prisma where input
    const prismaWhere = where as Prisma.teamswantedclassifiedWhereInput | undefined;
    return await this.prisma.teamswantedclassified.findMany({
      where: prismaWhere,
    });
  }

  async create(data: Partial<teamswantedclassified>): Promise<teamswantedclassified> {
    return this.prisma.teamswantedclassified.create({
      data: data as Parameters<typeof this.prisma.teamswantedclassified.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<teamswantedclassified>): Promise<teamswantedclassified> {
    return this.prisma.teamswantedclassified.update({
      where: { id: id },
      data,
    });
  }

  async delete(id: bigint): Promise<teamswantedclassified> {
    return this.prisma.teamswantedclassified.delete({
      where: { id: id },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.teamswantedclassified.count({
      where: where as Prisma.teamswantedclassifiedWhereInput | undefined,
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
   */
  async createTeamsWantedRecord(
    dbData: Prisma.teamswantedclassifiedUncheckedCreateInput,
  ): Promise<dbTeamsWanted> {
    return await this.prisma.teamswantedclassified.create({
      data: dbData,
    });
  }

  /**
   * Get Teams Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Teams Wanted classifieds for authenticated account members.
   * This method exposes PII data (email, phone, birth date) to authorized users within
   * the same account boundary, following role-based access control principles.
   *
   */
  async getTeamsWanted(
    accountId: bigint,
    params: dbClassifiedSearchParams,
  ): Promise<dbClassifiedPageResponse<dbTeamsWantedPublic>> {
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
    const { data, total } = await PaginationHelper.executePaginatedQuery<dbTeamsWantedPublic>(
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
    );

    // Build pagination info
    const pagination = PaginationHelper.createMeta(page, limit, total);

    // Build filters info
    const filters: dbClassifiedSearchFilters = {
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
   */
  async getTeamsWantedContactInfo(
    classifiedId: bigint,
    accountId: bigint,
  ): Promise<dbContactInfo | null> {
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
  ): Promise<dbTeamsWanted | null> {
    return await this.prisma.teamswantedclassified.findFirst({
      where: {
        id: classifiedId,
        accountid: accountId,
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
  ): Promise<dbTeamsWanted> {
    return await this.prisma.teamswantedclassified.update({
      where: { id: classifiedId },
      data: updateData,
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
  async findAllTeamsWantedByAccount(accountId: bigint): Promise<dbTeamsWanted[]> {
    return await this.prisma.teamswantedclassified.findMany({
      where: {
        accountid: accountId,
      },
    });
  }
}
