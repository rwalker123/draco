// Account Contacts & Users Management Routes for Draco Sports Manager
// Handles all contact and user management within accounts

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import validator from 'validator';
import { asyncHandler } from './utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import { extractAccountParams, extractContactParams } from '../utils/paramExtraction.js';
import { PaginationHelper } from '../utils/pagination.js';
import prisma from '../lib/prisma.js';
import { ContactSearchResult } from '../interfaces/accountInterfaces.js';
import { ContactDependencyService } from '../services/contactDependencyService.js';
import { handleContactPhotoUpload } from './utils/fileUpload.js';
import { sanitizeContactData } from '../middleware/validation/contactValidation.js';
import { DateUtils } from '../utils/dateUtils.js';
import { logRegistrationEvent } from '../utils/auditLogger.js';
import { ContactValidationService, ValidationType } from '../utils/contactValidation.js';
import { ContactType, CreateContactSchema, CreateContactType } from '@draco/shared-schemas';
import {
  handleContactPhotoUploadMiddleware,
  parseFormDataJSON,
  validatePhotoUpload,
} from '../middleware/fileUpload.js';

const router = Router({ mergeParams: true });
export const roleService = ServiceFactory.getRoleService();
const routeProtection = ServiceFactory.getRouteProtection();
const contactSecurityService = ServiceFactory.getContactSecurityService();
const contactService = ServiceFactory.getContactService();

/**
 * GET /api/accounts/:accountId/contacts/:contactId/roster
 * Get contact roster
 */
router.get(
  '/:accountId/contacts/:contactId/roster',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contactId } = extractContactParams(req.params);

    const roster = await contactService.getContactRoster(BigInt(contactId));

    if (!roster) {
      throw new NotFoundError('Roster not found');
    }

    res.json(roster);
  }),
);

/**
 * GET /api/accounts/:accountId/contacts/me
 * Get current user's contact
 */
