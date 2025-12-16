// PlayerClassified Service
// Orchestrator service that coordinates between specialized services following SOLID principles

import { Prisma } from '#prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { NotFoundError, ValidationError, InternalServerError } from '../../utils/customErrors.js';
import { DateUtils } from '../../utils/dateUtils.js';
import { BCRYPT_CONSTANTS, DEFAULT_VALUES } from '../../config/playerClassifiedConstants.js';

// Import specialized services
import {
  ITeamsWantedRepository,
  IPlayersWantedRepository,
  RepositoryFactory,
} from '../../repositories/index.js';
import { PlayerClassifiedEmailService } from './PlayerClassifiedEmailService.js';
import { PlayerClassifiedAccessService } from './PlayerClassifiedAccessService.js';
import {
  UpsertPlayersWantedClassifiedType,
  PlayerClassifiedSearchQueryType,
  PlayersWantedClassifiedType,
  PlayersWantedClassifiedPagedType,
  TeamsWantedPublicClassifiedPagedType,
  TeamsWantedOwnerClassifiedType,
  UpsertTeamsWantedClassifiedType,
  ContactPlayersWantedCreatorType,
} from '@draco/shared-schemas';
import { ServiceFactory } from '../serviceFactory.js';
import { ContactService } from '../contactService.js';
import { AccountsService } from '../accountsService.js';
import {
  PlayersWantedResponseFormatter,
  TeamsWantedResponseFormatter,
} from '../../responseFormatters/index.js';

// Database record types for type safety (kept for backward compatibility)
// These types are also defined in the specialized services

/**
 * PlayerClassifiedService - Orchestrator
 *
 * Acts as a facade/orchestrator that coordinates between specialized services.
 * This service maintains the original public API while delegating specific responsibilities
 * to focused services that follow Single Responsibility Principle:
 *
 * - PlayerClassifiedValidationService: Input validation
 * - PlayerClassifiedDataService: Data access and transformation
 * - PlayerClassifiedEmailService: Email operations
 * - PlayerClassifiedAccessService: Security and permissions
 *
 * Benefits of this architecture:
 * - Each service has a single, well-defined responsibility
 * - Services are loosely coupled through dependency injection
 * - Easy to test individual components in isolation
 * - Maintains existing API for backward compatibility
 * - Follows SOLID principles (especially Single Responsibility and Dependency Inversion)
 *
 */
export class PlayerClassifiedService {
  private teamsWantedRepository: ITeamsWantedRepository;
  private playersWantedRepository: IPlayersWantedRepository;
  private contactService: ContactService;
  private accountService: AccountsService;
  public emailService: PlayerClassifiedEmailService;
  private accessService: PlayerClassifiedAccessService;

  // Configuration constants
  private readonly DEFAULT_EXPIRATION_DAYS = {
    playersWanted: 30,
    teamsWanted: 60,
  };

  private readonly MAX_EXPIRATION_DAYS = {
    playersWanted: 90,
    teamsWanted: 120,
  };

  constructor() {
    // Initialize specialized services with dependency injection
    this.teamsWantedRepository = RepositoryFactory.getTeamsWantedRepository();
    this.playersWantedRepository = RepositoryFactory.getPlayersWantedRepository();
    this.emailService = ServiceFactory.getPlayerClassifiedEmailService();
    this.accessService = ServiceFactory.getPlayerClassifiedAccessService();
    this.contactService = ServiceFactory.getContactService();
    this.accountService = ServiceFactory.getAccountsService();
  }

