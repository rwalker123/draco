import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationHelper } from '../utils/pagination';
import { ContactQueryOptions, ContactResponse } from '../interfaces/contactInterfaces';

export class ContactService {
  /**
   * Get contacts with optional role inclusion and search
   * Automatically adds AccountAdmin role for account owners
   */
  static async getContactsWithRoles(
    accountId: bigint,
    options: ContactQueryOptions = {},
  ): Promise<ContactResponse> {
    const { includeRoles = false, searchQuery, pagination } = options;

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
      ...(includeRoles && {
        contactroles: {
          where: {
            accountid: accountId,
          },
          select: {
            id: true,
            roleid: true,
            roledata: true,
          },
        },
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

    // Get account owner information for role assignment
    let accountOwnerUserId: string | null = null;
    if (includeRoles) {
      const account = await prisma.accounts.findUnique({
        where: { id: accountId },
        select: { owneruserid: true },
      });
      accountOwnerUserId = account?.owneruserid || null;
    }

    // Transform response with account ownership role assignment
    const transformedContacts = contacts.map((contact) => {
      const baseContact = {
        id: contact.id.toString(),
        firstName: contact.firstname,
        lastName: contact.lastname,
        email: contact.email,
        userId: contact.userid,
      };

      if (includeRoles) {
        // Get existing roles from contactroles table
        const existingRoles =
          'contactroles' in contact && contact.contactroles
            ? (contact.contactroles as Array<{ id: bigint; roleid: string; roledata: bigint }>).map(
                (cr) => ({
                  id: cr.id.toString(),
                  roleId: cr.roleid,
                  roleData: cr.roledata.toString(),
                }),
              )
            : [];

        // Check if user is account owner
        const isAccountOwner = contact.userid === accountOwnerUserId;

        // Create all roles array starting with existing roles
        const allRoles = [...existingRoles];

        // Add AccountAdmin role if user is account owner
        if (isAccountOwner) {
          // Check if AccountAdmin role already exists to prevent duplicates
          const hasAccountAdminRole = existingRoles.some((role) => role.roleId === 'AccountAdmin');

          if (!hasAccountAdminRole) {
            allRoles.push({
              id: `owner-account-admin-${contact.id}`,
              roleId: 'AccountAdmin',
              roleData: accountId.toString(),
            });
          }
        }

        return {
          ...baseContact,
          contactroles: allRoles,
        };
      }

      return baseContact;
    });

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
}