router.get(
  '/:accountId/contacts/me',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const existing = await prisma.contacts.findFirst({
      where: {
        userid: req.user!.id,
        creatoraccountid: accountId,
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Not registered with this account' });
      return;
    }

    res.json({
      success: true,
      data: {
        contact: {
          id: existing.id.toString(),
          firstname: existing.firstname,
          lastname: existing.lastname,
          middlename: existing.middlename,
          email: existing.email || undefined,
          phone1: existing.phone1 || undefined,
          phone2: existing.phone2 || undefined,
          phone3: existing.phone3 || undefined,
          streetaddress: existing.streetaddress || undefined,
          city: existing.city || undefined,
          state: existing.state || undefined,
          zip: existing.zip || undefined,
          dateofbirth: DateUtils.formatDateOfBirthForResponse(existing.dateofbirth),
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/contacts/me/link-by-name
 * Link a contact to the authenticated user by name
 */
router.post(
  '/:accountId/contacts/me/link-by-name',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { firstName, middleName, lastName, validationType, streetAddress, dateOfBirth } =
      req.body || {};
    const start = Date.now();

    // Validate required validation type and corresponding field
    if (validationType && validationType !== 'streetAddress' && validationType !== 'dateOfBirth') {
      res.status(400).json({
        success: false,
        message: 'Invalid validation type. Must be "streetAddress" or "dateOfBirth"',
      });
      return;
    }

    // Use enhanced validation if validation type is provided, otherwise fall back to name-only matching
    if (validationType) {
      const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
        firstName,
        middleName,
        lastName,
        validationType: validationType as ValidationType,
        streetAddress,
        dateOfBirth,
      });

      if (!validationResult.success) {
        logRegistrationEvent(req, 'registration_linkByName', 'validation_error', {
          accountId,
          timingMs: Date.now() - start,
        });
        res.status(validationResult.statusCode || 400).json({
          success: false,
          message: validationResult.error,
        });
        return;
      }

      const contact = validationResult.contact!;

      // Link the contact to the authenticated user
      const updated = await prisma.contacts.update({
        where: { id: contact.id },
        data: { userid: req.user!.id },
      });

      logRegistrationEvent(req, 'registration_linkByName', 'success', {
        accountId,
        userId: req.user!.id,
        validationType: validationType as string | undefined,
        timingMs: Date.now() - start,
      });

      res.json({
        success: true,
        data: {
          contact: {
            id: updated.id.toString(),
            firstname: updated.firstname,
            lastname: updated.lastname,
            middlename: updated.middlename,
            email: updated.email || undefined,
          },
        },
      });
      return;
    }

    // Legacy name-only matching for backward compatibility
    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: 'First and last name are required' });
      return;
    }

    // Build case-insensitive filters for name-only matching
    const whereClause: {
      creatoraccountid: bigint;
      userid: null;
      firstname: { equals: string; mode: 'insensitive' };
      lastname: { equals: string; mode: 'insensitive' };
      middlename?: { equals: string; mode: 'insensitive' };
    } = {
      creatoraccountid: accountId,
      userid: null,
      firstname: { equals: String(firstName), mode: 'insensitive' },
      lastname: { equals: String(lastName), mode: 'insensitive' },
    };
    if (typeof middleName === 'string' && middleName.trim().length > 0) {
      whereClause.middlename = { equals: String(middleName), mode: 'insensitive' };
    }

    const candidates = await prisma.contacts.findMany({ where: whereClause });

    if (candidates.length === 0) {
      logRegistrationEvent(req, 'registration_linkByName', 'not_found', {
        accountId,
        timingMs: Date.now() - start,
      });
      res.status(404).json({ success: false, message: 'No matching contact found' });
      return;
    }
    if (candidates.length > 1) {
      logRegistrationEvent(req, 'registration_linkByName', 'duplicate_matches', {
        accountId,
        timingMs: Date.now() - start,
      });
      res.status(404).json({
        success: false,
        message: 'Multiple matching contacts found. Please contact admin.',
      });
      return;
    }

    const contact = candidates[0];
    if (contact.userid) {
      logRegistrationEvent(req, 'registration_linkByName', 'already_linked', {
        accountId,
        timingMs: Date.now() - start,
      });
      res.status(409).json({ success: false, message: 'Contact is already linked to a user' });
      return;
    }

    const updated = await prisma.contacts.update({
      where: { id: contact.id },
      data: { userid: req.user!.id },
    });

    logRegistrationEvent(req, 'registration_linkByName', 'success', {
      accountId,
      userId: req.user!.id,
      timingMs: Date.now() - start,
    });
    res.json({
      success: true,
      data: {
        contact: {
          id: updated.id.toString(),
          firstname: updated.firstname,
          lastname: updated.lastname,
          middlename: updated.middlename,
          email: updated.email || undefined,
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/contacts/me
 * Self-register a contact
 */
router.post(
  '/:accountId/contacts/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const start = Date.now();

    // Guard: existing membership
    const existing = await prisma.contacts.findFirst({
      where: {
        userid: req.user!.id,
        creatoraccountid: accountId,
      },
    });
    if (existing) {
      logRegistrationEvent(req, 'registration_selfRegister', 'already_linked', {
        accountId,
        userId: req.user!.id,
        timingMs: Date.now() - start,
      });
      res.status(409).json({ success: false, message: 'Already registered with this account' });
      return;
    }

    // Normalize input: accept camelCase from FE, convert to backend lowercase for processing
    const body = req.body || {};
    const normalizedInput: Record<string, unknown> = {
      firstname: body.firstname ?? body.firstName,
      middlename: body.middlename ?? body.middleName,
      lastname: body.lastname ?? body.lastName,
      email: body.email,
      validationType: body.validationType,
      streetAddress: body.streetAddress,
      dateOfBirth: body.dateOfBirth,
    };

    const { firstname, middlename, lastname } = sanitizeContactData(normalizedInput);
    const { validationType, streetAddress, dateOfBirth } = normalizedInput;

    // Use enhanced validation if validation type is provided
    if (validationType) {
      const validationResult = await ContactValidationService.findAndValidateContact(accountId, {
        firstName: firstname || '',
        middleName: middlename,
        lastName: lastname || '',
        validationType: validationType as ValidationType,
        streetAddress: streetAddress as string | undefined,
        dateOfBirth: dateOfBirth as string | undefined,
      });

      if (!validationResult.success) {
        logRegistrationEvent(req, 'registration_selfRegister', 'validation_error', {
          accountId,
          timingMs: Date.now() - start,
        });
        res.status(validationResult.statusCode || 400).json({
          success: false,
          message: validationResult.error,
        });
        return;
      }

      const contact = validationResult.contact!;

      // Link the contact to the authenticated user
      const updated = await prisma.contacts.update({
        where: { id: contact.id },
        data: { userid: req.user!.id },
      });

      logRegistrationEvent(req, 'registration_selfRegister', 'success', {
        accountId,
        userId: req.user!.id,
        validationType: validationType as string | undefined,
        timingMs: Date.now() - start,
      });

      res.status(201).json({
        success: true,
        data: {
          contact: {
            id: updated.id.toString(),
            firstname: updated.firstname,
            lastname: updated.lastname,
            middlename: updated.middlename,
            email: updated.email || undefined,
            dateofbirth: DateUtils.formatDateOfBirthForResponse(updated.dateofbirth),
          },
        },
      });
      return;
    }

    // Legacy: Create new contact (for backward compatibility when no validation type provided)
    const email = normalizedInput.email as string;

    // Validate required fields and email format
    if (!firstname || !lastname) {
      res.status(400).json({ success: false, message: 'First name and last name are required' });
      return;
    }
    if (email && !validator.isEmail(email)) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    const created = await prisma.contacts.create({
      data: {
        userid: req.user!.id,
        creatoraccountid: accountId,
        firstname,
        lastname,
        middlename: middlename || '',
        email: email || null,
        dateofbirth: DateUtils.parseDateOfBirthForDatabase(null),
      },
    });

    logRegistrationEvent(req, 'registration_selfRegister', 'success', {
      accountId,
      userId: req.user!.id,
      timingMs: Date.now() - start,
    });
    res.status(201).json({
      success: true,
      data: {
        contact: {
          id: created.id.toString(),
          firstname: created.firstname,
          lastname: created.lastname,
          middlename: created.middlename,
          email: created.email || undefined,
          dateofbirth: DateUtils.formatDateOfBirthForResponse(created.dateofbirth),
        },
      },
    });
  }),
);

/**
 * DELETE /api/accounts/:accountId/contacts/:contactId/registration
 * Unlink a contact from a user (clear userid) within an account
 */
router.delete(
  '/:accountId/contacts/:contactId/registration',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    const existingContact = await contactSecurityService.getValidatedContact(contactId, accountId, {
      id: true,
      userid: true,
      firstname: true,
      lastname: true,
      email: true,
    });

    if (!existingContact) {
      throw new NotFoundError('Contact not found');
    }

    if (existingContact.userid === null) {
      res.status(409).json({ success: false, message: 'Contact is not registered' });
      return;
    }

    const updated = await prisma.contacts.update({
      where: { id: existingContact.id },
      data: { userid: null },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        userid: true,
      },
    });

    logRegistrationEvent(req, 'registration_revoke', 'success', {
      accountId,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: {
        contact: {
          id: updated.id.toString(),
          firstname: updated.firstname,
          lastname: updated.lastname,
          email: updated.email || undefined,
          userid: updated.userid,
        },
      },
    });
  }),
);

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
    const result = await contactService.getContactsWithRoles(accountId, parsedSeasonId, {
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
    } catch (_error) {
      throw new ValidationError('Role data must be a valid numeric ID');
    }

    // Validate seasonId if provided
    let seasonIdBigInt: bigint | undefined;
    if (seasonId !== undefined && seasonId !== null) {
      try {
        seasonIdBigInt = BigInt(seasonId);
      } catch (_error) {
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
    const result = await contactService.getContactsWithRoles(accountId, parsedSeasonId, {
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
 * GET /api/accounts/:accountId/automatic-role-holders
 * Get automatic role holders (Account Owner and Team Managers) for the current season
 */
router.get(
  '/:accountId/automatic-role-holders',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const result = await contactService.getAutomaticRoleHolders(accountId);

    res.json({
      success: true,
      data: result,
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
  handleContactPhotoUploadMiddleware,
  parseFormDataJSON,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    // Check if we have either body data or a file
    const hasBodyData = req.body && Object.keys(req.body).length > 0;
    if (!hasBodyData && !req.file) {
      throw new ValidationError('No data to save');
    }

    // validate the request body
    let contact: ContactType | null;
    if (hasBodyData) {
      const updateContactData: CreateContactType = CreateContactSchema.parse(req.body);

      contact = await contactService.updateContact(updateContactData, BigInt(contactId));
    } else {
      contact = await contactService.getContact(BigInt(contactId));
      if (!contact) {
        throw new NotFoundError('Contact not found');
      }
    }

    // Handle photo upload if provided
    if (req.file) {
      await handleContactPhotoUpload(req, accountId, contactId);
    }

    res.json(contact);
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
  handleContactPhotoUploadMiddleware,
  parseFormDataJSON,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const createContactData: CreateContactType = CreateContactSchema.parse(req.body);
    const contact: ContactType = await contactService.createContact(
      createContactData,
      BigInt(accountId),
    );

    // Handle photo upload if provided
    if (req.file) {
      await handleContactPhotoUpload(req, accountId, BigInt(contact.id));
    }

    res.status(201).json(contact);
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
    const existingContact = await contactSecurityService.getValidatedContact(contactId, accountId, {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
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
