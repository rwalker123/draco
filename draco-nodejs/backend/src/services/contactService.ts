import { contacts } from '@prisma/client';
import { ContactQueryOptions } from '../interfaces/contactInterfaces.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  AutomaticRoleHoldersType,
  BaseContactType,
  PagedContactType,
  CreateContactType,
  RosterPlayerType,
  ContactValidationType,
} from '@draco/shared-schemas';
import { ConflictError, NotFoundError } from '../utils/customErrors.js';
import {
  ContactResponseFormatter,
  TeamResponseFormatter,
} from '../responseFormatters/responseFormatters.js';
import {
  RepositoryFactory,
  IContactRepository,
  dbRosterPlayer,
  ISeasonRepository,
  ITeamRepository,
} from '../repositories/index.js';

export class ContactService {
  private contactRepository: IContactRepository;
  private seasonRepository: ISeasonRepository;
  private teamRepository: ITeamRepository;

  constructor() {
    this.contactRepository = RepositoryFactory.getContactRepository();
    this.seasonRepository = RepositoryFactory.getSeasonRepository();
    this.teamRepository = RepositoryFactory.getTeamRepository();
  }

  /**
   * Get a contact's roster
   * @param contactId
   * @returns RosterPlayerType
   */
  async getContactRoster(contactId: bigint): Promise<RosterPlayerType> {
    const dbRoster: dbRosterPlayer | null =
      await this.contactRepository.findRosterByContactId(contactId);

    if (!dbRoster) {
      throw new NotFoundError('Roster not found');
    }

    const response = ContactResponseFormatter.formatRosterPlayerResponse(dbRoster);
    return response;
  }

  /**
   * Get a contact
   * @param contactId
   * @returns BaseContactType
   */
  async getContact(accountId: bigint, contactId: bigint): Promise<BaseContactType | null> {
    const dbContact = await this.contactRepository.findContactInAccount(contactId, accountId);
    if (!dbContact) {
      throw new NotFoundError('Contact not found');
    }
    return ContactResponseFormatter.formatContactResponse(dbContact);
  }

  /**
   * Get a contact by user ID
   * @param userId
   * @returns BaseContactType
   */
  async getContactByUserId(userId: string, accountId: bigint): Promise<BaseContactType | null> {
    const dbContact = await this.contactRepository.findByUserId(userId, accountId);
    if (!dbContact) {
      throw new NotFoundError('Contact not found');
    }
    return ContactResponseFormatter.formatContactResponse(dbContact);
  }

  /**
   * Register a contact user
   * @param userId
   * @param contactId
   * @returns BaseContactType
   */
  async registerContactUser(userId: string, contactId: bigint): Promise<BaseContactType> {
    const updatedContact = await this.contactRepository.update(contactId, {
      userid: userId,
    });

    return ContactResponseFormatter.formatContactResponse(updatedContact);
  }

  /**
   * Unlink a contact user
   * @param userId
   * @param contactId
   * @returns BaseContactType
   */
  async unlinkContactUser(accountId: bigint, contactId: bigint): Promise<BaseContactType> {
    const existingContact = await this.getContact(accountId, BigInt(contactId));

    if (!existingContact) {
      throw new NotFoundError('Contact not found');
    }

    if (existingContact.userId === null) {
      throw new ConflictError('Contact is not registered');
    }

    const updatedContact = await this.contactRepository.update(contactId, {
      userid: null,
    });

    return ContactResponseFormatter.formatContactResponse(updatedContact);
  }

  /**
   * Create a contact
   * @param contact
   * @returns BaseContactType
   */
  async createContact(contact: CreateContactType, accountId: bigint): Promise<BaseContactType> {
    // convert to db contact
    const dbCreateContact: Partial<contacts> = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      middlename: contact.middleName || '',
      email: contact.email || null,
      phone1: contact.contactDetails?.phone1 || null,
      phone2: contact.contactDetails?.phone2 || null,
      phone3: contact.contactDetails?.phone3 || null,
      creatoraccountid: accountId,
      streetaddress: contact.contactDetails?.streetAddress || null,
      city: contact.contactDetails?.city || null,
      state: contact.contactDetails?.state || null,
      zip: contact.contactDetails?.zip || null,
      dateofbirth: contact.contactDetails?.dateOfBirth
        ? DateUtils.parseDateOfBirthForDatabase(contact.contactDetails.dateOfBirth)
        : new Date('1900-01-01'),
    };

