import { Prisma, PrismaClient, contacts } from '#prisma/client';
import {
  ActiveRosterContactFilters,
  IContactRepository,
  ContactExportOptions,
} from '../interfaces/index.js';
import {
  dbRosterPlayer,
  dbBaseContact,
  dbContactWithAccountRoles,
  dbContactWithRoleAndDetails,
  dbBirthdayContact,
  dbContactExportData,
} from '../types/dbTypes.js';
import { RoleNamesType } from '../../types/roles.js';
import { ROLE_IDS } from '../../config/roles.js';
import { ContactQueryOptions } from '../../interfaces/contactInterfaces.js';
import { PaginationHelper } from '../../utils/pagination.js';

export class PrismaContactRepository implements IContactRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<contacts | null> {
    return this.prisma.contacts.findUnique({
      where: { id: BigInt(id) },
    });
  }

  /**
   * Find a contact in a given account
   * @param contactId - The ID of the contact to find
   * @param accountId - The ID of the account to find the contact in
   * @returns The contact or null if not found
   */
  async findContactInAccount(contactId: bigint, accountId: bigint): Promise<dbBaseContact | null> {
    return this.prisma.contacts.findFirst({
      where: { id: contactId, creatoraccountid: accountId },
    });
  }

  /**
   * Find the account owner for a given account
   * @param accountId - The ID of the account to find the owner for
   * @returns The account owner or null if not found
   */
  async findAccountOwner(accountId: bigint): Promise<dbBaseContact | null> {
    // First get the account to find the owner user ID
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId },
      select: { owneruserid: true },
    });

    if (!account?.owneruserid) {
      return null;
    }

    // Then find the contact that belongs to this user and was created by this account
    return this.prisma.contacts.findFirst({
      where: {
        userid: account.owneruserid,
        creatoraccountid: accountId,
      },
    });
  }

  /**
   * Check if a contact is the account owner
   * @param contactId - The ID of the contact to check
   * @param accountId - The ID of the account to check
   * @returns True if the contact is the account owner, false otherwise
   */
  async isAccountOwner(contactId: bigint, accountId: bigint): Promise<boolean> {
    const contact = await this.findAccountOwner(accountId);
    if (!contact) {
      return false;
    }
    return contact.creatoraccountid === contactId;
  }

  async findMany(where?: Prisma.contactsWhereInput): Promise<contacts[]> {
    return this.prisma.contacts.findMany({ where });
  }

  async create(data: Partial<contacts>): Promise<contacts> {
    return this.prisma.contacts.create({
      data: data as Parameters<typeof this.prisma.contacts.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<contacts>): Promise<contacts> {
    return this.prisma.contacts.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<contacts> {
    return this.prisma.contacts.delete({
      where: { id: BigInt(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.contacts.count({ where });
  }

  /**
   * Find a roster by contact ID
   * @param contactId - The ID of the contact to find the roster for
   * @returns The roster or null if not found
   */
  async findRosterByContactId(contactId: bigint): Promise<dbRosterPlayer | null> {
    return await this.prisma.roster.findFirst({
      where: { contactid: contactId },
      include: { contacts: true },
    });
  }

  /**
   * Find a contact by user ID and account ID
   * @param userId - The ID of the user to find the contact for
   * @param accountId - The ID of the account to find the contact in
   * @returns The contact or null if not found
   */
  async findByUserId(userId: string, accountId: bigint): Promise<dbBaseContact | null> {
    return await this.prisma.contacts.findFirst({
      where: { userid: userId, creatoraccountid: accountId },
    });
  }

  async findContactsByUserIds(userIds: string[]): Promise<dbBaseContact[]> {
    if (!userIds.length) {
      return [];
    }

    return await this.prisma.contacts.findMany({
      where: {
        userid: { in: userIds },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone1: true,
        phone2: true,
        phone3: true,
        streetaddress: true,
        city: true,
        state: true,
        zip: true,
        dateofbirth: true,
        middlename: true,
        creatoraccountid: true,
        userid: true,
      },
    });
  }

  async findContactsWithRolesByAccountId(accountId: bigint): Promise<dbContactWithAccountRoles[]> {
    return await this.prisma.contacts.findMany({
      where: { creatoraccountid: accountId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        middlename: true,
        userid: true,
        contactroles: {
          where: { accountid: accountId },
          select: {
            id: true,
            roleid: true,
            roledata: true,
            accountid: true,
          },
        },
      },
    });
  }

  async findActiveSeasonRosterContacts(
    accountId: bigint,
    seasonId: bigint,
    filters: ActiveRosterContactFilters = {},
  ): Promise<dbBirthdayContact[]> {
    const { birthdayOn } = filters;

    if (!birthdayOn) {
      return this.prisma.contacts.findMany({
        where: {
          creatoraccountid: accountId,
          roster: {
            is: {
              rosterseason: {
                some: {
                  inactive: false,
                  teamsseason: {
                    leagueseason: {
                      seasonid: seasonId,
                      league: {
                        accountid: accountId,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          middlename: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    }

    return this.prisma.$queryRaw<dbBirthdayContact[]>(Prisma.sql`
      SELECT
        c.id,
        c.firstname,
        c.lastname,
        c.middlename
      FROM contacts c
      INNER JOIN roster r ON r.contactid = c.id
      INNER JOIN rosterseason rs ON rs.playerid = r.id AND rs.inactive = false
      INNER JOIN teamsseason ts ON ts.id = rs.teamseasonid
      INNER JOIN leagueseason ls ON ls.id = ts.leagueseasonid
      INNER JOIN league l ON l.id = ls.leagueid
      WHERE
        c.creatoraccountid = ${accountId}
        AND l.accountid = ${accountId}
        AND ls.seasonid = ${seasonId}
        AND c.dateofbirth IS NOT NULL
        AND c.dateofbirth <> DATE '1900-01-01'
        AND EXTRACT(MONTH FROM c.dateofbirth) = ${birthdayOn.month}
        AND EXTRACT(DAY FROM c.dateofbirth) = ${birthdayOn.day}
      GROUP BY
        c.id,
        c.firstname,
        c.lastname,
        c.middlename
      ORDER BY c.lastname ASC, c.firstname ASC
    `);
  }

  async searchContactsWithRoles(
    accountId: bigint,
    options: ContactQueryOptions,
    seasonId?: bigint | null,
  ): Promise<dbContactWithRoleAndDetails[]> {
    const { includeContactDetails, searchQuery, onlyWithRoles, pagination, advancedFilter } =
      options;

    // Build advanced filter condition
    const advancedFilterCondition = this.buildAdvancedFilterCondition(advancedFilter);

    // Determine sort field and order
    const allowedSortFields = [
      'firstname',
      'lastname',
      'email',
      'id',
      'dateofbirth',
      'firstyear',
      'zip',
    ];
    const sortBy = pagination?.sortBy ?? 'lastname';
    const sortOrder = pagination?.sortOrder ?? 'asc';
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'lastname';

    // Map sort field to SQL column
    const sortColumn =
      validatedSortBy === 'firstyear' ? 'roster.firstyear' : `contacts.${validatedSortBy}`;
    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    // For nullable fields, use NULLS LAST for ASC (values first) and NULLS FIRST for DESC (values first)
    const nullableFields = ['zip', 'dateofbirth', 'firstyear'];
    const nullsOrder = nullableFields.includes(validatedSortBy)
      ? sortOrder === 'desc'
        ? 'NULLS LAST'
        : 'NULLS LAST'
      : '';

    // Build the raw SQL query with proper parameter binding
    const query = Prisma.sql`
      SELECT
        contacts.id,
        contacts.firstname,
        contacts.lastname,
        contacts.email,
        contacts.userid,
        ${
          includeContactDetails
            ? Prisma.sql`
        contacts.phone1,
        contacts.phone2,
        contacts.phone3,
        contacts.streetaddress,
        contacts.city,
        contacts.state,
        contacts.zip,
        contacts.dateofbirth,
        contacts.middlename,
        roster.firstyear,
        `
            : Prisma.sql`
        NULL::integer as firstyear,
        `
        }
        CASE
          -- Team roles: Join teamsseason to get team name, validate season
          WHEN cr.roleid = ${ROLE_IDS[RoleNamesType.TEAM_ADMIN]} THEN ts.name
          WHEN cr.roleid = ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]} THEN ts.name

          -- League role: Join leagueseason to get league name, validate season
          WHEN cr.roleid = ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]} THEN l.name

          -- Account roles: No additional name needed (validated by roledata = accountId)
          WHEN cr.roleid = ${ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]} THEN 'Account Admin'
          WHEN cr.roleid = ${ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]} THEN 'Account Photo Admin'

          -- Global roles: No additional restrictions
          WHEN cr.roleid = ${ROLE_IDS[RoleNamesType.ADMINISTRATOR]} THEN 'Administrator'

          ELSE NULL
        END AS role_context_name,
        cr.id AS contactrole_id,
        cr.roleid,
        cr.roledata
      FROM contacts
      -- Always join roster to get firstYear
      LEFT JOIN roster ON roster.contactid = contacts.id
      LEFT JOIN contactroles cr ON (
        contacts.id = cr.contactid
        AND cr.accountid = ${accountId}
        AND (
          -- Include all valid roles based on type-specific validation
          cr.roleid IS NULL  -- This won't match but keeps structure

          -- Account roles: Validate roledata matches accountId
          OR (cr.roleid IN (${ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]}, ${ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]}) AND cr.roledata = ${accountId})

          -- Global roles: No additional restrictions
          OR cr.roleid = ${ROLE_IDS[RoleNamesType.ADMINISTRATOR]}

          -- Team and League roles: Will be validated by subsequent joins
          OR cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]}, ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]})
        )
      )
      -- Team roles: Join to teamsseason and validate season
      LEFT JOIN teamsseason ts ON (
        cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]})
        AND cr.roledata = ts.id
      )
      LEFT JOIN leagueseason ls_ts ON (
        cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]})
        AND ts.leagueseasonid = ls_ts.id
        AND ls_ts.seasonid = ${seasonId}
      )
      -- League role: Join to leagueseason and validate season
      LEFT JOIN leagueseason ls ON (
        cr.roleid = ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]}
        AND cr.roledata = ls.id
        AND ls.seasonid = ${seasonId}
      )
      LEFT JOIN league l ON (
        cr.roleid = ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]}
        AND ls.leagueid = l.id
      )
      WHERE
        contacts.creatoraccountid = ${accountId}
        ${
          searchQuery
            ? Prisma.sql`
          AND (
            contacts.firstname ILIKE ${`%${searchQuery}%`}
            OR contacts.lastname ILIKE ${`%${searchQuery}%`}
            OR contacts.email ILIKE ${`%${searchQuery}%`}
          )
        `
            : Prisma.empty
        }
        ${advancedFilterCondition}
        AND (
          ${
            !onlyWithRoles
              ? Prisma.sql`
          -- Include contacts with no roles but only for the given account
          cr.roleid IS NULL OR
          `
              : Prisma.empty
          }
          -- Include valid team roles (must have valid season)
          (cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]}) AND ls_ts.id IS NOT NULL)

          -- Include valid league roles (must have valid season)
          OR (cr.roleid = ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]} AND ls.id IS NOT NULL)

          -- Include valid account roles
          OR (cr.roleid IN (${ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]}, ${ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]}) AND cr.roledata = ${accountId})
        )
      ORDER BY ${Prisma.raw(sortColumn)} ${Prisma.raw(orderDirection)} ${Prisma.raw(nullsOrder)}, contacts.firstname ${Prisma.raw(orderDirection)}, cr.roleid
      ${pagination ? Prisma.sql`LIMIT ${pagination.limit + 1} OFFSET ${(pagination.page - 1) * pagination.limit}` : Prisma.empty}
    `;

    // Execute the raw query
    return await this.prisma.$queryRaw<dbContactWithRoleAndDetails[]>(query);
  }

  /**
   * Build SQL condition for advanced filtering
   */
  private buildAdvancedFilterCondition(
    advancedFilter: ContactQueryOptions['advancedFilter'],
  ): Prisma.Sql {
    if (!advancedFilter?.filterField || !advancedFilter?.filterOp || !advancedFilter?.filterValue) {
      return Prisma.empty;
    }

    const { filterField, filterOp, filterValue } = advancedFilter;

    // Map filter fields to SQL columns
    const fieldMap: Record<string, string> = {
      lastName: 'contacts.lastname',
      firstName: 'contacts.firstname',
      firstYear: 'roster.firstyear',
      birthYear: 'EXTRACT(YEAR FROM contacts.dateofbirth)',
      zip: 'contacts.zip',
    };

    const sqlField = fieldMap[filterField];
    if (!sqlField) {
      return Prisma.empty;
    }

    // Determine if field is numeric
    const isNumericField = filterField === 'firstYear' || filterField === 'birthYear';

    // Build the condition based on operation
    switch (filterOp) {
      case 'startsWith':
        return Prisma.sql`AND ${Prisma.raw(sqlField)} ILIKE ${filterValue + '%'}`;
      case 'endsWith':
        return Prisma.sql`AND ${Prisma.raw(sqlField)} ILIKE ${'%' + filterValue}`;
      case 'contains':
        return Prisma.sql`AND ${Prisma.raw(sqlField)} ILIKE ${'%' + filterValue + '%'}`;
      case 'equals':
        if (isNumericField) {
          const numValue = parseInt(filterValue, 10);
          if (isNaN(numValue)) return Prisma.empty;
          return Prisma.sql`AND ${Prisma.raw(sqlField)} = ${numValue}`;
        }
        return Prisma.sql`AND ${Prisma.raw(sqlField)} ILIKE ${filterValue}`;
      case 'notEquals':
        if (isNumericField) {
          const numValue = parseInt(filterValue, 10);
          if (isNaN(numValue)) return Prisma.empty;
          return Prisma.sql`AND ${Prisma.raw(sqlField)} != ${numValue}`;
        }
        return Prisma.sql`AND ${Prisma.raw(sqlField)} NOT ILIKE ${filterValue}`;
      case 'greaterThan':
        if (isNumericField) {
          const numValue = parseInt(filterValue, 10);
          if (isNaN(numValue)) return Prisma.empty;
          return Prisma.sql`AND ${Prisma.raw(sqlField)} > ${numValue}`;
        }
        return Prisma.sql`AND ${Prisma.raw(sqlField)} > ${filterValue}`;
      case 'greaterThanOrEqual':
        if (isNumericField) {
          const numValue = parseInt(filterValue, 10);
          if (isNaN(numValue)) return Prisma.empty;
          return Prisma.sql`AND ${Prisma.raw(sqlField)} >= ${numValue}`;
        }
        return Prisma.sql`AND ${Prisma.raw(sqlField)} >= ${filterValue}`;
      case 'lessThan':
        if (isNumericField) {
          const numValue = parseInt(filterValue, 10);
          if (isNaN(numValue)) return Prisma.empty;
          return Prisma.sql`AND ${Prisma.raw(sqlField)} < ${numValue}`;
        }
        return Prisma.sql`AND ${Prisma.raw(sqlField)} < ${filterValue}`;
      case 'lessThanOrEqual':
        if (isNumericField) {
          const numValue = parseInt(filterValue, 10);
          if (isNaN(numValue)) return Prisma.empty;
          return Prisma.sql`AND ${Prisma.raw(sqlField)} <= ${numValue}`;
        }
        return Prisma.sql`AND ${Prisma.raw(sqlField)} <= ${filterValue}`;
      default:
        return Prisma.empty;
    }
  }

  async searchContactsByName(
    accountId: bigint,
    options: ContactQueryOptions,
  ): Promise<{ contacts: dbBaseContact[]; total: number }> {
    const { searchQuery, pagination, includeContactDetails = false } = options;

    // Build where clause
    const whereClause: Prisma.contactsWhereInput = {
      creatoraccountid: accountId,
    };

    // Add search conditions if search query provided
    if (searchQuery) {
      whereClause.OR = [
        {
          firstname: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          lastname: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      ];
    }

    const totalCount = await this.count(whereClause);

    // Build contact selection
    const contactSelect = {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      userid: true,
      ...(includeContactDetails && {
        phone1: true,
        phone2: true,
        phone3: true,
        streetaddress: true,
        city: true,
        state: true,
        zip: true,
        dateofbirth: true,
        middlename: true,
      }),
    } as const;

    // Build query options
    const queryOptions: Prisma.contactsFindManyArgs = {
      where: whereClause,
      select: contactSelect,
    };

    // Add pagination if provided
    if (pagination) {
      const allowedSortFields = ['firstname', 'lastname', 'email', 'id'];
      const sortBy = PaginationHelper.validateSortField(pagination.sortBy, allowedSortFields);

      queryOptions.orderBy = sortBy
        ? PaginationHelper.getPrismaOrderBy(sortBy, pagination.sortOrder)
        : [{ lastname: 'asc' }, { firstname: 'asc' }];

      queryOptions.skip = (pagination.page - 1) * pagination.limit;
      queryOptions.take = pagination.limit;
    } else {
      // Default ordering for search results
      queryOptions.orderBy = [{ lastname: 'asc' }, { firstname: 'asc' }];
      queryOptions.take = 10; // Default limit for search
    }

    // Execute query
    const contacts = await this.prisma.contacts.findMany(queryOptions);
    return { contacts, total: totalCount };
  }

  async findAvailableContacts(
    accountId: bigint,
    excludedContactIds: bigint[],
    firstName: string | undefined,
    lastName: string | undefined,
    skip: number,
    take: number,
  ): Promise<dbBaseContact[]> {
    const whereClause: Prisma.contactsWhereInput = {
      creatoraccountid: accountId,
      ...(excludedContactIds.length
        ? {
            id: {
              notIn: excludedContactIds,
            },
          }
        : {}),
      ...(firstName
        ? {
            firstname: {
              contains: firstName,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(lastName
        ? {
            lastname: {
              contains: lastName,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    return this.prisma.contacts.findMany({
      where: whereClause,
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }, { middlename: 'asc' }],
      skip,
      take,
      select: {
        id: true,
        userid: true,
        firstname: true,
        lastname: true,
        middlename: true,
        email: true,
        phone1: true,
        phone2: true,
        phone3: true,
        streetaddress: true,
        city: true,
        state: true,
        zip: true,
        dateofbirth: true,
        creatoraccountid: true,
      },
    });
  }

  async findContactsForExport(
    accountId: bigint,
    options: ContactExportOptions,
  ): Promise<dbContactExportData[]> {
    const { searchTerm, onlyWithRoles, seasonId } = options;

    // When filtering by roles with a seasonId, we need to use raw SQL to properly
    // validate that roles are for the current season (team/league roles are season-scoped)
    if (onlyWithRoles && seasonId) {
      return this.findContactsForExportWithSeasonRoles(accountId, seasonId, searchTerm);
    }

    // Simple case: no season filtering needed
    const whereClause: Prisma.contactsWhereInput = {
      creatoraccountid: accountId,
      ...(searchTerm
        ? {
            OR: [
              { firstname: { contains: searchTerm, mode: 'insensitive' } },
              { lastname: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(onlyWithRoles
        ? {
            contactroles: {
              some: {
                accountid: accountId,
              },
            },
          }
        : {}),
    };

    return this.prisma.contacts.findMany({
      where: whereClause,
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }, { middlename: 'asc' }],
      select: {
        firstname: true,
        lastname: true,
        middlename: true,
        email: true,
        phone1: true,
        phone2: true,
        phone3: true,
        streetaddress: true,
        city: true,
        state: true,
        zip: true,
        dateofbirth: true,
        contactroles: {
          where: {
            accountid: accountId,
          },
          select: {
            roleid: true,
          },
        },
      },
    });
  }

  /**
   * Find contacts with roles that are valid for the given season.
   * This validates that team/league roles are for the correct season.
   */
  private async findContactsForExportWithSeasonRoles(
    accountId: bigint,
    seasonId: bigint,
    searchTerm?: string,
  ): Promise<dbContactExportData[]> {
    // Raw SQL query to get contacts with season-valid roles
    const query = Prisma.sql`
      SELECT DISTINCT
        c.firstname,
        c.lastname,
        c.middlename,
        c.email,
        c.phone1,
        c.phone2,
        c.phone3,
        c.streetaddress,
        c.city,
        c.state,
        c.zip,
        c.dateofbirth,
        c.id AS contact_id
      FROM contacts c
      INNER JOIN contactroles cr ON c.id = cr.contactid AND cr.accountid = ${accountId}
      -- Team roles: Join to teamsseason and validate season
      LEFT JOIN teamsseason ts ON (
        cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]})
        AND cr.roledata = ts.id
      )
      LEFT JOIN leagueseason ls_ts ON (
        cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]})
        AND ts.leagueseasonid = ls_ts.id
        AND ls_ts.seasonid = ${seasonId}
      )
      -- League role: Join to leagueseason and validate season
      LEFT JOIN leagueseason ls ON (
        cr.roleid = ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]}
        AND cr.roledata = ls.id
        AND ls.seasonid = ${seasonId}
      )
      WHERE
        c.creatoraccountid = ${accountId}
        ${
          searchTerm
            ? Prisma.sql`
        AND (
          c.firstname ILIKE ${`%${searchTerm}%`}
          OR c.lastname ILIKE ${`%${searchTerm}%`}
          OR c.email ILIKE ${`%${searchTerm}%`}
        )
        `
            : Prisma.empty
        }
        AND (
          -- Include valid team roles (must have valid season)
          (cr.roleid IN (${ROLE_IDS[RoleNamesType.TEAM_ADMIN]}, ${ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]}) AND ls_ts.id IS NOT NULL)

          -- Include valid league roles (must have valid season)
          OR (cr.roleid = ${ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]} AND ls.id IS NOT NULL)

          -- Include valid account roles (always valid for the account)
          OR (cr.roleid IN (${ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]}, ${ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]}) AND cr.roledata = ${accountId})
        )
      ORDER BY c.lastname, c.firstname, c.middlename
    `;

    interface RawContactResult {
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
      contact_id: bigint;
    }

    const rawContacts = await this.prisma.$queryRaw<RawContactResult[]>(query);

    // Now fetch the contactroles for each contact (only for the current account)
    const contactIds = rawContacts.map((c) => c.contact_id);

    if (contactIds.length === 0) {
      return [];
    }

    const contactRoles = await this.prisma.contactroles.findMany({
      where: {
        contactid: { in: contactIds },
        accountid: accountId,
      },
      select: {
        contactid: true,
        roleid: true,
      },
    });

    // Group roles by contact
    const rolesByContact = new Map<bigint, { roleid: string }[]>();
    for (const role of contactRoles) {
      const existing = rolesByContact.get(role.contactid) || [];
      existing.push({ roleid: role.roleid });
      rolesByContact.set(role.contactid, existing);
    }

    // Transform to expected format
    return rawContacts.map((c) => ({
      firstname: c.firstname,
      lastname: c.lastname,
      middlename: c.middlename,
      email: c.email,
      phone1: c.phone1,
      phone2: c.phone2,
      phone3: c.phone3,
      streetaddress: c.streetaddress,
      city: c.city,
      state: c.state,
      zip: c.zip,
      dateofbirth: c.dateofbirth,
      contactroles: rolesByContact.get(c.contact_id) || [],
    }));
  }
}