  /**
   * Create a new Players Wanted classified
   *
   * Creates a Players Wanted classified for authenticated account users.
   * Orchestrates validation, data transformation, creation, and response building
   * through specialized services following SOLID principles.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param contactId - ID of authenticated contact creating the classified
   * @param request - Validated Players Wanted creation request
   * @returns Newly created classified with creator and account information
   *
   * @throws {ValidationError} When request validation fails
   * @throws {InternalServerError} When database operation fails or creator/account not found
   *
   */
  async createPlayersWanted(
    accountId: bigint,
    contactId: bigint,
    request: UpsertPlayersWantedClassifiedType,
  ): Promise<PlayersWantedClassifiedType> {
    // Create the classified using data service
    const classified = await this.playersWantedRepository.createPlayersWantedRecord({
      accountid: accountId,
      datecreated: new Date(),
      createdbycontactid: contactId,
      teameventname: request.teamEventName,
      description: request.description,
      positionsneeded: request.positionsNeeded,
    });

    // Get creator and account details for response using data service
    const [creator, account] = await Promise.all([
      this.contactService.getContact(accountId, contactId),
      this.accountService.getAccountName(accountId),
    ]);

    if (!creator || !account) {
      throw new InternalServerError('Failed to retrieve creator or account information');
    }

    // Transform database record to response format using data service
    return PlayersWantedResponseFormatter.transformPlayersWantedToResponse(
      classified,
      creator,
      account,
    );
  }

  /**
   * Get Players Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Players Wanted classifieds within account boundary.
   * Delegates to data service for consistent pagination and filtering logic.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param params - Search parameters including pagination, sorting, and filtering options
   * @returns Paginated response with classified data, total count, pagination metadata, and applied filters
   */
  async getPlayersWanted(
    accountId: bigint,
    params: PlayerClassifiedSearchQueryType,
  ): Promise<PlayersWantedClassifiedPagedType> {
    // Delegate to specialized data service
    const dbResult = await this.playersWantedRepository.getPlayersWanted(accountId, {
      page: params.page || DEFAULT_VALUES.DEFAULT_PAGE,
      limit: params.limit || DEFAULT_VALUES.DEFAULT_LIMIT,
      sortBy: params.sortBy || DEFAULT_VALUES.DEFAULT_SORT_BY,
      sortOrder: params.sortOrder || DEFAULT_VALUES.DEFAULT_SORT_ORDER,
    });

    return PlayersWantedResponseFormatter.transformPagedPlayersWanted(dbResult);
  }

  /**
   * Get Teams Wanted classifieds with pagination and filtering
   *
   * Retrieves paginated list of Teams Wanted classifieds for authenticated account members.
   * Delegates to data service which handles PII exposure securely within account boundary.
   *
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @param params - Search parameters including pagination, sorting, and filtering options
   * @returns Paginated response with classified data including PII for account members
   *
   * @security Data service ensures PII is only exposed to authorized account members
   */
  async getTeamsWanted(
    accountId: bigint,
    params: PlayerClassifiedSearchQueryType,
  ): Promise<TeamsWantedPublicClassifiedPagedType> {
    // Delegate to specialized data service
    const dbResult = await this.teamsWantedRepository.getTeamsWanted(accountId, params);

    return TeamsWantedResponseFormatter.transformPagedTeamsWantedPublic(dbResult);
  }

  /**
   * Get Teams Wanted contact information for a specific classified
   *
   * Retrieves only the contact information (email and phone) for a specific Teams Wanted
   * classified. This method provides secure access to sensitive PII data on demand,
   * reducing exposure in list responses while maintaining functionality for authorized users.
   *
   * @param classifiedId - ID of the Teams Wanted classified
   * @param accountId - Account ID for multi-tenant boundary enforcement
   * @returns Contact information (email and phone) for the classified
   *
   * @throws {NotFoundError} When classified is not found or not accessible
   * @throws {ValidationError} When parameters are invalid
   *
   * @security This method only exposes contact information to authenticated users
   * within the same account boundary as the classified.
   */
  async getTeamsWantedContactInfo(
    classifiedId: bigint,
    accountId: bigint,
  ): Promise<{ email: string | null; phone: string | null; birthDate: string | null }> {
    // Delegate to specialized data service
    const dbResult = await this.teamsWantedRepository.getTeamsWantedContactInfo(
      classifiedId,
      accountId,
    );
    if (!dbResult) {
      throw new NotFoundError('Teams Wanted classified not found');
    }

    return TeamsWantedResponseFormatter.transformContactInfo(dbResult);
  }

