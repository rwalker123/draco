// Account Contacts & Users Management Routes
// Handles all contact and user management within accounts

import { Router, Request, Response } from 'express';
import contentDisposition from 'content-disposition';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import { extractAccountParams, extractContactParams } from '../utils/paramExtraction.js';
import { handleContactPhotoUpload } from './utils/fileUpload.js';
import prisma from '../lib/prisma.js';
import {
  BaseContactType,
  ContactType,
  CreateContactSchema,
  CreateContactType,
  CreateContactRoleSchema,
  CreateContactRoleType,
  RoleWithContactType,
  ContactSearchParamsSchema,
  ContactValidationSchema,
  PublicContactSearchQuerySchema,
  PublicContactSummaryType,
} from '@draco/shared-schemas';
import {
  handlePhotoUploadMiddleware,
  parseFormDataJSON,
  validatePhotoUpload,
} from '../middleware/fileUpload.js';
import { AutoRegisterContactResponseType } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const roleService = ServiceFactory.getRoleService();
const routeProtection = ServiceFactory.getRouteProtection();
const contactService = ServiceFactory.getContactService();
const registrationService = ServiceFactory.getRegistrationService();
const contactDependencyService = ServiceFactory.getContactDependencyService();
const csvExportService = ServiceFactory.getCsvExportService();

const buildSelfUpdatePayload = (
  existingContact: BaseContactType,
  incoming: Partial<CreateContactType>,
): CreateContactType => {
  type ContactDetailsInput = NonNullable<CreateContactType['contactDetails']>;

  const fallbackDetails: ContactDetailsInput = {
    phone1: existingContact.contactDetails?.phone1 ?? '',
    phone2: existingContact.contactDetails?.phone2 ?? '',
    phone3: existingContact.contactDetails?.phone3 ?? '',
    streetAddress: existingContact.contactDetails?.streetAddress ?? '',
    city: existingContact.contactDetails?.city ?? '',
    state: existingContact.contactDetails?.state ?? '',
    zip: existingContact.contactDetails?.zip ?? '',
    dateOfBirth: existingContact.contactDetails?.dateOfBirth ?? '',
  };

  const incomingDetails: Partial<ContactDetailsInput> =
    (incoming.contactDetails as Partial<ContactDetailsInput> | undefined) ?? {};

  const mergedContact: CreateContactType = CreateContactSchema.parse({
    firstName: incoming.firstName ?? existingContact.firstName,
    lastName: incoming.lastName ?? existingContact.lastName,
    middleName: incoming.middleName ?? existingContact.middleName ?? undefined,
    email: incoming.email ?? existingContact.email ?? undefined,
    contactDetails: {
      phone1: incomingDetails.phone1 ?? fallbackDetails.phone1,
      phone2: incomingDetails.phone2 ?? fallbackDetails.phone2,
      phone3: incomingDetails.phone3 ?? fallbackDetails.phone3,
      streetAddress: incomingDetails.streetAddress ?? fallbackDetails.streetAddress,
      city: incomingDetails.city ?? fallbackDetails.city,
      state: incomingDetails.state ?? fallbackDetails.state,
      zip: incomingDetails.zip ?? fallbackDetails.zip,
      dateOfBirth: fallbackDetails.dateOfBirth,
    },
  });

  return mergedContact;
};

router.get(
  '/:accountId/contacts/public-search',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { query, limit } = PublicContactSearchQuerySchema.parse(req.query);

    const results: PublicContactSummaryType[] = await contactService.searchContactsPublic(
      accountId,
      query,
      limit,
    );

    res.json({ results });
  }),
);

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

router.put(
  '/:accountId/contacts/me',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = req.user!.id;

    const existingContact = await contactService.getContactByUserId(userId, BigInt(accountId));

    const incoming = (req.body ?? {}) as Partial<CreateContactType>;
    const contactUpdate = buildSelfUpdatePayload(existingContact, incoming);

    const updatedContact = await contactService.updateContact(
      contactUpdate,
      BigInt(existingContact.id),
    );

    res.json(updatedContact);
  }),
);