    const dbContact = await this.contactRepository.create(dbCreateContact);
    return ContactResponseFormatter.formatContactResponse(dbContact);
  }

  /**
   * Update a contact
   * @param contact
   * @returns BaseContactType
   */
  async updateContact(contact: CreateContactType, contactId: bigint): Promise<BaseContactType> {
    // convert to db contact
    const dbCreateContact: Partial<contacts> = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      middlename: contact.middleName || '',
      email: contact.email || null,
      phone1: contact.contactDetails?.phone1 || null,
      phone2: contact.contactDetails?.phone2 || null,
      phone3: contact.contactDetails?.phone3 || null,
      streetaddress: contact.contactDetails?.streetAddress || null,
      city: contact.contactDetails?.city || null,
      state: contact.contactDetails?.state || null,
      zip: contact.contactDetails?.zip || null,
      dateofbirth: contact.contactDetails?.dateOfBirth
        ? DateUtils.parseDateOfBirthForDatabase(contact.contactDetails.dateOfBirth)
        : new Date('1900-01-01'),
    };

    const dbContact = await this.contactRepository.update(contactId, dbCreateContact);
    return ContactResponseFormatter.formatContactResponse(dbContact);
  }

  /**
   * Get contacts with their roles for a specific account and season
   * Uses raw SQL for complex role context joins when includeRoles is true
   * @param accountId - The account ID to get contacts for
   * @param seasonId - The season ID for role context (optional, defaults to null for backward compatibility)
   * @param options - Query options including includeRoles, searchQuery, and pagination
   */
  async getContactsWithRoles(
    accountId: bigint,
    seasonId?: bigint | null,
    options: ContactQueryOptions = {},
  ): Promise<PagedContactType> {
    const { includeRoles = false, pagination, includeContactDetails = false } = options;

    if (pagination && pagination.page < 1) {
      pagination.page = 1;
    }

    // If roles are not requested, use the simple Prisma query
    if (!includeRoles) {
      return this.getContactsSimple(accountId, options);
    }

    const rows = await this.contactRepository.searchContactsWithRoles(accountId, options, seasonId);

    // Transform the flat rows into the desired structure
    return ContactResponseFormatter.formatPagedContactRolesResponse(
      rows,
      accountId,
      pagination,
      includeContactDetails,
    );
  }

  /**
   * Simple contact query without roles using Prisma ORM
   */
  private async getContactsSimple(
    accountId: bigint,
    options: ContactQueryOptions = {},
  ): Promise<PagedContactType> {
    const { includeContactDetails, pagination } = options;

    const contactsWithTotalCount = await this.contactRepository.searchContactsByName(
      accountId,
      options,
    );

    const response: PagedContactType = ContactResponseFormatter.formatPagedContactResponse(
      accountId,
      contactsWithTotalCount,
      includeContactDetails,
      pagination,
    );
    return response;
  }

  /**
   * Get automatic role holders (Account Owner and Team Managers) for the current season
   */
  async getAutomaticRoleHolders(accountId: bigint): Promise<AutomaticRoleHoldersType> {
    try {
      // No current season, but we still need to return account owner
      const dbAccountOwner = await this.contactRepository.findAccountOwner(accountId);

      if (!dbAccountOwner) {
        throw new Error(`Account owner not found for account ${accountId.toString()}`);
      }

      const accountOwner = ContactResponseFormatter.formatContactResponse(dbAccountOwner);

      const dbCurrentSeason = await this.seasonRepository.findCurrentSeason(accountId);
      if (!dbCurrentSeason) {
        return {
          accountOwner,
          teamManagers: [], // No team managers without a current season
        };
      }

      const dbTeamManagers = await this.teamRepository.findTeamSeasonManagers(
        dbCurrentSeason.id,
        accountId,
      );

      const teamManagers = TeamResponseFormatter.formatTeamManagerWithTeams(
        accountId,
        dbTeamManagers,
      );
      return {
        accountOwner,
        teamManagers,
      };
    } catch (error) {
      console.error('Error getting automatic role holders:', error);
      throw error;
    }
  }

  /**
   * Find and validate a contact
   * @param accountId
   * @param whereClause
   */
  async findAndValidateContact(
    accountId: bigint,
    input: ContactValidationType,
  ): Promise<BaseContactType[]> {
    // Build base query for name matching
    const whereClause: {
      creatoraccountid: bigint;
      userid?: null | undefined;
      firstname: { equals: string; mode: 'insensitive' };
      lastname: { equals: string; mode: 'insensitive' };
      middlename?: { equals: string; mode: 'insensitive' };
      streetaddress?: { equals: string; mode: 'insensitive' };
      dateofbirth?: Date;
    } = {
      creatoraccountid: accountId,
      firstname: { equals: input.firstName.trim(), mode: 'insensitive' },
      lastname: { equals: input.lastName.trim(), mode: 'insensitive' },
    };

    // Add middle name if provided
    if (input.middleName && input.middleName.trim().length > 0) {
      whereClause.middlename = { equals: input.middleName.trim(), mode: 'insensitive' };
    }

    // Add validation field based on type
    if (input.validationType === 'streetAddress') {
      whereClause.streetaddress = {
        equals: input.contactDetails!.streetAddress!.trim(),
        mode: 'insensitive',
      };
    } else if (input.validationType === 'dateOfBirth') {
      // Use the same DateUtils logic that was used when originally storing the contact
      // This ensures we create the exact same Date object for database matching
      const parsedDate = DateUtils.parseDateOfBirthForDatabase(input.contactDetails!.dateOfBirth!);
      whereClause.dateofbirth = parsedDate;
    }

    const dbContacts = await this.contactRepository.findMany({
      whereClause,
    });

    return dbContacts.map((dbContact) => ContactResponseFormatter.formatContactResponse(dbContact));
  }

  /**
   * Check if the contact is the account owner
   */
  async checkIfAccountOwner(contactId: bigint, accountId: bigint): Promise<boolean> {
    const dbAccountOwner = await this.contactRepository.findAccountOwner(accountId);
    if (!dbAccountOwner) {
      return false;
    }
    return dbAccountOwner.id === contactId;
  }
}
