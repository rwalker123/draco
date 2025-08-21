// PlayerClassifieds Service for Draco Sports Manager
// Handles all classified-related operations including CRUD, matching, and notifications

import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IClassifiedListResponse,
  IPlayersWantedResponse,
  ITeamsWantedResponse,
  ITeamsWantedOwnerResponse,
  IClassifiedSearchParams,
  IClassifiedSearchFilters,
  IClassifiedValidationResult,
  IPlayersWantedUpdateRequest,
} from '../interfaces/playerClassifiedInterfaces.js';
import { isValidPositionId } from '../interfaces/playerClassifiedConstants.js';
import { EmailService } from './emailService.js';
import { PaginationHelper } from '../utils/pagination.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  validateRequiredString,
  validateEmail,
  validatePhone,
  validateBirthDate,
  validatePositions,
  collectValidationErrors,
  createValidationResult,
} from '../utils/validationUtils.js';

// Database record types for type safety
interface PlayersWantedDbRecord {
  id: bigint;
  accountid: bigint;
  datecreated: Date;
  createdbycontactid: bigint;
  teameventname: string;
  description: string;
  positionsneeded: string;
}

interface TeamsWantedDbRecord {
  id: bigint;
  accountid: bigint;
  datecreated: Date;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsplayed: string;
  accesscode: string;
  birthdate: Date;
}

interface ContactDbRecord {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string | null;
}

interface AccountDbRecord {
  id: bigint;
  name: string;
}

interface PlayersWantedWithRelations {
  id: bigint;
  accountid: bigint;
  datecreated: Date;
  createdbycontactid: bigint;
  teameventname: string;
  description: string;
  positionsneeded: string;
  contacts: ContactDbRecord;
  accounts: AccountDbRecord;
}

export class PlayerClassifiedService {
  private prisma: PrismaClient;
  private emailService: EmailService;

  // Configuration constants
  private readonly DEFAULT_EXPIRATION_DAYS = {
    playersWanted: 30,
    teamsWanted: 60,
  };

  private readonly MAX_EXPIRATION_DAYS = {
    playersWanted: 90,
    teamsWanted: 120,
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.emailService = new EmailService();
  }

  // ============================================================================
  // TRANSFORM METHODS (Database <-> Interface)
  // ============================================================================

