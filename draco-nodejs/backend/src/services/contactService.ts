import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationHelper } from '../utils/pagination';
import {
  ContactQueryOptions,
  ContactResponse,
  ContactWithRoleRow,
} from '../interfaces/contactInterfaces';

// Role GUID constants
const ROLE_GUIDS = {
  TEAM_ADMIN: '777D771B-1CBA-4126-B8F3-DD7F3478D40E',
  TEAM_PHOTO_ADMIN: '55FD3262-343F-4000-9561-6BB7F658DEB7',
  LEAGUE_ADMIN: '672DDF06-21AC-4D7C-B025-9319CC69281A',
  ACCOUNT_ADMIN: '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A',
  ACCOUNT_PHOTO_ADMIN: 'a87ea9a3-47e2-49d1-9e1e-c35358d1a677',
  PHOTO_ADMIN: '05BEC889-3499-4DE1-B44F-4EED41412B3D',
  ADMINISTRATOR: '93DAC465-4C64-4422-B444-3CE79C549329',
} as const;

export class ContactService {
  /**
   * Get contacts with their roles for a specific account and season
   * Uses raw SQL for complex role context joins when includeRoles is true
   * @param accountId - The account ID to get contacts for
   * @param seasonId - The season ID for role context (optional, defaults to null for backward compatibility)
   * @param options - Query options including includeRoles, searchQuery, and pagination
   */
  static async getContactsWithRoles(
    accountId: bigint,
    seasonId?: bigint | null,
    options: ContactQueryOptions = {},
  ): Promise<ContactResponse> {
    const { includeRoles = false, searchQuery, pagination } = options;

    // If roles are not requested, use the simple Prisma query
    if (!includeRoles) {
      return ContactService.getContactsSimple(accountId, options);
    }

    // Build the raw SQL query with proper parameter binding
    const query = Prisma.sql`
      SELECT
        contacts.id,
        contacts.firstname,
        contacts.lastname,
        contacts.email,
        contacts.userid,
        CASE
          -- Team roles: Join teamsseason to get team name, validate season
          WHEN cr.roleid = ${ROLE_GUIDS.TEAM_ADMIN} THEN ts.name
          WHEN cr.roleid = ${ROLE_GUIDS.TEAM_PHOTO_ADMIN} THEN ts.name

          -- League role: Join leagueseason to get league name, validate season
          WHEN cr.roleid = ${ROLE_GUIDS.LEAGUE_ADMIN} THEN l.name

          -- Account roles: No additional name needed (validated by roledata = accountId)
          WHEN cr.roleid = ${ROLE_GUIDS.ACCOUNT_ADMIN} THEN 'Account Admin'
          WHEN cr.roleid = ${ROLE_GUIDS.ACCOUNT_PHOTO_ADMIN} THEN 'Account Photo Admin'

          -- Global roles: No additional restrictions
          WHEN cr.roleid = ${ROLE_GUIDS.PHOTO_ADMIN} THEN 'Photo Admin'
          WHEN cr.roleid = ${ROLE_GUIDS.ADMINISTRATOR} THEN 'Administrator'

          ELSE NULL
        END AS role_context_name,
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
          OR (cr.roleid IN (${ROLE_GUIDS.ACCOUNT_ADMIN}, ${ROLE_GUIDS.ACCOUNT_PHOTO_ADMIN}) AND cr.roledata = ${accountId})
          
          -- Global roles: No additional restrictions
          OR cr.roleid IN (${ROLE_GUIDS.PHOTO_ADMIN}, ${ROLE_GUIDS.ADMINISTRATOR})
          
          -- Team and League roles: Will be validated by subsequent joins
          OR cr.roleid IN (${ROLE_GUIDS.TEAM_ADMIN}, ${ROLE_GUIDS.TEAM_PHOTO_ADMIN}, ${ROLE_GUIDS.LEAGUE_ADMIN})
        )
      )
      -- Team roles: Join to teamsseason and validate season
      LEFT JOIN teamsseason ts ON (
        cr.roleid IN (${ROLE_GUIDS.TEAM_ADMIN}, ${ROLE_GUIDS.TEAM_PHOTO_ADMIN})
        AND cr.roledata = ts.id
      )
      LEFT JOIN leagueseason ls_ts ON (
        cr.roleid IN (${ROLE_GUIDS.TEAM_ADMIN}, ${ROLE_GUIDS.TEAM_PHOTO_ADMIN})
        AND ts.leagueseasonid = ls_ts.id
        AND ls_ts.seasonid = ${seasonId}
      )
      -- League role: Join to leagueseason and validate season
      LEFT JOIN leagueseason ls ON (
        cr.roleid = ${ROLE_GUIDS.LEAGUE_ADMIN}
        AND cr.roledata = ls.id
        AND ls.seasonid = ${seasonId}
      )
      LEFT JOIN league l ON (
        cr.roleid = ${ROLE_GUIDS.LEAGUE_ADMIN}
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
          -- Include contacts with no roles but only for the given account
          cr.roleid IS NULL
          
          -- Include valid team roles (must have valid season)
          OR (cr.roleid IN (${ROLE_GUIDS.TEAM_ADMIN}, ${ROLE_GUIDS.TEAM_PHOTO_ADMIN}) AND ls_ts.id IS NOT NULL)
          
          -- Include valid league roles (must have valid season)
          OR (cr.roleid = ${ROLE_GUIDS.LEAGUE_ADMIN} AND ls.id IS NOT NULL)
          
          -- Include valid account roles
          OR (cr.roleid IN (${ROLE_GUIDS.ACCOUNT_ADMIN}, ${ROLE_GUIDS.ACCOUNT_PHOTO_ADMIN}) AND cr.roledata = ${accountId})
          
          -- Include global roles
          OR cr.roleid IN (${ROLE_GUIDS.PHOTO_ADMIN}, ${ROLE_GUIDS.ADMINISTRATOR})
        )
      ORDER BY contacts.lastname, contacts.firstname, cr.roleid
      ${pagination ? Prisma.sql`LIMIT ${pagination.limit + 1} OFFSET ${(pagination.page - 1) * pagination.limit}` : Prisma.empty}
    `;

    // Execute the raw query
    const rows = await prisma.$queryRaw<ContactWithRoleRow[]>(query);

    // Get account owner contact ID for role assignment
    const ownerContact = await prisma.accounts.findUnique({
      where: { id: accountId },
      select: {
        contacts: {
          where: {
            creatoraccountid: accountId,
          },
          select: {
            id: true,
          },
        },
      },
    });
    const accountOwnerContactId = ownerContact?.contacts[0]?.id?.toString() || null;

    // Transform the flat rows into the desired structure
    return ContactService.transformContactRows(rows, accountId, accountOwnerContactId, pagination);
  }

