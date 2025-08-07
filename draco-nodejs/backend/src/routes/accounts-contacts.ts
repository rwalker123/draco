// Account Contacts & Users Management Routes for Draco Sports Manager
// Handles all contact and user management within accounts

import { Router, Request, Response, NextFunction } from 'express';
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
import { ContactInputData } from '../interfaces/contactInterfaces';
import { ContactDependencyService } from '../services/contactDependencyService';
import { upload, handleContactPhotoUpload } from './contact-media';
import { getContactPhotoUrl } from '../config/logo';
import {
  validateContactUpdateDynamic,
  validatePhotoUpload,
  sanitizeContactData,
} from '../middleware/validation/contactValidation';
import { DateUtils } from '../utils/dateUtils';

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

    // Parse pagination parameters for search results
    const paginationParams = PaginationHelper.parseParams(req.query);

    // Use ContactService to get contacts with roles
    const result = await ContactService.getContactsWithRoles(accountId, parsedSeasonId, {
      includeRoles,
      includeContactDetails,
      searchQuery: q,
      pagination: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        sortBy: paginationParams.sortBy,
        sortOrder: paginationParams.sortOrder,
      },
    });

    // Transform contacts for search response format
    const searchContacts: ContactSearchResult[] = result.contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      middleName: contact.middleName,
      email: contact.email,
      userId: contact.userId,
      displayName: `${contact.firstName} ${contact.lastName}`,
      searchText: `${contact.firstName} ${contact.lastName} (${contact.email})`,
      photoUrl: contact.photoUrl,
      ...(includeRoles && { contactroles: contact.contactroles }),
      ...(includeContactDetails &&
        contact.contactDetails && { contactDetails: contact.contactDetails }),
    }));

    res.json({
      success: true,
      data: {
        contacts: searchContacts,
      },
      pagination: result.pagination,
    });
  }),
);

/**
 * PUT /api/accounts/:accountId/contacts/:contactId
 * Update contact information (includes photo upload)
 */
router.put(
  '/:accountId/contacts/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  validatePhotoUpload,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('photo')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(400).json({
          success: false,
          message: message,
        });
      } else {
        next();
      }
    });
  },
  validateContactUpdateDynamic,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    // Sanitize the input data
    const sanitizedData: ContactInputData = sanitizeContactData(req.body);
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
    } = sanitizedData;

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

    // Build update data object, only including fields that are provided
    const updateData: Record<string, string | Date | null> = {};

    if (firstname !== undefined) updateData.firstname = firstname as string;
    if (lastname !== undefined) updateData.lastname = lastname as string;
    if (middlename !== undefined) updateData.middlename = middlename || '';
    if (email !== undefined) updateData.email = email || null;
    if (phone1 !== undefined) updateData.phone1 = phone1 || null;
    if (phone2 !== undefined) updateData.phone2 = phone2 || null;
    if (phone3 !== undefined) updateData.phone3 = phone3 || null;
    if (streetaddress !== undefined) updateData.streetaddress = streetaddress || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (zip !== undefined) updateData.zip = zip || null;
    if (dateofbirth !== undefined)
      updateData.dateofbirth = DateUtils.parseDateOfBirthForDatabase(dateofbirth as string | null);

    console.log('Backend: Update data being applied:', updateData);
    console.log('Backend: Has photo file:', !!req.file);

    // Update the contact (only if we have data to update)
    let updatedContact = existingContact;
    if (Object.keys(updateData).length > 0) {
      updatedContact = await prisma.contacts.update({
        where: { id: contactId },
        data: updateData,
      });
    }

    // Handle photo upload if provided
    let photoUrl = null;
    if (req.file) {
      photoUrl = await handleContactPhotoUpload(req, accountId, contactId);
    } else {
      // Generate photo URL for existing photo (if any)
      photoUrl = getContactPhotoUrl(accountId.toString(), contactId.toString());
    }

    res.json({
      success: true,
      data: {
        message: `Contact "${updatedContact.firstname} ${updatedContact.lastname}" updated successfully`,
        contact: {
          id: updatedContact.id.toString(),
          firstname: updatedContact.firstname,
          lastname: updatedContact.lastname,
          middlename: updatedContact.middlename,
          email: updatedContact.email || undefined,
          phone1: updatedContact.phone1 || undefined,
          phone2: updatedContact.phone2 || undefined,
          phone3: updatedContact.phone3 || undefined,
          streetaddress: updatedContact.streetaddress || undefined,
          city: updatedContact.city || undefined,
          state: updatedContact.state || undefined,
          zip: updatedContact.zip || undefined,
          dateofbirth: DateUtils.formatDateOfBirthForResponse(updatedContact.dateofbirth),
          photoUrl,
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/contacts
 * Create a new contact in an account (includes photo upload)
 */
router.post(
  '/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  validatePhotoUpload,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('photo')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(400).json({
          success: false,
          message: message,
        });
      } else {
        next();
      }
    });
  },
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Sanitize the input data
    const sanitizedData: ContactInputData = sanitizeContactData(req.body);
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
    } = sanitizedData;

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

    console.log('Backend: Creating contact with data:', {
      firstname,
      lastname,
      hasPhotoFile: !!req.file,
    });

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
        dateofbirth: DateUtils.parseDateOfBirthForDatabase(dateofbirth),
      },
    });

    // Handle photo upload if provided
    let photoUrl = null;
    if (req.file) {
      photoUrl = await handleContactPhotoUpload(req, accountId, newContact.id);
    } else {
      // Generate photo URL for existing photo (if any)
      photoUrl = getContactPhotoUrl(accountId.toString(), newContact.id.toString());
    }

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
          dateofbirth: DateUtils.formatDateOfBirthForResponse(newContact.dateofbirth),
          photoUrl,
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

