// Account Contacts & Users Management Routes for Draco Sports Manager
// Handles all contact and user management within accounts

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import { extractAccountParams, extractContactParams } from '../utils/paramExtraction.js';
import { handleContactPhotoUpload } from './utils/fileUpload.js';
import {
  ContactType,
  CreateContactSchema,
  CreateContactType,
  CreateContactRoleSchema,
  CreateContactRoleType,
  RoleWithContactType,
  ContactValidationWithSignInSchema,
  PagingType,
  PagingSchema,
} from '@draco/shared-schemas';
import {
  handlePhotoUploadMiddleware,
  parseFormDataJSON,
  validatePhotoUpload,
} from '../middleware/fileUpload.js';

const router = Router({ mergeParams: true });
const roleService = ServiceFactory.getRoleService();
const routeProtection = ServiceFactory.getRouteProtection();
const contactService = ServiceFactory.getContactService();
const registrationService = ServiceFactory.getRegistrationService();
const contactDependencyService = ServiceFactory.getContactDependencyService();

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

    const existing = await contactService.getContactByUserId(req.user!.id, BigInt(accountId));
    res.json(existing);
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

    const existingContact = await contactService.getContactByUserId(req.user!.id, accountId);
    if (existingContact) {
      throw new ConflictError('Already registered with this account');
    }

    const contactValidation = ContactValidationWithSignInSchema.parse(req.body);
    const registeredUser = await registrationService.registerAndCreateContactNewUser(
      accountId,
      contactValidation,
    );

    res.status(201).json(registeredUser);
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

    const updated = await contactService.unlinkContactUser(accountId, BigInt(contactId));
    res.json(updated);
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
    const paginationParams: PagingType = PagingSchema.parse(req.query);

    // Use ContactService to get contacts with roles
    const result = await contactService.getContactsWithRoles(accountId, parsedSeasonId, {
      includeRoles,
      onlyWithRoles: filterOnlyWithRoles,
      includeContactDetails,
      pagination: paginationParams,
    });

    res.json(result);
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

    const roleData: CreateContactRoleType = CreateContactRoleSchema.parse(req.body);

    const assignedRole: RoleWithContactType = await roleService.assignRole(
      accountId,
      contactId,
      roleData,
    );

    res.status(201).json(assignedRole);
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

    const contactRole = await roleService.removeRole(
      contactId,
      roleId,
      BigInt(roleData),
      accountId,
    );

    res.json(contactRole);
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

    // Parse season ID if provided
    const parsedSeasonId = seasonId && typeof seasonId === 'string' ? BigInt(seasonId) : null;

    // Parse pagination parameters for search results
    const paginationParams = PagingSchema.parse(req.query);

    // Use ContactService to get contacts with roles
    const result = await contactService.getContactsWithRoles(accountId, parsedSeasonId, {
      includeRoles,
      includeContactDetails,
      searchQuery: q ? q.toString() : undefined,
      pagination: paginationParams,
    });

    res.json(result);
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

    res.json(result);
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
  handlePhotoUploadMiddleware,
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
      contact = await contactService.getContact(accountId, BigInt(contactId));
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
  handlePhotoUploadMiddleware,
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
    const existingContact = await contactService.getContact(accountId, BigInt(contactId));

    if (!existingContact) {
      throw new NotFoundError('Contact not found');
    }

    // Check dependencies
    const dependencyCheck = await contactDependencyService.checkDependencies(contactId, accountId);

    // If only checking dependencies, return the result
    if (onlyCheck) {
      res.json({
        contact: existingContact,
        dependencyCheck,
      });
      return;
    }

    // Handle deletion
    if (!dependencyCheck.canDelete && !forceDelete) {
      throw new ValidationError(
        `Cannot delete contact "${existingContact.firstName} ${existingContact.lastName}": ${dependencyCheck.message}`,
      );
    }

    // Perform deletion
    if (forceDelete) {
      await contactDependencyService.forceDeleteContact(contactId, accountId);
    } else {
      await contactDependencyService.safeDeleteContact(contactId, accountId);
    }

    // Log the deletion for audit purposes
    console.log(
      `Contact deleted: ${existingContact.firstName} ${existingContact.lastName} (ID: ${contactId}) by user ${req.user?.username || 'unknown'} ${forceDelete ? '[FORCED]' : '[SAFE]'}`,
    );

    res.json({
      deletedContact: existingContact,
      dependenciesDeleted: dependencyCheck.totalDependencies,
      wasForced: forceDelete,
    });
  }),
);

export default router;
