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
  ITeamsWantedOwnerResponse,
  IClassifiedSearchParams,
  IClassifiedSearchFilters,
  IClassifiedValidationResult,
} from '../interfaces/playerClassifiedInterfaces.js';
import { isValidPositionId } from '../interfaces/playerClassifiedConstants.js';
import { EmailService } from './emailService.js';
import { PaginationHelper } from '../utils/pagination.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
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
      dateCreated: dbRecord.datecreated,
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
   * Transform database Teams Wanted record to interface response
   */
  private transformTeamsWantedToResponse(
    dbRecord: TeamsWantedDbRecord,
    account: AccountDbRecord,
  ): ITeamsWantedOwnerResponse {
    return {
      id: dbRecord.id,
      accountId: dbRecord.accountid,
      dateCreated: dbRecord.datecreated,
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      accessCode: dbRecord.accesscode, // Return hashed version for security
      birthDate: dbRecord.birthdate,
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
      birthdate: request.birthDate,
    };
  }

  // ============================================================================
  // PLAYERS WANTED OPERATIONS
  // ============================================================================

  /**
   * Create a new Players Wanted classified
   * Requires player-classified.create-players-wanted permission
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

    // Rate limiting is now handled by middleware for authenticated endpoints

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
    console.log('Debug: sortBy =', sortBy, 'sortOrder =', sortOrder);
    switch (sortBy) {
      case 'dateCreated':
        console.log('Debug: Setting orderBy.datecreated =', sortOrder);
        orderBy.datecreated = sortOrder;
        break;
      default:
        console.log('Debug: Default case - setting orderBy.datecreated = desc');
        orderBy.datecreated = 'desc';
        break;
    }
    console.log('Debug: Final orderBy =', orderBy);

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
  ): Promise<IClassifiedListResponse<ITeamsWantedOwnerResponse>> {
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
    const data: ITeamsWantedOwnerResponse[] = classifications.map(
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

    // Rate limiting is now handled by middleware for anonymous endpoints

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
    await this.sendVerificationEmail(classified.id, request.email, accessCode);

    // Transform database record to response format
    return this.transformTeamsWantedToResponse(classified, account);
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
    return this.transformTeamsWantedToResponse(classified, account);
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

    if (updateData.birthDate && validateBirthDate(updateData.birthDate, 'birthDate', 13, 80)) {
      throw new ValidationError('Invalid birth date (must be 13-80 years old)');
    }

    // Prepare update data
    const dbUpdateData: Record<string, unknown> = {};

    if (updateData.name) dbUpdateData.name = updateData.name;
    if (updateData.email) dbUpdateData.email = updateData.email;
    if (updateData.phone) dbUpdateData.phone = updateData.phone;
    if (updateData.experience) dbUpdateData.experience = updateData.experience;
    if (updateData.positionsPlayed) dbUpdateData.positionsplayed = updateData.positionsPlayed;
    if (updateData.birthDate) dbUpdateData.birthdate = updateData.birthDate;

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
    return this.transformTeamsWantedToResponse(updatedClassified, account);
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
      validateRequiredString(request.experience, 'experience', 500, 10),
      validatePositions(
        request.positionsPlayed,
        'positionsPlayed',
        this.validatePositions.bind(this),
      ),
      validateBirthDate(request.birthDate, 'birthDate', 13, 80),
    );

    return createValidationResult(errors);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Add days to a date (utility method)
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

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
  ): Promise<void> {
    try {
      // TODO: Replace with actual email service integration
      // For now, we'll log the action and prepare for email service integration
      console.log(`Preparing verification email to ${email} for classified ${classifiedId}`);

      // Prepare email data for the email service
      const emailData = {
        to: email,
        subject: 'Teams Wanted Classified - Access Code',
        template: 'teams-wanted-verification',
        context: {
          classifiedId: classifiedId.toString(),
          accessCode: accessCode,
          verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-classified/${classifiedId}?code=${accessCode}`,
          expiresIn: '24 hours',
        },
      };

      // TODO: Implement actual email sending using EmailService
      // await this.emailService.sendTemplatedEmail(emailData);

      // For development, log the email data
      if (process.env.NODE_ENV === 'development') {
        console.log('Email data prepared:', JSON.stringify(emailData, null, 2));
      }

      // TODO: Add email verification tracking to database
      // await this.prisma.emailVerifications.create({
      //   data: {
      //     classifiedId,
      //     email,
      //     accessCode: await bcrypt.hash(accessCode, 12), // Hash for security
      //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      //     verified: false
      //   }
      // });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error here as it would prevent classified creation
      // Instead, log it and continue - the user can request a new access code later
    }
  }
}