  // ============================================================================
  // TEAMS WANTED OPERATIONS - Orchestrated through specialized services
  // ============================================================================

  /**
   * Create a new Teams Wanted classified (public/anonymous)
   *
   * Creates a Teams Wanted classified for anonymous users through coordinated services.
   * Orchestrates validation, secure access code generation, database creation, and email verification.
   *
   * @param accountId - Account ID where the classified will be created
   * @param request - Validated request data containing player information and preferences
   * @returns Owner response object with classified details (no access code exposed)
   *
   * @throws {ValidationError} When request data validation fails
   * @throws {InternalServerError} When database operation or email sending fails
   *
   * @example
   * ```typescript
   * const classified = await service.createTeamsWanted(123n, {
   *   name: 'John Doe', email: 'john@example.com', positionsPlayed: 'SS,2B'
   * });
   * ```
   */
  async createTeamsWanted(
    accountId: bigint,
    request: UpsertTeamsWantedClassifiedType,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    // Generate secure access code
    const accessCode = randomUUID();
    const hashedAccessCode = await bcrypt.hash(
      accessCode,
      BCRYPT_CONSTANTS.ACCESS_CODE_SALT_ROUNDS,
    );

    // Create the classified using data service
    const birthDateForDb = DateUtils.parseDateOfBirthForDatabase(request.birthDate);

    const classified = await this.teamsWantedRepository.createTeamsWantedRecord({
      accountid: accountId,
      datecreated: new Date(),
      name: request.name,
      email: request.email,
      phone: request.phone || '',
      experience: request.experience || '',
      positionsplayed: request.positionsPlayed || '',
      accesscode: hashedAccessCode,
      birthdate: birthDateForDb,
    });

    // Get account details for response using data service
    const account = await this.accountService.getAccountName(accountId);
    if (!account) {
      throw new InternalServerError('Failed to retrieve account information');
    }

    // Send verification email with access code using email service (safe method)
    await this.emailService.sendVerificationEmailSafe(
      classified.id,
      request.email,
      accessCode,
      {
        id: BigInt(account.id),
        name: account.name,
      },
      request,
    );

    // Transform database record to response format using data service
    return TeamsWantedResponseFormatter.transformTeamsWantedToOwnerResponse(classified, account);
  }

  /**
   * Verify access code for Teams Wanted classified
   *
   * Authenticates anonymous users using access code through specialized access service.
   * Delegates security verification to ensure consistent access control implementation.
   *
   * @param classifiedId - ID of the classified to verify access for
   * @param accessCode - Plain-text access code provided by user (from email)
   * @param accountId - Account ID for boundary enforcement
   * @returns Owner response with full classified details if access code is valid
   */
  async verifyTeamsWantedAccess(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    // Delegate to specialized access service for security verification
    return await this.accessService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
  }

  /**
   * Update Teams Wanted classified using access code
   *
   * Updates a Teams Wanted classified through coordinated validation and access services.
   * First verifies access code, validates all update fields, then performs database update.
   *
   * @param classifiedId - ID of the classified to update
   * @param accessCode - Plain-text access code for authentication
   * @param updateData - Partial update data - only provided fields will be updated
   * @param accountId - Account ID for boundary enforcement
   * @returns Updated classified with owner response format
   *
   */
  async updateTeamsWanted(
    classifiedId: bigint,
    accessCode: string,
    updateData: Partial<UpsertTeamsWantedClassifiedType>,
    accountId: bigint,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    // Get account details for response using data service
    const account = await this.accountService.getAccountName(accountId);
    if (!account) {
      throw new InternalServerError('Failed to retrieve account information');
    }

    // If access code is provided and not empty, verify it (anonymous user path)
    if (accessCode && accessCode.trim() !== '') {
      await this.accessService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
    } else {
      // For admin users (empty access code), just verify the classified exists and belongs to account
      const classified = await this.teamsWantedRepository.findTeamsWantedById(
        classifiedId,
        accountId,
      );
      if (!classified) {
        throw new NotFoundError('Teams Wanted classified not found');
      }
    }

    // Prepare update data with proper Prisma type safety
    const dbUpdateData: Prisma.teamswantedclassifiedUpdateInput = {};

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

    // Update the classified using data service
    const updatedClassified = await this.teamsWantedRepository.updateTeamsWanted(
      classifiedId,
      dbUpdateData,
    );

    // Transform database record to response format using data service
    return TeamsWantedResponseFormatter.transformTeamsWantedToOwnerResponse(
      updatedClassified,
      account,
    );
  }

