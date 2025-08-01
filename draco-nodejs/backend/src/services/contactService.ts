import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationHelper } from '../utils/pagination';
import {
  ContactQueryOptions,
  ContactResponse,
  ContactWithRoleRow,
  ContactWithRoleAndDetailsRow,
  ContactDetails,
  ContactEntry,
} from '../interfaces/contactInterfaces';
import { ROLE_IDS, ROLE_NAMES } from '../config/roles';
import { RoleType } from '../types/roles';

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
    const {
      includeRoles = false,
      onlyWithRoles = false,
      searchQuery,
      pagination,
      includeContactDetails = false,
    } = options;

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
          WHEN cr.roleid = ${ROLE_IDS[RoleType.TEAM_ADMIN]} THEN ts.name
          WHEN cr.roleid = ${ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]} THEN ts.name

          -- League role: Join leagueseason to get league name, validate season
          WHEN cr.roleid = ${ROLE_IDS[RoleType.LEAGUE_ADMIN]} THEN l.name

          -- Account roles: No additional name needed (validated by roledata = accountId)
          WHEN cr.roleid = ${ROLE_IDS[RoleType.ACCOUNT_ADMIN]} THEN 'Account Admin'
          WHEN cr.roleid = ${ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]} THEN 'Account Photo Admin'

          -- Global roles: No additional restrictions
          WHEN cr.roleid = ${ROLE_IDS[RoleType.ADMINISTRATOR]} THEN 'Administrator'

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
          OR (cr.roleid IN (${ROLE_IDS[RoleType.ACCOUNT_ADMIN]}, ${ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]}) AND cr.roledata = ${accountId})
          
          -- Global roles: No additional restrictions
          OR cr.roleid = ${ROLE_IDS[RoleType.ADMINISTRATOR]}
          
          -- Team and League roles: Will be validated by subsequent joins
          OR cr.roleid IN (${ROLE_IDS[RoleType.TEAM_ADMIN]}, ${ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]}, ${ROLE_IDS[RoleType.LEAGUE_ADMIN]})
        )
      )
      -- Team roles: Join to teamsseason and validate season
      LEFT JOIN teamsseason ts ON (
        cr.roleid IN (${ROLE_IDS[RoleType.TEAM_ADMIN]}, ${ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]})
        AND cr.roledata = ts.id
      )
      LEFT JOIN leagueseason ls_ts ON (
        cr.roleid IN (${ROLE_IDS[RoleType.TEAM_ADMIN]}, ${ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]})
        AND ts.leagueseasonid = ls_ts.id
        AND ls_ts.seasonid = ${seasonId}
      )
      -- League role: Join to leagueseason and validate season
      LEFT JOIN leagueseason ls ON (
        cr.roleid = ${ROLE_IDS[RoleType.LEAGUE_ADMIN]}
        AND cr.roledata = ls.id
        AND ls.seasonid = ${seasonId}
      )
      LEFT JOIN league l ON (
        cr.roleid = ${ROLE_IDS[RoleType.LEAGUE_ADMIN]}
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
          (cr.roleid IN (${ROLE_IDS[RoleType.TEAM_ADMIN]}, ${ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]}) AND ls_ts.id IS NOT NULL)
          
          -- Include valid league roles (must have valid season)
          OR (cr.roleid = ${ROLE_IDS[RoleType.LEAGUE_ADMIN]} AND ls.id IS NOT NULL)
          
          -- Include valid account roles
          OR (cr.roleid IN (${ROLE_IDS[RoleType.ACCOUNT_ADMIN]}, ${ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]}) AND cr.roledata = ${accountId})
        )
      ORDER BY contacts.lastname, contacts.firstname, cr.roleid
      ${pagination ? Prisma.sql`LIMIT ${pagination.limit + 1} OFFSET ${(pagination.page - 1) * pagination.limit}` : Prisma.empty}
    `;

    // Execute the raw query
    const rows = await prisma.$queryRaw<ContactWithRoleRow[]>(query);

    // Single efficient query to find account owner's contact ID
    const ownerContactResult = await prisma.$queryRaw<{ id: bigint }[]>`
      SELECT contacts.id 
      FROM accounts 
      JOIN contacts ON accounts.id = contacts.creatoraccountid 
      WHERE accounts.id = ${accountId} 
        AND accounts.owneruserid = contacts.userid
    `;

    const accountOwnerContactId = ownerContactResult[0]?.id?.toString() || null;

    // Transform the flat rows into the desired structure
    return ContactService.transformContactRows(
      rows,
      accountId,
      accountOwnerContactId,
      pagination,
      includeContactDetails,
    );
  }

  /**
   * Simple contact query without roles using Prisma ORM
   */
  private static async getContactsSimple(
    accountId: bigint,
    options: ContactQueryOptions = {},
  ): Promise<ContactResponse> {
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
    const contacts = await prisma.contacts.findMany(queryOptions);

    // Transform response (simple contacts without roles)
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: contact.userid,
      ...(includeContactDetails && {
        contactDetails: {
          phone1: contact.phone1,
          phone2: contact.phone2,
          phone3: contact.phone3,
          streetaddress: contact.streetaddress,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
          dateofbirth: contact.dateofbirth ? contact.dateofbirth.toISOString() : null,
          middlename: contact.middlename,
        },
      }),
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
    includeContactDetails?: boolean,
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
        contactDetails?: ContactDetails;
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
        const contactEntry: ContactEntry = {
          id: contactId,
          firstName: row.firstname,
          lastName: row.lastname,
          email: row.email,
          userId: row.userid,
          contactroles: [],
        };

        // Add contact details if available and requested
        if (includeContactDetails && 'phone1' in row) {
          const contactRow = row as ContactWithRoleAndDetailsRow;
          contactEntry.contactDetails = {
            phone1: contactRow.phone1,
            phone2: contactRow.phone2,
            phone3: contactRow.phone3,
            streetaddress: contactRow.streetaddress,
            city: contactRow.city,
            state: contactRow.state,
            zip: contactRow.zip,
            dateofbirth: contactRow.dateofbirth ? contactRow.dateofbirth.toISOString() : null,
            middlename: contactRow.middlename,
          };
        }

        contactMap.set(contactId, contactEntry);
      }

      // Add role if present
      if (row.roleid && row.roledata) {
        const contact = contactMap.get(contactId)!;

        // Map role ID to role name
        const roleName = ROLE_NAMES[row.roleid];

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

      // todo: if the contact is not found, we need to create it
      // if we are filtering by onlyWithRoles. This is because the
      // user doesn't have a record in the contact roles table so won't
      // be found. Maybe the accountOwner should be in the contact roles table,
      // it would make things alot easier.
      if (contact) {
        // Check if AccountAdmin role already exists to prevent duplicates
        const hasAccountAdminRole = contact.contactroles.some(
          (role) => role.roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN],
        );

        if (!hasAccountAdminRole) {
          contact.contactroles.push({
            id: `owner-account-admin-${accountOwnerContactId}`,
            roleId: ROLE_IDS[RoleType.ACCOUNT_ADMIN],
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
