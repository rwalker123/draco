import { Prisma, PrismaClient, contacts } from '@prisma/client';
import { IContactRepository } from '../interfaces/index.js';
import {
  dbRosterPlayer,
  dbBaseContact,
  dbContactWithAccountRoles,
  dbContactWithRoleAndDetails,
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

  async findMany(where?: Record<string, unknown>): Promise<contacts[]> {
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

  async searchContactsWithRoles(
    accountId: bigint,
    options: ContactQueryOptions,
    seasonId?: bigint | null,
  ): Promise<dbContactWithRoleAndDetails[]> {
    const { includeContactDetails, searchQuery, onlyWithRoles, pagination } = options;

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
        `
            : Prisma.empty
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
      ORDER BY contacts.lastname, contacts.firstname, cr.roleid
      ${pagination ? Prisma.sql`LIMIT ${pagination.limit + 1} OFFSET ${(pagination.page - 1) * pagination.limit}` : Prisma.empty}
    `;

    // Execute the raw query
    return await this.prisma.$queryRaw<dbContactWithRoleAndDetails[]>(query);
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
}