  /**
   * Delete Teams Wanted classified using access code or admin permissions
   *
   * Allows both anonymous users (with access code) and authenticated admin users
   * to delete Teams Wanted classifieds through coordinated access verification and data deletion services.
   *
   * @param classifiedId - ID of the classified to delete
   * @param accessCode - Plain-text access code for authentication (empty string for admin users)
   * @param accountId - Account ID for boundary enforcement
   *
   */
  async deleteTeamsWanted(
    classifiedId: bigint,
    accessCode: string,
    accountId: bigint,
  ): Promise<void> {
    // If access code is provided and not empty, verify it (anonymous user path)
    if (accessCode && accessCode.trim() !== '') {
      await this.accessService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
    } else {
      // For admin users (empty access code), just verify the classified exists and belongs to account
      const classified = await this.teamsWantedRepository.findTeamsWantedById(
        classifiedId,
        accountId,
      );
      if (!classified) {
        throw new NotFoundError('Teams Wanted classified not found');
      }
    }

    // Delete the classified using data service
    await this.teamsWantedRepository.deleteTeamsWanted(classifiedId);
  }

  /**
   * Delete Players Wanted classified
   *
   * Deletes a Players Wanted classified with proper authorization checking through
   * access service and data deletion through data service.
   *
   * @param classifiedId - ID of the classified to delete
   * @param accountId - Account ID for boundary enforcement
   * @param contactId - Contact ID for permission checking
   *
   */
  async deletePlayersWanted(
    classifiedId: bigint,
    accountId: bigint,
    userId: string,
    contactId: bigint,
  ): Promise<void> {
    const canDelete = await this.accessService.canDeletePlayersWanted(
      classifiedId,
      userId,
      contactId,
      accountId,
    );
    if (!canDelete) {
      throw new ValidationError('Insufficient permissions to delete this classified');
    }

    // Verify the classified exists and belongs to account using data service
    const classified = await this.playersWantedRepository.findPlayersWantedById(
      classifiedId,
      accountId,
    );
    if (!classified) {
      throw new NotFoundError('Classified not found');
    }

    // Delete the classified using data service
    await this.playersWantedRepository.deletePlayersWanted(classifiedId);
  }

