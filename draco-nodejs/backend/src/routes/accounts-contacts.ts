// Account Contacts & Users Management Routes for Draco Sports Manager
// Handles all contact and user management within accounts

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { ServiceFactory } from '../lib/serviceFactory';
import { isEmail } from 'validator';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors';
import { extractAccountParams, extractContactParams } from '../utils/paramExtraction';
import { PaginationHelper } from '../utils/pagination';
import prisma from '../lib/prisma';
import { ContactService } from '../services/contactService';
import { ContactSearchResult } from '../interfaces/accountInterfaces';

const router = Router({ mergeParams: true });
export const roleService = ServiceFactory.getRoleService();
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/accounts/:accountId/contacts
 * Get users in account (requires account access) - with pagination
 * Optional query parameters:
 *   - roles=true to include contactroles data with role context (team/league names for season-specific roles)
 *   - seasonId=123 to filter roles by season context (required for proper team/league role resolution)
 *   - onlyWithRoles=true to filter users who have at least one role
 *   - contactDetails=true to include detailed contact information (phone, address, etc.)
 */
router.get(
  '/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { roles, seasonId, onlyWithRoles, contactDetails } = req.query;
    const includeRoles = roles === 'true';
    const filterOnlyWithRoles = onlyWithRoles === 'true';
    const includeContactDetails = contactDetails === 'true';

    // Parse season ID if provided
    const parsedSeasonId = seasonId && typeof seasonId === 'string' ? BigInt(seasonId) : null;

    // Parse pagination parameters
    const paginationParams = PaginationHelper.parseParams(req.query);

    // Use ContactService to get contacts with roles
    const result = await ContactService.getContactsWithRoles(accountId, parsedSeasonId, {
      includeRoles,
      onlyWithRoles: filterOnlyWithRoles,
      includeContactDetails,
      pagination: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        sortBy: paginationParams.sortBy,
        sortOrder: paginationParams.sortOrder,
      },
    });

    res.json({
      success: true,
      data: {
        accountId: accountId.toString(),
        contacts: result.contacts,
      },
      pagination: result.pagination,
    });
  }),
);

/**
 * POST /api/accounts/:accountId/users/:contactId/roles
 * Assign role to user in account (Account Admin or Administrator)
 */
router.post(
  '/:accountId/users/:contactId/roles',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.roles.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
    const { roleId, roleData, seasonId } = req.body;

    if (!roleId || roleData === undefined || roleData === null) {
      throw new ValidationError('Role ID and role data are required');
    }

    // Validate roleData is a valid number/bigint
    let roleDataBigInt: bigint;
    try {
      roleDataBigInt = BigInt(roleData);
    } catch (error) {
      throw new ValidationError('Role data must be a valid numeric ID');
    }

    // Validate seasonId if provided
    let seasonIdBigInt: bigint | undefined;
    if (seasonId !== undefined && seasonId !== null) {
      try {
        seasonIdBigInt = BigInt(seasonId);
      } catch (error) {
        throw new ValidationError('Season ID must be a valid numeric ID');
      }
    }

    try {
      const assignedRole = await roleService.assignRole(
        req.user!.id,
        contactId,
        roleId,
        roleDataBigInt,
        accountId,
        seasonIdBigInt,
      );

      res.status(201).json({
        success: true,
        data: {
          assignedRole: {
            id: assignedRole.id.toString(),
            contactId: assignedRole.contactId.toString(),
            roleId: assignedRole.roleId,
            roleData: assignedRole.roleData.toString(),
            accountId: assignedRole.accountId.toString(),
          },
        },
      });
    } catch (error) {
      // Re-throw with more context if it's a validation error from roleService
      if (error instanceof Error && error.message.includes('roleData must be')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }),
);

/**
 * DELETE /api/accounts/:accountId/users/:contactId/roles/:roleId
 * Remove role from user in account (Account Admin or Administrator)
 */
router.delete(
  '/:accountId/contacts/:contactId/roles/:roleId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.roles.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
    const roleId = req.params.roleId;
    const { roleData } = req.body;

    if (!roleData) {
      throw new ValidationError('Role data is required');
    }

    const wasRemoved = await roleService.removeRole(
      req.user!.id,
      contactId,
      roleId,
      BigInt(roleData),
      accountId,
    );

    if (!wasRemoved) {
      throw new ValidationError(
        'Role not found or roleData does not match. Unable to remove role.',
      );
    }

    res.json({
      success: true,
      message: 'Role removed successfully',
    });
  }),
);

/**
 * GET /api/accounts/:accountId/contacts/search
 * Search contacts by name for autocomplete
 * Required query parameter: q=searchTerm
 * Optional query parameters:
 *   - roles=true to include contactroles data with role context
 *   - seasonId=123 to filter roles by season context (required for proper team/league role resolution)
 *   - contactDetails=true to include detailed contact information (phone, address, etc.)
 */
router.get(
  '/:accountId/contacts/search',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q, roles, seasonId, contactDetails } = req.query; // search query, roles flag, and optional seasonId
    const { accountId } = extractAccountParams(req.params);
    const includeRoles = roles === 'true';
    const includeContactDetails = contactDetails === 'true';

    if (!q || typeof q !== 'string') {
      res.json({
        success: true,
        data: {
          contacts: [],
        },
      });
      return;
    }

    // Parse season ID if provided
    const parsedSeasonId = seasonId && typeof seasonId === 'string' ? BigInt(seasonId) : null;

    // Use ContactService to get contacts with roles
    const result = await ContactService.getContactsWithRoles(accountId, parsedSeasonId, {
      includeRoles,
      includeContactDetails,
      searchQuery: q,
    });

    // Transform contacts for search response format
    const searchContacts: ContactSearchResult[] = result.contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      userId: contact.userId,
      displayName: `${contact.firstName} ${contact.lastName}`,
      searchText: `${contact.firstName} ${contact.lastName} (${contact.email})`,
      ...(includeRoles && { contactroles: contact.contactroles }),
    }));

    res.json({
      success: true,
      data: {
        contacts: searchContacts,
      },
    });
  }),
);

