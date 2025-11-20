import { PrismaClient, Prisma, playerswantedclassified } from '#prisma/client';
import { PaginationHelper } from '../../utils/pagination.js';
import { DEFAULT_VALUES } from '../../config/playerClassifiedConstants.js';
import { IPlayersWantedRepository } from '../interfaces/index.js';
import {
  dbClassifiedPageResponse,
  dbClassifiedSearchFilters,
  dbClassifiedSearchParams,
  dbPlayersWanted,
  dbPlayersWantedWithRelations,
} from '../types/index.js';

/**
 *
 */
export class PrismaPlayersWantedRepository implements IPlayersWantedRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<playerswantedclassified | null> {
    return this.prisma.playerswantedclassified.findUnique({
      where: { id },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<playerswantedclassified[]> {
    return this.prisma.playerswantedclassified.findMany({
      where,
    });
  }

  async create(data: Partial<playerswantedclassified>): Promise<playerswantedclassified> {
    return this.prisma.playerswantedclassified.create({
      data: data as Parameters<typeof this.prisma.playerswantedclassified.create>[0]['data'],
    });
  }

  async update(
    id: bigint,
    data: Partial<playerswantedclassified>,
  ): Promise<playerswantedclassified> {
    return this.prisma.playerswantedclassified.update({
      where: { id },
      data,
    });
  }

  async delete(id: bigint): Promise<playerswantedclassified> {
    return this.prisma.playerswantedclassified.delete({
      where: { id },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.playerswantedclassified.count({
      where,
    });
  }

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
   */
  async createPlayersWantedRecord(
    dbData: Prisma.playerswantedclassifiedUncheckedCreateInput,
  ): Promise<dbPlayersWanted> {
    return await this.prisma.playerswantedclassified.create({
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
   */
  async getPlayersWanted(
    accountId: bigint,
    params: dbClassifiedSearchParams,
  ): Promise<dbClassifiedPageResponse<playerswantedclassified>> {
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
    const { data, total } = await PaginationHelper.executePaginatedQuery<playerswantedclassified>(
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
    );

    // Build pagination info
    const pagination = PaginationHelper.createMeta(page, limit, total);

    // Build filters info
    const filters: dbClassifiedSearchFilters = {
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
   */
  async findPlayersWantedById(
    classifiedId: bigint,
    accountId: bigint,
  ): Promise<dbPlayersWanted | null> {
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
  ): Promise<dbPlayersWantedWithRelations | null> {
    const updated = await this.prisma.playerswantedclassified.update({
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

    return updated;
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
   */
  async deletePlayersWanted(classifiedId: bigint): Promise<void> {
    await this.prisma.playerswantedclassified.delete({
      where: { id: classifiedId },
    });
  }
}