  /**
   * Update Players Wanted classified
   *
   * Updates a Players Wanted classified through coordinated validation, access control,
   * and data services following SOLID principles.
   *
   * @param classifiedId - ID of the classified to update
   * @param accountId - Account ID for boundary enforcement
   * @param contactId - ID of the requesting contact for permission checking
   * @param request - Validated update request with new field values
   * @returns Updated classified with creator and account information
   *
   */
  async updatePlayersWanted(
    classifiedId: bigint,
    accountId: bigint,
    userId: string,
    contactId: bigint,
    request: UpsertPlayersWantedClassifiedType,
  ): Promise<PlayersWantedClassifiedType> {
    // Check if user can edit this classified using access service
    const canEdit = await this.accessService.canEditPlayersWanted(
      classifiedId,
      userId,
      contactId,
      accountId,
    );
    if (!canEdit) {
      throw new ValidationError('Insufficient permissions to edit this classified');
    }

    // Verify classified exists and belongs to account using data service
    const existingClassified = await this.playersWantedRepository.findPlayersWantedById(
      classifiedId,
      accountId,
    );
    if (!existingClassified) {
      throw new NotFoundError('Players Wanted classified not found');
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

    // Update the classified using data service
    const updatedClassified = await this.playersWantedRepository.updatePlayersWanted(
      classifiedId,
      updateData,
    );
    if (!updatedClassified) {
      throw new InternalServerError('Failed to update Players Wanted classified');
    }

    // Transform database record to response format using data service
    return PlayersWantedResponseFormatter.transformPlayersWantedToResponse(
      updatedClassified,
      {
        id: contactId.toString(),
        firstName: updatedClassified.contacts.firstname,
        lastName: updatedClassified.contacts.lastname,
      },
      {
        id: accountId.toString(),
        name: updatedClassified.accounts.name,
      },
    );
  }

  /**
   * Check if user can edit a Players Wanted classified
   *
   * Delegates to specialized access service for consistent permission checking
   * across all classified operations.
   *
   * @param classifiedId - ID of the classified to check edit permissions for
   * @param contactId - ID of the contact requesting edit access
   * @param accountId - Account ID for boundary enforcement
   * @returns True if user can edit, false otherwise
   */
  async canEditPlayersWanted(
    classifiedId: bigint,
    userId: string,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Delegate to specialized access service
    return await this.accessService.canEditPlayersWanted(
      classifiedId,
      userId,
      contactId,
      accountId,
    );
  }

  /**
   * Check if user can delete a Players Wanted classified
   *
   * Delegates to specialized access service for consistent permission checking.
   *
   * @param classifiedId - ID of the classified to check delete permissions for
   * @param contactId - ID of the contact requesting delete access
   * @param accountId - Account ID for boundary enforcement
   * @returns True if user can delete, false otherwise
   *
   */
  async canDeletePlayersWanted(
    classifiedId: bigint,
    userId: string,
    contactId: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    // Delegate to specialized access service
    return await this.accessService.canDeletePlayersWanted(
      classifiedId,
      userId,
      contactId,
      accountId,
    );
  }

  /**
   * Find Teams Wanted classified by access code (for unauthenticated users)
   *
   * Delegates to specialized access service for secure access code verification.
   *
   * @param accountId - Account ID to scope the search to
   * @param accessCode - Plain-text access code from user (originally from email)
   * @returns Owner response with full PII data if access code matches
   *
   */
  async findTeamsWantedByAccessCode(
    accountId: bigint,
    accessCode: string,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    // Delegate to specialized access service for secure verification
    return await this.accessService.findTeamsWantedByAccessCode(accountId, accessCode);
  }

  /**
   * Send contact email to Players Wanted creator
   *
   * Allows anonymous users to contact the creator of a Players Wanted classified
   * through a secure email relay system. This protects the creator's email privacy
   * while enabling legitimate contact requests.
   *
   * @param accountId - Account ID for boundary enforcement
   * @param classifiedId - ID of the Players Wanted classified
   * @param contactRequest - Contact request with sender info and message
   * @throws {NotFoundError} When classified doesn't exist or doesn't belong to account
   * @throws {ValidationError} When contact request validation fails
   * @throws {InternalServerError} When email sending fails
   *
   */
  async contactPlayersWantedCreator(
    accountId: bigint,
    classifiedId: bigint,
    contactRequest: ContactPlayersWantedCreatorType,
  ): Promise<void> {
    // Get the classified with creator details using data service
    const classified = await this.playersWantedRepository.findPlayersWantedById(
      classifiedId,
      accountId,
    );
    if (!classified) {
      throw new NotFoundError('Players Wanted classified not found');
    }

    // Get creator contact details (including email for internal use)
    const creator = await this.contactService.getContact(accountId, classified.createdbycontactid);
    if (!creator || !creator.email) {
      throw new InternalServerError('Creator contact information not found');
    }

    // Get account details for email branding
    const account = await this.accountService.getAccountName(accountId);
    if (!account) {
      throw new InternalServerError('Account information not found');
    }

    // Send contact email using a simple direct approach
    const success = await this.sendContactEmail(
      creator.email,
      creator.firstName,
      classified.teameventname,
      contactRequest,
      account.name,
    );

    if (!success) {
      throw new InternalServerError('Failed to send contact email');
    }
  }

  /**
   * Send contact email using direct email provider
   *
   * Private helper method that handles the actual email sending
   * using the same email infrastructure as password reset emails.
   */
  private async sendContactEmail(
    creatorEmail: string,
    creatorName: string,
    teamEventName: string,
    contactRequest: ContactPlayersWantedCreatorType,
    accountName: string,
  ): Promise<boolean> {
    // Import EmailProviderFactory for direct email sending
    const { EmailProviderFactory } = await import('../email/EmailProviderFactory.js');
    const { EmailConfigFactory } = await import('../../config/email.js');

    const settings = EmailConfigFactory.getEmailSettings();

    // Generate subject from team event name
    const subject = `${teamEventName} Players Wanted Ad Inquiry`;
    const { html: htmlBody, text: textBody } = this.generateContactEmailContent(
      creatorName,
      teamEventName,
      contactRequest,
      accountName,
    );

    // Send email using EmailProviderFactory directly
    const provider = await EmailProviderFactory.getProvider();
    const result = await provider.sendEmail({
      to: creatorEmail,
      subject,
      html: htmlBody,
      text: textBody,
      from: settings.fromEmail,
      fromName: settings.fromName,
      replyTo: contactRequest.senderEmail, // Allow direct reply to sender
    });

    return result.success;
  }

  /**
   * Generate both HTML and text email content for contact requests
   * Returns an object with both versions to reduce code duplication
   */
  private generateContactEmailContent(
    creatorName: string,
    teamEventName: string,
    contactRequest: ContactPlayersWantedCreatorType,
    accountName: string,
  ): { html: string; text: string } {
    // Sanitize common content once for reuse
    const sanitizedData = {
      creatorName: this.emailService.sanitizeTextContent(creatorName),
      teamEventName: this.emailService.sanitizeTextContent(teamEventName),
      accountName: this.emailService.sanitizeTextContent(accountName),
      senderName: this.emailService.sanitizeTextContent(contactRequest.senderName),
      senderEmail: this.emailService.sanitizeTextContent(contactRequest.senderEmail),
      messageText: this.emailService.sanitizeTextContent(contactRequest.message),
      messageHtml: this.emailService.sanitizeHtmlContent(contactRequest.message),
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-left: 4px solid #2196F3; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .message-box { background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .sender-info { background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Request</h1>
            <p>Someone is interested in your team!</p>
        </div>
        
        <div class="content">
            <p>Hi ${sanitizedData.creatorName},</p>
            
            <p>You have received a new contact request regarding your <strong>${sanitizedData.teamEventName}</strong> posting on ${sanitizedData.accountName}.</p>
            
            <div class="sender-info">
                <h3>Contact Information:</h3>
                <p><strong>Name:</strong> ${sanitizedData.senderName}</p>
                <p><strong>Email:</strong> ${sanitizedData.senderEmail}</p>
            </div>
            
            <div class="message-box">
                <h3>Message:</h3>
                <p>${sanitizedData.messageHtml}</p>
            </div>
            
            <p><strong>Reply directly to this email to respond to ${sanitizedData.senderName}.</strong></p>
        </div>
        
        <div class="footer">
            <p>This email was sent through ${sanitizedData.accountName} via ezRecSports.com.</p>
            <p>Your email address is kept private and is never shared with requesters.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
NEW CONTACT REQUEST

Hi ${sanitizedData.creatorName},

You have received a new contact request regarding your "${sanitizedData.teamEventName}" posting on ${sanitizedData.accountName}.

CONTACT INFORMATION:
Name: ${sanitizedData.senderName}
Email: ${sanitizedData.senderEmail}

MESSAGE:
${sanitizedData.messageText}

Reply directly to this email to respond to ${sanitizedData.senderName}.

---
This email was sent through ${sanitizedData.accountName} via ezRecSports.com.
Your email address is kept private and is never shared with requesters.
`;

    return { html, text };
  }
}