  /**
   * Transform database Players Wanted record to interface response
   */
  private transformPlayersWantedToResponse(
    dbRecord: PlayersWantedDbRecord,
    creator: ContactDbRecord,
    account: AccountDbRecord,
  ): IPlayersWantedResponse {
    return {
      id: dbRecord.id,
      accountId: dbRecord.accountid,
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      createdByContactId: dbRecord.createdbycontactid,
      teamEventName: dbRecord.teameventname,
      description: dbRecord.description,
      positionsNeeded: dbRecord.positionsneeded,
      creator: {
        id: creator.id,
        firstName: creator.firstname,
        lastName: creator.lastname,
        email: creator.email,
      },
      account: {
        id: account.id,
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to interface response (for authenticated account members)
   */
  private transformTeamsWantedToResponse(
    dbRecord: TeamsWantedDbRecord,
    account: AccountDbRecord,
  ): ITeamsWantedResponse {
    return {
      id: dbRecord.id,
      accountId: dbRecord.accountid,
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      birthDate: DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate),
      account: {
        id: account.id,
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to owner response (excludes accessCode for security)
   */
  private transformTeamsWantedToOwnerResponse(
    dbRecord: TeamsWantedDbRecord,
    account: AccountDbRecord,
  ): ITeamsWantedOwnerResponse {
    return {
      id: dbRecord.id,
      accountId: dbRecord.accountid,
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      birthDate: DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate),
      account: {
        id: account.id,
        name: account.name,
      },
    };
  }

  /**
   * Transform interface request to database create data
   */
  private transformPlayersWantedCreateRequest(
    request: IPlayersWantedCreateRequest,
    accountId: bigint,
    contactId: bigint,
  ): Prisma.playerswantedclassifiedUncheckedCreateInput {
    return {
      accountid: accountId,
      datecreated: new Date(),
      createdbycontactid: contactId,
      teameventname: request.teamEventName,
      description: request.description,
      positionsneeded: request.positionsNeeded,
    };
  }

  /**
   * Transform interface request to database create data
   */
  private transformTeamsWantedCreateRequest(
    request: ITeamsWantedCreateRequest,
    accountId: bigint,
    hashedAccessCode: string,
  ): Prisma.teamswantedclassifiedUncheckedCreateInput {
    return {
      accountid: accountId,
      datecreated: new Date(),
      name: request.name,
      email: request.email,
      phone: request.phone,
      experience: request.experience,
      positionsplayed: request.positionsPlayed,
      accesscode: hashedAccessCode,
      birthdate: DateUtils.parseDateForDatabase(request.birthDate) || new Date('1900-01-01'),
    };
  }

  // ============================================================================
  // PLAYERS WANTED OPERATIONS
  // ============================================================================

  /**
   * Create a new Players Wanted classified
   * Any authenticated account user can create Players Wanted ads
   */
  async createPlayersWanted(
    accountId: bigint,
    contactId: bigint,
    request: IPlayersWantedCreateRequest,
  ): Promise<IPlayersWantedResponse> {
    // Validate input data
    const validation = this.validatePlayersWantedCreateRequest(request);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Authentication and rate limiting handled by middleware

    // Transform request to database format
    const dbData = this.transformPlayersWantedCreateRequest(request, accountId, contactId);

    // Create the classified
    const classified = await this.prisma.playerswantedclassified.create({
      data: dbData,
    });

    // Get creator and account details for response
    const [creator, account] = await Promise.all([
      this.prisma.contacts.findUnique({
        where: { id: contactId },
        select: { id: true, firstname: true, lastname: true, email: true },
      }),
      this.prisma.accounts.findUnique({
        where: { id: accountId },
        select: { id: true, name: true },
      }),
    ]);

    if (!creator || !account) {
      throw new Error('Failed to retrieve creator or account information');
    }

    // Transform database record to response format
    return this.transformPlayersWantedToResponse(classified, creator, account);
  }

  /**
   * Get Players Wanted classifieds with pagination and filtering
   */
  async getPlayersWanted(
    accountId: bigint,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<IPlayersWantedResponse>> {
    const { page = 1, limit = 20, sortBy = 'dateCreated', sortOrder = 'desc' } = params;

    // Build where clause
    const where: Record<string, unknown> = {
      accountid: accountId,
    };

    // Build order by clause
    const orderBy: Record<string, unknown> = {};
    switch (sortBy) {
      case 'dateCreated':
        orderBy.datecreated = sortOrder;
        break;
      default:
        orderBy.datecreated = 'desc';
        break;
    }

    // Execute query with pagination
    const [classifications, total] = await Promise.all([
      this.prisma.playerswantedclassified.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contacts: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
          accounts: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.playerswantedclassified.count({ where }),
    ]);

    // Transform to response format using transform method
    const data: IPlayersWantedResponse[] = classifications.map((c: PlayersWantedWithRelations) =>
      this.transformPlayersWantedToResponse(c, c.contacts, c.accounts),
    );

    // Build pagination info
    const pagination = PaginationHelper.createMeta(page, limit, total);

    // Build filters info
    const filters: IClassifiedSearchFilters = {
      type: 'players',
      positions: [],
      experience: [],
      dateRange: { from: null, to: null },
      searchQuery: params.searchQuery || null,
    };

    return {
      data,
      total,
      pagination,
      filters,
    };
  }

  /**
   * Get Teams Wanted classifieds with pagination and filtering
   */
  async getTeamsWanted(
    accountId: bigint,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<ITeamsWantedResponse>> {
    const { page = 1, limit = 20, sortBy = 'dateCreated', sortOrder = 'desc' } = params;

    // Build where clause
    const where: Record<string, unknown> = {
      accountid: accountId,
    };

    // Build order by clause
    const orderBy: Record<string, unknown> = {};
    switch (sortBy) {
      case 'dateCreated':
        orderBy.datecreated = sortOrder;
        break;
      default:
        orderBy.datecreated = 'desc';
    }

    // Execute query with pagination
    const [classifications, total] = await Promise.all([
      this.prisma.teamswantedclassified.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          accounts: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.teamswantedclassified.count({ where }),
    ]);

    // Transform to response format using transform method
    const data: ITeamsWantedResponse[] = classifications.map(
      (c: TeamsWantedDbRecord & { accounts: AccountDbRecord }) =>
        this.transformTeamsWantedToResponse(c, c.accounts),
    );

    // Build pagination info
    const pagination = PaginationHelper.createMeta(page, limit, total);

    // Build filters info
    const filters: IClassifiedSearchFilters = {
      type: 'teams',
      positions: [],
      experience: [],
      dateRange: { from: null, to: null },
      searchQuery: params.searchQuery || null,
    };

    return {
      data,
      total,
      pagination,
      filters,
    };
  }

  // ============================================================================
  // TEAMS WANTED OPERATIONS
  // ============================================================================

  /**
   * Create a new Teams Wanted classified (public/anonymous)
   */
  async createTeamsWanted(
    accountId: bigint,
    request: ITeamsWantedCreateRequest,
  ): Promise<ITeamsWantedOwnerResponse> {
    // Validate input data
    const validation = this.validateTeamsWantedCreateRequest(request);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Rate limiting handled by middleware for public endpoints

    // Generate secure access code
    const accessCode = randomUUID();
    const hashedAccessCode = await bcrypt.hash(accessCode, 12);

    // Transform request to database format
    const dbData = this.transformTeamsWantedCreateRequest(request, accountId, hashedAccessCode);

    // Create the classified
    const classified = await this.prisma.teamswantedclassified.create({
      data: dbData,
    });

    // Get account details for response
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    });

    if (!account) {
      throw new Error('Failed to retrieve account information');
    }

    // Send verification email with access code
    await this.sendVerificationEmail(classified.id, request.email, accessCode, account, request);

    // Transform database record to response format
    return this.transformTeamsWantedToOwnerResponse(classified, account);
  }

  /**
   * Verify access code for Teams Wanted classified
   */
  async verifyTeamsWantedAccess(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<ITeamsWantedOwnerResponse> {
    // Find the classified
    const classified = await this.prisma.teamswantedclassified.findFirst({
      where: {
        id: classifiedId,
        accountid: accountId,
      },
    });

    if (!classified) {
      throw new NotFoundError('Classified not found');
    }

    // Verify access code
    const isValid = await bcrypt.compare(accessCode, classified.accesscode);
    if (!isValid) {
      throw new ValidationError('Invalid access code');
    }

    // Get account details for response
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    });

    if (!account) {
      throw new Error('Failed to retrieve account information');
    }

    // Transform database record to response format
    return this.transformTeamsWantedToOwnerResponse(classified, account);
  }

  /**
   * Update Teams Wanted classified using access code
   */
  async updateTeamsWanted(
    classifiedId: bigint,
    accessCode: string,
    updateData: Partial<ITeamsWantedCreateRequest>,
    accountId: bigint,
  ): Promise<ITeamsWantedOwnerResponse> {
    // First verify access
    await this.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);

    // Validate update data if provided
    if (updateData.name && updateData.name.length > 50) {
      throw new ValidationError('Name must be 50 characters or less');
    }

    if (updateData.email && validateEmail(updateData.email, 'email')) {
      throw new ValidationError('Invalid email format');
    }

    if (updateData.phone && validatePhone(updateData.phone, 'phone')) {
      throw new ValidationError('Invalid phone number format');
    }

    if (updateData.positionsPlayed && !this.validatePositions(updateData.positionsPlayed)) {
      throw new ValidationError('Invalid positions specified');
    }

    if (updateData.birthDate) {
      const parsedBirthDate = DateUtils.parseDateForDatabase(updateData.birthDate);
      if (parsedBirthDate && validateBirthDate(parsedBirthDate, 'birthDate', 13, 80)) {
        throw new ValidationError('Invalid birth date (must be 13-80 years old)');
      }
    }

    // Prepare update data
    const dbUpdateData: Record<string, unknown> = {};

    if (updateData.name) dbUpdateData.name = updateData.name;
    if (updateData.email) dbUpdateData.email = updateData.email;
    if (updateData.phone) dbUpdateData.phone = updateData.phone;
    if (updateData.experience) dbUpdateData.experience = updateData.experience;
    if (updateData.positionsPlayed) dbUpdateData.positionsplayed = updateData.positionsPlayed;
    if (updateData.birthDate) {
      const parsedBirthDate = DateUtils.parseDateForDatabase(updateData.birthDate);
      if (parsedBirthDate) {
        dbUpdateData.birthdate = parsedBirthDate;
      }
    }

    // Will be implemented when schema is updated
    // dbUpdateData.lastmodified = new Date();

    // Update the classified
    const updatedClassified = await this.prisma.teamswantedclassified.update({
      where: { id: classifiedId },
      data: dbUpdateData,
    });

    // Get account details for response
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    });

    if (!account) {
      throw new Error('Failed to retrieve account information');
    }

    // Transform database record to response format
    return this.transformTeamsWantedToOwnerResponse(updatedClassified, account);
  }