  /**
   * Simple contact query without roles using Prisma ORM
   */
  private static async getContactsSimple(
    accountId: bigint,
    options: ContactQueryOptions = {},
  ): Promise<ContactResponse> {
    const { searchQuery, pagination } = options;

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

    // Get total count
    const totalCount = await prisma.contacts.count({
      where: whereClause,
    });

    // Build contact selection
    const contactSelect = {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      userid: true,
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
    const contacts = await prisma.contacts.findMany(queryOptions);

    // Transform response (simple contacts without roles)
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: contact.userid,
    }));

    // Format response
    if (pagination) {
      const response = PaginationHelper.formatResponse(
        transformedContacts,
        pagination.page,
        pagination.limit,
        totalCount,
      );

      return {
        contacts: response.data,
        total: response.pagination.total,
        pagination: response.pagination,
      };
    }

    return {
      contacts: transformedContacts,
      total: totalCount,
    };
  }

  /**
   * Transform raw SQL rows into structured contact response
   */
  private static transformContactRows(
    rows: ContactWithRoleRow[],
    accountId: bigint,
    accountOwnerContactId: string | null,
    pagination?: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ): ContactResponse {
    // Group rows by contact ID
    const contactMap = new Map<
      string,
      {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        userId: string | null;
        contactroles: Array<{
          id: string;
          roleId: string;
          roleName: string;
          roleData: string;
          contextName?: string;
        }>;
      }
    >();

    // Process each row
    for (const row of rows) {
      const contactId = row.id.toString();

      // Get or create contact entry
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          id: contactId,
          firstName: row.firstname,
          lastName: row.lastname,
          email: row.email,
          userId: row.userid,
          contactroles: [],
        });
      }

      // Add role if present
      if (row.roleid && row.roledata) {
        const contact = contactMap.get(contactId)!;

        // Map role ID to role name
        let roleName = 'Unknown';
        switch (row.roleid) {
          case ROLE_GUIDS.ADMINISTRATOR:
            roleName = 'Administrator';
            break;
          case ROLE_GUIDS.ACCOUNT_ADMIN:
            roleName = 'AccountAdmin';
            break;
          case ROLE_GUIDS.ACCOUNT_PHOTO_ADMIN:
            roleName = 'AccountPhotoAdmin';
            break;
          case ROLE_GUIDS.LEAGUE_ADMIN:
            roleName = 'LeagueAdmin';
            break;
          case ROLE_GUIDS.TEAM_ADMIN:
            roleName = 'TeamAdmin';
            break;
          case ROLE_GUIDS.TEAM_PHOTO_ADMIN:
            roleName = 'TeamPhotoAdmin';
            break;
          case ROLE_GUIDS.PHOTO_ADMIN:
            roleName = 'PhotoAdmin';
            break;
        }

        const role = {
          id: `${row.roleid}-${row.roledata}`,
          roleId: row.roleid,
          roleName: roleName,
          roleData: row.roledata.toString(),
        };

        // Add context name if available (team or league name)
        if (row.role_context_name) {
          (role as { contextName?: string }).contextName = row.role_context_name;
        }

        contact.contactroles.push(role);
      }
    }

    // Add AccountAdmin role for account owner if not already present
    if (accountOwnerContactId) {
      const contact = contactMap.get(accountOwnerContactId);

      if (contact) {
        // Check if AccountAdmin role already exists to prevent duplicates
        const hasAccountAdminRole = contact.contactroles.some(
          (role) => role.roleId === ROLE_GUIDS.ACCOUNT_ADMIN,
        );

        if (!hasAccountAdminRole) {
          contact.contactroles.push({
            id: `owner-account-admin-${accountOwnerContactId}`,
            roleId: ROLE_GUIDS.ACCOUNT_ADMIN,
            roleName: 'AccountAdmin',
            roleData: accountId.toString(),
          });
        }
      }
    }

    // Convert map to array and sort
    const allContacts = Array.from(contactMap.values()).sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    // Handle pagination with efficient hasNext approach
    if (pagination) {
      // Check if we have more results than requested (the +1 record)
      const hasNext = allContacts.length > pagination.limit;

      // Remove the extra contact if present
      const contacts = hasNext ? allContacts.slice(0, pagination.limit) : allContacts;

      return {
        contacts,
        total: contacts.length, // Only the contacts returned, not global total
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          hasNext,
          hasPrev: pagination.page > 1,
        },
      };
    }

    // Return all contacts without pagination
    return {
      contacts: allContacts,
      total: allContacts.length,
    };
  }
}