/**
 * GET /api/accounts/:accountId/contacts/birthdays/today
 * Public endpoint to list current season players with birthdays today
 */
router.get(
  '/:accountId/contacts/birthdays/today',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const birthdays: BaseContactType[] = await contactService.getTodaysBirthdays(accountId);

    res.json(birthdays);
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

    try {
      const existingContact = await contactService.getContactByUserId(req.user!.id, accountId);
      if (existingContact) {
        throw new ConflictError('Already registered with this account');
      }
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }

    const contactValidation = ContactValidationSchema.parse(req.body);
    const registeredUser = await registrationService.selfRegisterContact(
      req.user!.id,
      accountId,
      contactValidation,
    );

    res.status(201).json(registeredUser);
  }),
);

/**
 * POST /api/accounts/:accountId/contacts/:contactId/auto-register
 * Attempt to auto-register a contact using their email
 */
router.post(
  '/:accountId/contacts/:contactId/auto-register',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    const result: AutoRegisterContactResponseType = await registrationService.autoRegisterContact(
      accountId,
      contactId,
    );

    if (result.status === 'conflict-other-contact') {
      res.status(409).json(result);
      return;
    }

    res.json(result);
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
 * DELETE /api/accounts/:accountId/contacts/:contactId/roles/:roleId
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
 * GET /api/accounts/:accountId/contacts
 * Search contacts by name for autocomplete
 * Required query parameter: q=searchTerm
 * Optional query parameters:
 *   - roles=true to include contactroles data with role context
 *   - seasonId=123 to filter roles by season context (required for proper team/league role resolution)
 *   - contactDetails=true to include detailed contact information (phone, address, etc.)
 */
router.get(
  '/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Parse season ID if provided

    const searchParams = ContactSearchParamsSchema.parse(req.query);
    const parsedSeasonId = searchParams.seasonId ? BigInt(searchParams.seasonId) : undefined;

    const includeRoles = searchParams.includeRoles;
    const includeContactDetails = searchParams.contactDetails;
    const filterOnlyWithRoles = searchParams.onlyWithRoles;

    // Construct pagination object from flat params (API client serializes as flat query params)
    // Backend calculates skip from page/limit anyway, but PagingType requires it
    const pagination = {
      page: searchParams.page,
      limit: searchParams.limit,
      skip: (searchParams.page - 1) * searchParams.limit,
      sortBy: searchParams.sortBy,
      sortOrder: searchParams.sortOrder,
    };

    // Use ContactService to get contacts with roles
    const result = await contactService.getContactsWithRoles(accountId, parsedSeasonId, {
      includeRoles,
      onlyWithRoles: filterOnlyWithRoles,
      includeContactDetails,
      searchQuery: searchParams.q ? searchParams.q.toString() : undefined,
      pagination,
    });

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/contacts/export
 * Export contacts to CSV
 * Query parameters:
 *   - searchTerm: Optional search term to filter contacts
 *   - onlyWithRoles: If true, only export contacts that have roles
 *   - seasonId: Optional season ID to scope role filtering (required when onlyWithRoles is true)
 */
router.get(
  '/:accountId/contacts/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { searchTerm, onlyWithRoles, seasonId } = req.query;

    const account = await prisma.accounts.findUnique({
      where: { id: accountId },
      select: { name: true },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const parsedSeasonId = typeof seasonId === 'string' && seasonId ? BigInt(seasonId) : undefined;

    const result = await csvExportService.exportContacts(accountId, account.name, {
      searchTerm: typeof searchTerm === 'string' ? searchTerm : undefined,
      onlyWithRoles: onlyWithRoles === 'true',
      seasonId: parsedSeasonId,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

/**
 * GET /api/accounts/:accountId/contacts/:contactId
 * Retrieve a single contact by ID
 */
router.get(
  '/:accountId/contacts/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    const contact = await contactService.getNamedContact(accountId, contactId);

    res.json(contact);
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