/**
 * DELETE /api/accounts/:accountId/contacts/:contactId
 * Delete a contact from an account
 * Query parameters:
 *   - force=true to bypass dependency checks and force deletion
 *   - check=true to only check dependencies without deleting
 */
router.delete(
  '/:accountId/contacts/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
    const { force, check } = req.query;
    const forceDelete = force === 'true';
    const onlyCheck = check === 'true';

    // Verify the contact exists and belongs to this account first
    const existingContact = await prisma.contacts.findFirst({
      where: {
        id: contactId,
        creatoraccountid: accountId,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
      },
    });

    if (!existingContact) {
      throw new NotFoundError('Contact not found');
    }

    // Check dependencies
    const dependencyCheck = await ContactDependencyService.checkDependencies(contactId, accountId);

    // If only checking dependencies, return the result
    if (onlyCheck) {
      res.json({
        success: true,
        data: {
          contact: {
            id: existingContact.id.toString(),
            firstName: existingContact.firstname,
            lastName: existingContact.lastname,
            email: existingContact.email,
          },
          dependencyCheck,
        },
      });
      return;
    }

    // Handle deletion
    if (!dependencyCheck.canDelete && !forceDelete) {
      throw new ValidationError(
        `Cannot delete contact "${existingContact.firstname} ${existingContact.lastname}": ${dependencyCheck.message}`,
      );
    }

    // Perform deletion
    if (forceDelete) {
      await ContactDependencyService.forceDeleteContact(contactId, accountId);
    } else {
      await ContactDependencyService.safeDeleteContact(contactId, accountId);
    }

    // Log the deletion for audit purposes
    console.log(
      `Contact deleted: ${existingContact.firstname} ${existingContact.lastname} (ID: ${contactId}) by user ${req.user?.username || 'unknown'} ${forceDelete ? '[FORCED]' : '[SAFE]'}`,
    );

    res.json({
      success: true,
      data: {
        message: `Contact "${existingContact.firstname} ${existingContact.lastname}" deleted successfully`,
        deletedContact: {
          id: existingContact.id.toString(),
          firstName: existingContact.firstname,
          lastName: existingContact.lastname,
          email: existingContact.email,
        },
        dependenciesDeleted: dependencyCheck.totalDependencies,
        wasForced: forceDelete,
      },
    });
  }),
);

export default router;