/**
 * PUT /api/accounts/:accountId/contacts/:contactId
 * Update contact information
 */
router.put(
  '/:accountId/contacts/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
    const {
      firstname,
      lastname,
      middlename,
      email,
      phone1,
      phone2,
      phone3,
      streetaddress,
      city,
      state,
      zip,
      dateofbirth,
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname) {
      throw new ValidationError('First name and last name are required');
    }

    // Validate email format if provided
    if (email) {
      if (!isEmail(email)) {
        throw new ValidationError('Please enter a valid email address');
      }
    }

    // Verify the contact exists and belongs to this account
    const existingContact = await prisma.contacts.findFirst({
      where: {
        id: contactId,
        creatoraccountid: accountId,
      },
    });

    if (!existingContact) {
      throw new NotFoundError('Contact not found');
    }

    // Update the contact
    const updatedContact = await prisma.contacts.update({
      where: { id: contactId },
      data: {
        firstname,
        lastname,
        middlename: middlename || '',
        email: email || null,
        phone1: phone1 || null,
        phone2: phone2 || null,
        phone3: phone3 || null,
        streetaddress: streetaddress || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        ...(dateofbirth ? { dateofbirth: new Date(dateofbirth) } : {}),
      },
    });

    res.json({
      success: true,
      data: {
        message: `Contact "${updatedContact.firstname} ${updatedContact.lastname}" updated successfully`,
        contact: {
          id: updatedContact.id.toString(),
          firstname: updatedContact.firstname,
          lastname: updatedContact.lastname,
          middlename: updatedContact.middlename,
          email: updatedContact.email,
          phone1: updatedContact.phone1,
          phone2: updatedContact.phone2,
          phone3: updatedContact.phone3,
          streetaddress: updatedContact.streetaddress,
          city: updatedContact.city,
          state: updatedContact.state,
          zip: updatedContact.zip,
          dateofbirth: updatedContact.dateofbirth ? updatedContact.dateofbirth.toISOString() : null,
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/contacts
 * Create a new contact in an account
 */
router.post(
  '/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const {
      firstname,
      lastname,
      middlename,
      email,
      phone1,
      phone2,
      phone3,
      streetaddress,
      city,
      state,
      zip,
      dateofbirth,
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname) {
      throw new ValidationError('First name and last name are required');
    }

    // Validate email format if provided
    if (email) {
      if (!isEmail(email)) {
        throw new ValidationError('Please enter a valid email address');
      }
    }

    // Create the contact
    const newContact = await prisma.contacts.create({
      data: {
        firstname,
        lastname,
        middlename: middlename || '',
        email: email || null,
        phone1: phone1 || null,
        phone2: phone2 || null,
        phone3: phone3 || null,
        streetaddress: streetaddress || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        creatoraccountid: accountId,
        dateofbirth: dateofbirth ? new Date(dateofbirth) : new Date('1900-01-01'),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        message: `Contact "${newContact.firstname} ${newContact.lastname}" created successfully`,
        contact: {
          id: newContact.id.toString(),
          firstname: newContact.firstname,
          lastname: newContact.lastname,
          middlename: newContact.middlename,
          email: newContact.email,
          phone1: newContact.phone1,
          phone2: newContact.phone2,
          phone3: newContact.phone3,
          streetaddress: newContact.streetaddress,
          city: newContact.city,
          state: newContact.state,
          zip: newContact.zip,
          dateofbirth: newContact.dateofbirth ? newContact.dateofbirth.toISOString() : null,
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/roster
 * Create a new roster entry (player) in an account
 */
router.post(
  '/:accountId/roster',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { contactId, submittedDriversLicense, firstYear } = req.body;

    if (!contactId) {
      throw new ValidationError('ContactId is required');
    }

    // Verify the contact exists and belongs to this account
    const contact = await prisma.contacts.findFirst({
      where: {
        id: BigInt(contactId),
        creatoraccountid: accountId,
      },
      select: {
        firstname: true,
        lastname: true,
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Check if a roster entry already exists for this contact
    const existingRoster = await prisma.roster.findFirst({
      where: {
        contactid: BigInt(contactId),
      },
    });

    if (existingRoster) {
      throw new ConflictError('A roster entry already exists for this contact');
    }

    // Create the roster entry
    const newRoster = await prisma.roster.create({
      data: {
        contactid: BigInt(contactId),
        submitteddriverslicense: submittedDriversLicense || false,
        firstyear: firstYear || 0,
      },
      include: {
        contacts: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        message: `Roster entry created for "${newRoster.contacts.firstname} ${newRoster.contacts.lastname}"`,
        player: {
          id: newRoster.id.toString(),
          contactId: newRoster.contactid.toString(),
          submittedDriversLicense: newRoster.submitteddriverslicense,
          firstYear: newRoster.firstyear,
          contact: newRoster.contacts,
        },
      },
    });
  }),
);

export default router;