  /**
   * Delete Teams Wanted classified using access code
   */
  async deleteTeamsWanted(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<void> {
    // First verify access
    await this.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);

    // Delete the classified
    await this.prisma.teamswantedclassified.delete({
      where: { id: classifiedId },
    });
  }

  /**
   * Delete Players Wanted classified (requires player-classified.manage permission)
   */
  async deletePlayersWanted(
    classifiedId: bigint,
    accountId: bigint,
    _contactId: bigint,
  ): Promise<void> {
    // Find the classified
    const classified = await this.prisma.playerswantedclassified.findFirst({
      where: {
        id: classifiedId,
        accountid: accountId,
      },
    });

    if (!classified) {
      throw new NotFoundError('Classified not found');
    }

    // Delete the classified
    await this.prisma.playerswantedclassified.delete({
      where: { id: classifiedId },
    });
  }

  /**
   * Update Players Wanted classified
   * Creator can edit own, AccountAdmin can edit any
   */
  async updatePlayersWanted(
    classifiedId: bigint,
    accountId: bigint,
    contactId: bigint,
    request: IPlayersWantedUpdateRequest,
  ): Promise<IPlayersWantedResponse> {
    // Validate input data
    const validation = this.validatePlayersWantedUpdateRequest(request);
    if (!validation.isValid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Check if user can edit this classified
    const canEdit = await this.canEditPlayersWanted(classifiedId, contactId, accountId);
    if (!canEdit) {
      throw new ValidationError('Insufficient permissions to edit this classified');
    }

    // Get existing classified
    const existingClassified = await this.prisma.playerswantedclassified.findUnique({
      where: { id: classifiedId },
      include: {
        contacts: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
        accounts: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existingClassified) {
      throw new NotFoundError('Players Wanted classified not found');
    }

    if (existingClassified.accountid !== accountId) {
      throw new ValidationError('Classified does not belong to this account');
    }

    // Prepare update data
    const updateData: Prisma.playerswantedclassifiedUpdateInput = {};
    if (request.teamEventName !== undefined) {
      updateData.teameventname = request.teamEventName;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.positionsNeeded !== undefined) {
      updateData.positionsneeded = request.positionsNeeded;
    }

    // Update the classified
    const updatedClassified = await this.prisma.playerswantedclassified.update({
      where: { id: classifiedId },
      data: updateData,
      include: {
        contacts: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
        accounts: {
          select: { id: true, name: true },
        },
      },
    });

    // Transform database record to response format
    return this.transformPlayersWantedToResponse(
      updatedClassified,
      updatedClassified.contacts,
      updatedClassified.accounts,
    );
  }

  /**
   * Check if user can edit a Players Wanted classified
   * Creator can edit own, AccountAdmin can edit any
   */
  async canEditPlayersWanted(
    classifiedId: bigint,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Get the classified to check ownership
    const classified = await this.prisma.playerswantedclassified.findUnique({
      where: { id: classifiedId },
      select: { createdbycontactid: true, accountid: true },
    });

    if (!classified) {
      return false;
    }

    if (classified.accountid !== accountId) {
      return false;
    }

    // Creator can always edit their own classified
    if (classified.createdbycontactid === contactId) {
      return true;
    }

    // Check if user has AccountAdmin role
    // This would require integration with the role service
    // For now, we'll implement a basic check
    const userRoles = await this.getUserRoles(contactId, accountId);
    return userRoles.some(
      (role) => role.roleId === 'AccountAdmin' || role.roleId === 'Administrator',
    );
  }

  /**
   * Check if user can delete a Players Wanted classified
   * Creator can delete own, AccountAdmin can delete any
   */
  async canDeletePlayersWanted(
    classifiedId: bigint,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Same logic as canEdit
    return this.canEditPlayersWanted(classifiedId, contactId, accountId);
  }

  /**
   * Get user roles for permission checking
   * This is a simplified implementation - in production, use the role service
   */
  private async getUserRoles(
    contactId: bigint,
    accountId: bigint,
  ): Promise<Array<{ roleId: string }>> {
    try {
      const roles = await this.prisma.contactroles.findMany({
        where: {
          contactid: contactId,
          accountid: accountId,
        },
        select: { roleid: true },
      });

      return roles.map((role) => ({ roleId: role.roleid }));
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Validate Players Wanted creation request
   */
  private validatePlayersWantedCreateRequest(
    request: IPlayersWantedCreateRequest,
  ): IClassifiedValidationResult {
    const errors = collectValidationErrors(
      validateRequiredString(request.teamEventName, 'teamEventName', 50),
      validateRequiredString(request.description, 'description', 1000, 10),
      validatePositions(
        request.positionsNeeded,
        'positionsNeeded',
        this.validatePositions.bind(this),
      ),
    );

    return createValidationResult(errors);
  }

  /**
   * Validate Teams Wanted creation request
   */
  private validateTeamsWantedCreateRequest(
    request: ITeamsWantedCreateRequest,
  ): IClassifiedValidationResult {
    const errors = collectValidationErrors(
      validateRequiredString(request.name, 'name', 50),
      validateEmail(request.email, 'email'),
      validatePhone(request.phone, 'phone'),
      validateRequiredString(request.experience, 'experience', 50),
      validatePositions(
        request.positionsPlayed,
        'positionsPlayed',
        this.validatePositions.bind(this),
      ),
      (() => {
        const parsedBirthDate = DateUtils.parseDateForDatabase(request.birthDate);
        return parsedBirthDate ? validateBirthDate(parsedBirthDate, 'birthDate', 13, 80) : null;
      })(),
    );

    return createValidationResult(errors);
  }

  /**
   * Validate Players Wanted update request
   */
  private validatePlayersWantedUpdateRequest(
    request: IPlayersWantedUpdateRequest,
  ): IClassifiedValidationResult {
    const errors = collectValidationErrors(
      request.teamEventName !== undefined
        ? validateRequiredString(request.teamEventName, 'teamEventName', 50, 1)
        : null,
      request.description !== undefined
        ? validateRequiredString(request.description, 'description', 1000, 10)
        : null,
      request.positionsNeeded !== undefined
        ? validatePositions(
            request.positionsNeeded,
            'positionsNeeded',
            this.validatePositions.bind(this),
          )
        : null,
    );

    return createValidationResult(errors);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate positions string (comma-separated position IDs)
   */
  private validatePositions(positions: string): boolean {
    const positionList = positions.split(',').map((p) => p.trim());
    return positionList.every((pos) => isValidPositionId(pos));
  }

  /**
   * Send verification email for Teams Wanted
   */
  private async sendVerificationEmail(
    classifiedId: bigint,
    email: string,
    accessCode: string,
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): Promise<void> {
    try {
      await this.sendTeamsWantedVerificationEmail(
        email,
        classifiedId,
        accessCode,
        account,
        userData,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error here as it would prevent classified creation
      // Instead, log it and continue - the user can request a new access code later
    }
  }

  /**
   * Send Teams Wanted verification email using EmailService provider directly
   * Creates personalized email with account branding and user data display
   */
  private async sendTeamsWantedVerificationEmail(
    toEmail: string,
    classifiedId: bigint,
    accessCode: string,
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): Promise<void> {
    try {
      // Get email settings from config factory
      const settings = {
        fromEmail: 'noreply@dracosports.com',
        fromName: 'Draco Sports Manager',
        replyTo: 'support@dracosports.com',
      };

      // Generate verification URL with proper environment variable handling
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-classified/${classifiedId}?code=${accessCode}`;

      // Create email HTML content with security best practices and personalization
      const htmlContent = this.generateTeamsWantedEmailHtml(
        classifiedId,
        accessCode,
        verificationUrl,
        settings,
        account,
        userData,
      );

      // Create email text content for accessibility and fallback
      const textContent = this.generateTeamsWantedEmailText(
        classifiedId,
        accessCode,
        verificationUrl,
        settings,
        account,
        userData,
      );

      // Prepare email options following EmailOptions interface
      const emailOptions = {
        to: toEmail,
        subject: `${account.name} - Teams Wanted Classified Access Code`,
        html: htmlContent,
        text: textContent,
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      };

      // Send email using EmailProviderFactory directly for custom content
      const { EmailProviderFactory } = await import('./email/EmailProviderFactory.js');
      const provider = await EmailProviderFactory.getProvider();
      const emailResult = await provider.sendEmail(emailOptions);

      if (emailResult.success) {
        console.log(
          `Verification email sent successfully to ${toEmail} for classified ${classifiedId}`,
        );
      } else {
        console.error('Failed to send verification email through provider:', emailResult.error);
      }

      // For development, log the email data
      if (process.env.NODE_ENV === 'development') {
        console.log(
          'Email data prepared:',
          JSON.stringify(
            {
              to: toEmail,
              subject: emailOptions.subject,
              verificationUrl,
              accountName: account.name,
              userName: userData.name,
              accessCode: '***REDACTED***', // Security: Don't log sensitive data
            },
            null,
            2,
          ),
        );
      }
    } catch (error) {
      console.error('Error in sendTeamsWantedVerificationEmail:', error);
      throw error; // Re-throw to allow proper error handling
    }
  }

  /**
   * Generate HTML email content for Teams Wanted verification
   * Follows security best practices for HTML email generation
   * Includes blue banner with account name and personalization
   */
  private generateTeamsWantedEmailHtml(
    classifiedId: bigint,
    accessCode: string,
    verificationUrl: string,
    settings: { fromEmail: string; fromName: string; replyTo: string },
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): string {
    // Security: Sanitize inputs to prevent XSS
    const sanitizedAccessCode = this.sanitizeHtmlContent(accessCode);
    const sanitizedVerificationUrl = this.sanitizeHtmlContent(verificationUrl);
    const sanitizedReplyTo = this.sanitizeHtmlContent(settings.replyTo);
    const sanitizedAccountName = this.sanitizeHtmlContent(account.name);
    const sanitizedUserName = this.sanitizeHtmlContent(userData.name);
    const sanitizedUserEmail = this.sanitizeHtmlContent(userData.email);
    const sanitizedUserPhone = this.sanitizeHtmlContent(userData.phone);
    const sanitizedUserExperience = this.sanitizeHtmlContent(userData.experience);
    const sanitizedUserPositions = this.sanitizeHtmlContent(userData.positionsPlayed);
    const sanitizedUserBirthDate = this.sanitizeHtmlContent(userData.birthDate);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sanitizedAccountName} - Teams Wanted Classified Access Code</title>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
          .header-banner { background-color: #4285F4; color: white; text-align: center; padding: 20px; margin-bottom: 20px; border-radius: 8px 8px 0 0; }
          .header-banner h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .content-area { background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .main-heading { color: #2c5aa0; margin-bottom: 20px; font-size: 20px; }
          .personal-greeting { font-size: 16px; margin-bottom: 20px; }
          .data-summary { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .data-row { display: flex; margin-bottom: 10px; }
          .data-label { font-weight: bold; min-width: 120px; color: #2c5aa0; }
          .data-value { color: #333; }
          .access-code-box { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4285F4; }
          .access-code { color: #2c5aa0; font-weight: bold; font-size: 18px; }
          .verification-link { color: #4285F4; text-decoration: none; font-weight: bold; }
          .verification-button { background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header-banner">
            <h1>${sanitizedAccountName}</h1>
          </div>
          
          <div class="content-area">
            <h2 class="main-heading">Teams Wanted Classified Created</h2>
            
            <p class="personal-greeting">Hello ${sanitizedUserName},</p>
            
            <p>Welcome to ${sanitizedAccountName} Teams Wanted System!</p>
            
            <p>Your Teams Wanted classified has been created successfully. Here are the details you submitted:</p>
            
            <div class="data-summary">
              <div class="data-row">
                <span class="data-label">Name:</span>
                <span class="data-value">${sanitizedUserName}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Email:</span>
                <span class="data-value">${sanitizedUserEmail}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Phone:</span>
                <span class="data-value">${sanitizedUserPhone}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Experience Level:</span>
                <span class="data-value">${sanitizedUserExperience}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Positions:</span>
                <span class="data-value">${sanitizedUserPositions}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Birth Date:</span>
                <span class="data-value">${sanitizedUserBirthDate}</span>
              </div>
            </div>
            
            <div class="access-code-box">
              <h3 style="margin-top: 0;">Your Access Code: <span class="access-code">${sanitizedAccessCode}</span></h3>
              <p><strong>Keep this access code safe!</strong> You'll need it to:</p>
              <ul>
                <li>View your classified details</li>
                <li>Update your classified information</li>
                <li>Delete your classified</li>
              </ul>
            </div>
            
            <p><strong>Verification Link:</strong> <a href="${sanitizedVerificationUrl}" class="verification-link">Click here to verify your classified</a></p>
            
            <div class="footer">
              <p>Thank you for using ${sanitizedAccountName} Teams Wanted System!</p>
              <p>If you didn't create this classified, please ignore this email.<br>
              For support, contact: <a href="mailto:${sanitizedReplyTo}" class="verification-link">${sanitizedReplyTo}</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content for Teams Wanted verification
   * Provides accessibility and fallback for email clients that don't support HTML
   * Includes personalization and user data display
   */
  private generateTeamsWantedEmailText(
    classifiedId: bigint,
    accessCode: string,
    verificationUrl: string,
    settings: { fromEmail: string; fromName: string; replyTo: string },
    account: { id: bigint; name: string },
    userData: {
      name: string;
      email: string;
      phone: string;
      experience: string;
      positionsPlayed: string;
      birthDate: string;
    },
  ): string {
    // Security: Sanitize inputs to prevent injection
    const sanitizedAccessCode = this.sanitizeTextContent(accessCode);
    const sanitizedVerificationUrl = this.sanitizeTextContent(verificationUrl);
    const sanitizedReplyTo = this.sanitizeTextContent(settings.replyTo);
    const sanitizedAccountName = this.sanitizeTextContent(account.name);
    const sanitizedUserName = this.sanitizeTextContent(userData.name);
    const sanitizedUserEmail = this.sanitizeTextContent(userData.email);
    const sanitizedUserPhone = this.sanitizeTextContent(userData.phone);
    const sanitizedUserExperience = this.sanitizeTextContent(userData.experience);
    const sanitizedUserPositions = this.sanitizeTextContent(userData.positionsPlayed);
    const sanitizedUserBirthDate = this.sanitizeTextContent(userData.birthDate);

    return `
${sanitizedAccountName} - Teams Wanted Classified Created

Hello ${sanitizedUserName},

Welcome to ${sanitizedAccountName} Teams Wanted System!

Your Teams Wanted classified has been created successfully. Here are the details you submitted:

Name: ${sanitizedUserName}
Email: ${sanitizedUserEmail}
Phone: ${sanitizedUserPhone}
Experience Level: ${sanitizedUserExperience}
Positions: ${sanitizedUserPositions}
Birth Date: ${sanitizedUserBirthDate}

Your access code is: ${sanitizedAccessCode}
Keep this access code safe! You'll need it to:
- View your classified details
- Update your classified information
- Delete your classified

Verification Link: ${sanitizedVerificationUrl}

Thank you for using ${sanitizedAccountName} Teams Wanted System!

If you didn't create this classified, please ignore this email.
For support, contact: ${sanitizedReplyTo}
`;
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   * Follows OWASP security guidelines for HTML sanitization
   */
  private sanitizeHtmlContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    return content
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/[\r\n]/g, ' ') // Remove newlines to prevent header injection
      .trim();
  }

  /**
   * Sanitize text content to prevent injection attacks
   * Follows OWASP security guidelines for text sanitization
   */
  private sanitizeTextContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    return content
      .replace(/[\r\n]/g, ' ') // Remove newlines to prevent injection
      .replace(/[<>]/g, '') // Remove HTML tags
      .trim();
  }

  /**
   * Find Teams Wanted classified by access code (for unauthenticated users)
   * Returns the Teams Wanted data with PII for users who have the access code
   */
  async findTeamsWantedByAccessCode(
    accountId: bigint,
    accessCode: string,
  ): Promise<ITeamsWantedOwnerResponse> {
    // Find all classifieds for the account (we need to verify access code with bcrypt)
    const classifieds = await this.prisma.teamswantedclassified.findMany({
      where: {
        accountid: accountId,
      },
    });

    // Find the classified by comparing the access code with each hashed version
    let matchedClassified: TeamsWantedDbRecord | null = null;
    for (const classified of classifieds) {
      const isValid = await bcrypt.compare(accessCode, classified.accesscode);
      if (isValid) {
        matchedClassified = classified;
        break;
      }
    }

    if (!matchedClassified) {
      throw new NotFoundError('Teams Wanted classified not found with this access code');
    }

    // Get account details for response
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    });

    if (!account) {
      throw new Error('Failed to retrieve account information');
    }

    // Transform database record to response format
    // Note: This returns full PII (email, phone, birthDate) but never the accessCode
    return this.transformTeamsWantedToOwnerResponse(matchedClassified, account);
  }
}
