// Enhanced Email Service
// Follows SRP/DIP - depends on IEmailProvider interface

import {
  IEmailProvider,
  EmailOptions,
  ResolvedRecipient,
  EmailSettings,
  ServerEmailAttachment,
} from '../interfaces/emailInterfaces.js';
import { EmailProviderFactory } from './email/EmailProviderFactory.js';
import { EmailConfigFactory } from '../config/email.js';
import { EmailAttachmentService } from './emailAttachmentService.js';
import { PaginationHelper } from '../utils/pagination.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import {
  EmailListPagedType,
  EmailRecipientGroupsType,
  EmailSendType,
  PagingType,
  WORKOUT_REGISTRATIONS_MAX_EXPORT,
} from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IEmailRepository,
  ISeasonsRepository,
  IWorkoutRepository,
  ITeamsWantedRepository,
  IUmpireRepository,
  dbCreateEmailRecipientInput,
} from '../repositories/index.js';
import { EmailResponseFormatter } from '../responseFormatters/index.js';
import { RosterService } from './rosterService.js';
import { ServiceFactory } from './serviceFactory.js';
import validator from 'validator';
import { TeamService } from './teamService.js';
import { TeamManagerService } from './teamManagerService.js';
import { htmlToPlainText } from '../utils/emailContent.js';
import { ContactService } from './contactService.js';
import { sanitizeRichHtml, sanitizeSystemEmailHtml } from '../utils/htmlSanitizer.js';
import { getFrontendBaseUrlOrFallback } from '../utils/frontendBaseUrl.js';

// Email queue management interfaces
interface EmailQueueJob {
  id: string;
  emailId: bigint;
  batchIndex: number;
  recipients: ResolvedRecipient[];
  subject: string;
  bodyHtml: string;
  settings: EmailSettings;
  retryCount: number;
  rateLimitRetries: number;
  scheduledAt: Date;
  createdAt: Date;
  attachments?: ServerEmailAttachment[];
  senderContactId?: bigint;
}

type ProviderConfig = {
  MAX_EMAILS_PER_SECOND: number;
  MAX_EMAILS_PER_MINUTE: number;
  RATE_LIMIT_ENABLED: boolean;
  EMAIL_DELAY_MS: number;
  PROCESS_INTERVAL_MS: number;
};

interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  rateLimit: {
    emailsPerSecond: number;
    emailsPerMinute: number;
    currentWindow: {
      startTime: Date;
      count: number;
    };
  };
}

interface SenderContext {
  contactId?: bigint;
  displayName: string;
  replyTo?: string;
  settings: EmailSettings;
}

interface ComposeEmailOptions {
  isSystemEmail?: boolean;
}

interface EmailSendToAddressesRequest {
  subject: string;
  bodyHtml: string;
  recipients: {
    emails: string[];
  };
  scheduledSend?: string | Date | null;
  templateId?: string | number | bigint | null;
}

// Legacy interface maintained for backward compatibility
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private provider: IEmailProvider | null = null;
  private jobQueue: Map<string, EmailQueueJob> = new Map();
  private processingQueue: Set<string> = new Set();
  private queueProcessor: NodeJS.Timeout | null = null;
  private scheduledEmailProcessor: NodeJS.Timeout | null = null;
  private rateLimitWindow: { startTime: Date; count: number } = {
    startTime: new Date(),
    count: 0,
  };
  private rateLimitMinuteWindow: { startTime: Date; count: number } = {
    startTime: new Date(),
    count: 0,
  };
  private globalRateLimitUntil: Date | null = null;
  private attachmentService: EmailAttachmentService;
  private emailRepository: IEmailRepository;
  private seasonRepository: ISeasonsRepository;
  private rosterService: RosterService;
  private teamService: TeamService;
  private teamManagerService: TeamManagerService;
  private contactService: ContactService;
  private workoutRepository: IWorkoutRepository;
  private teamsWantedRepository: ITeamsWantedRepository;
  private umpireRepository: IUmpireRepository;

  // Provider-specific queue configuration
  private readonly PROVIDER_CONFIGS = {
    sendgrid: {
      MAX_EMAILS_PER_SECOND: 80, // Conservative SendGrid limit
      MAX_EMAILS_PER_MINUTE: 4800,
      RATE_LIMIT_ENABLED: true,
      EMAIL_DELAY_MS: 12, // ~80 emails per second
      PROCESS_INTERVAL_MS: 100,
    },
    ses: {
      MAX_EMAILS_PER_SECOND: 14, // Default AWS SES limit per second
      MAX_EMAILS_PER_MINUTE: 840,
      RATE_LIMIT_ENABLED: true,
      EMAIL_DELAY_MS: 80, // Slight buffer around default SES send rate
      PROCESS_INTERVAL_MS: 200,
    },
    ethereal: {
      MAX_EMAILS_PER_SECOND: 10, // No real limits for test email
      MAX_EMAILS_PER_MINUTE: 600,
      RATE_LIMIT_ENABLED: true, // No rate limiting for development
      EMAIL_DELAY_MS: 12, // Very fast for development
      PROCESS_INTERVAL_MS: 100, // Faster processing for dev
    },
    resend: {
      MAX_EMAILS_PER_SECOND: 1, // Resend default limit is 2/sec; target 1.5/sec for safety
      MAX_EMAILS_PER_MINUTE: 90, // 1.5/sec = 90/min
      RATE_LIMIT_ENABLED: true,
      EMAIL_DELAY_MS: 667, // 1000ms / 1.5 = 667ms between emails
      PROCESS_INTERVAL_MS: 500,
    },
    none: {
      MAX_EMAILS_PER_SECOND: 0,
      MAX_EMAILS_PER_MINUTE: 0,
      RATE_LIMIT_ENABLED: false,
      EMAIL_DELAY_MS: 0,
      PROCESS_INTERVAL_MS: 100,
    },
  } as const;

  private readonly BATCH_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // ms delays for retries
  private readonly MAX_RATE_LIMIT_RETRIES = 5;
  private readonly RATE_LIMIT_BACKOFF_MS = [30000, 60000, 120000, 240000, 480000];
  private currentProviderType: 'sendgrid' | 'ethereal' | 'ses' | 'resend' | 'none' | null = null;

  constructor() {
    this.attachmentService = ServiceFactory.getEmailAttachmentService();
    this.emailRepository = RepositoryFactory.getEmailRepository();
    this.seasonRepository = RepositoryFactory.getSeasonsRepository();
    this.rosterService = ServiceFactory.getRosterService();
    this.teamService = ServiceFactory.getTeamService();
    this.teamManagerService = ServiceFactory.getTeamManagerService();
    this.contactService = ServiceFactory.getContactService();
    this.workoutRepository = RepositoryFactory.getWorkoutRepository();
    this.teamsWantedRepository = RepositoryFactory.getTeamsWantedRepository();
    this.umpireRepository = RepositoryFactory.getUmpireRepository();

    // Start queue processor
    this.startQueueProcessor();

    // Start scheduled email processor
    this.startScheduledEmailProcessor();

    // Initialize provider type detection
    this.initializeProvider();
  }

  /**
   * Detect current email provider type
   */
  private async getProviderType(): Promise<'sendgrid' | 'ethereal' | 'ses' | 'resend' | 'none'> {
    if (this.currentProviderType) {
      return this.currentProviderType;
    }

    const settings = EmailConfigFactory.getEmailSettings();
    this.currentProviderType = settings.provider;
    return this.currentProviderType;
  }

  /**
   * Get provider-specific configuration
   */
  private async getProviderConfig() {
    const providerType = await this.getProviderType();
    return this.PROVIDER_CONFIGS[providerType];
  }

  /**
   * Initialize provider type and log configuration
   */
  private async initializeProvider(): Promise<void> {
    try {
      const providerType = await this.getProviderType();
      const config = this.PROVIDER_CONFIGS[providerType];

      console.log(`🚀 Email service initialized with ${providerType.toUpperCase()} provider`);
      console.log(`   Rate limiting: ${config.RATE_LIMIT_ENABLED ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Max emails/sec: ${config.MAX_EMAILS_PER_SECOND}`);
      console.log(`   Email delay: ${config.EMAIL_DELAY_MS}ms`);
      console.log(`   Process interval: ${config.PROCESS_INTERVAL_MS}ms`);
    } catch (error) {
      console.error('Failed to initialize provider:', error);
    }
  }

  /**
   * Initialize email provider (lazy loading)
   */
  private async getProvider(): Promise<IEmailProvider> {
    if (!this.provider) {
      this.provider = await EmailProviderFactory.getProvider();
    }
    return this.provider;
  }

  /**
   * Send password reset email (legacy method - maintains backward compatibility)
   */
  async sendPasswordResetEmail(
    toEmail: string,
    username: string,
    resetToken: string,
    accountName?: string,
  ): Promise<boolean> {
    try {
      const baseUrl = getFrontendBaseUrlOrFallback();
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      const settings = EmailConfigFactory.getEmailSettings();
      const brandName = accountName?.trim() || 'ezRecSports.com';

      const emailOptions: EmailOptions = {
        to: toEmail,
        subject: `${brandName} - Password Reset Request`,
        html: this.generatePasswordResetEmailHtml(username, resetUrl, brandName),
        text: this.generatePasswordResetEmailText(username, resetUrl, brandName),
        from: settings.fromEmail,
        fromName: brandName,
        replyTo: settings.replyTo,
      };

      const provider = await this.getProvider();
      const result = await provider.sendEmail(emailOptions);

      return result.success;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendAccountPasswordSetupEmail(options: {
    toEmail: string;
    username: string;
    resetToken: string;
    accountName?: string;
    accountId?: string;
    contactName?: string;
  }): Promise<boolean> {
    const { toEmail, username, resetToken, accountName, accountId, contactName } = options;

    if (!this.hasValidEmail(toEmail)) {
      return false;
    }

    try {
      const baseUrl = getFrontendBaseUrlOrFallback();
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      const accountDashboardUrl = accountId
        ? `${baseUrl}/account/${accountId}`
        : `${baseUrl}/login`;
      const settings = EmailConfigFactory.getEmailSettings();

      const emailOptions: EmailOptions = {
        to: toEmail,
        subject: accountName
          ? `Welcome to ${accountName} - Set your password`
          : 'Welcome - Set your password',
        html: this.generateAccountPasswordSetupEmailHtml({
          accountName,
          accountDashboardUrl,
          resetUrl,
          contactName,
          username,
        }),
        text: this.generateAccountPasswordSetupEmailText({
          accountName,
          accountDashboardUrl,
          resetUrl,
          contactName,
          username,
        }),
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      };

      const provider = await this.getProvider();
      const result = await provider.sendEmail(emailOptions);

      return result.success;
    } catch (error) {
      console.error('Error sending account password setup email:', error);
      return false;
    }
  }

  async sendGeneralWelcomeEmail(toEmail: string): Promise<boolean> {
    if (!this.hasValidEmail(toEmail)) {
      return false;
    }

    try {
      const baseUrl = getFrontendBaseUrlOrFallback();
      const loginUrl = `${baseUrl}/login`;
      const settings = EmailConfigFactory.getEmailSettings();

      const emailOptions: EmailOptions = {
        to: toEmail,
        subject: 'Welcome to ezRecSports.com',
        html: this.generateGeneralWelcomeEmailHtml(loginUrl),
        text: this.generateGeneralWelcomeEmailText(loginUrl),
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      };

      const provider = await this.getProvider();
      const result = await provider.sendEmail(emailOptions);

      return result.success;
    } catch (error) {
      console.error('Error sending general welcome email:', error);
      return false;
    }
  }

  async sendAccountWelcomeEmail(options: {
    toEmail: string;
    accountId: string;
    accountName: string;
    contactName?: string;
    userName?: string;
  }): Promise<boolean> {
    const { toEmail, accountId, accountName, contactName, userName } = options;

    if (!this.hasValidEmail(toEmail)) {
      return false;
    }

    try {
      const baseUrl = getFrontendBaseUrlOrFallback();
      const accountDashboardUrl = `${baseUrl}/account/${accountId}`;
      const loginUrl = `${baseUrl}/login`;
      const settings = EmailConfigFactory.getEmailSettings();

      const emailOptions: EmailOptions = {
        to: toEmail,
        subject: `Welcome to ${accountName}`,
        html: this.generateAccountWelcomeEmailHtml({
          accountName,
          accountDashboardUrl,
          loginUrl,
          contactName,
          userName,
        }),
        text: this.generateAccountWelcomeEmailText({
          accountName,
          accountDashboardUrl,
          loginUrl,
          contactName,
          userName,
        }),
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyTo,
      };

      const provider = await this.getProvider();
      const result = await provider.sendEmail(emailOptions);

      return result.success;
    } catch (error) {
      console.error('Error sending account welcome email:', error);
      return false;
    }
  }

  /**
   * Compose and send bulk email to multiple recipients
   */
  async composeAndSendEmail(
    accountId: bigint,
    createdByUserId: string,
    request: EmailSendType,
    options?: ComposeEmailOptions,
  ): Promise<bigint> {
    return this.composeAndSendEmailFromUser(accountId, createdByUserId, request, options);
  }

  async composeAndSendEmailFromUser(
    accountId: bigint,
    createdByUserId: string,
    request: EmailSendType,
    options?: ComposeEmailOptions,
  ): Promise<bigint> {
    const isSystemEmail = options?.isSystemEmail ?? false;

    const scheduledDateRaw = request.scheduledSend ? new Date(request.scheduledSend) : null;
    const scheduledDate =
      scheduledDateRaw && !Number.isNaN(scheduledDateRaw.getTime()) ? scheduledDateRaw : null;

    const shouldDelaySend = Boolean(scheduledDate && scheduledDate > new Date());
    const emailStatus = shouldDelaySend ? 'scheduled' : 'sending';

    if (!createdByUserId || createdByUserId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    const senderContext = await this.resolveSenderContext(accountId, createdByUserId);
    const sanitizedBody = isSystemEmail
      ? sanitizeSystemEmailHtml(request.body)
      : sanitizeRichHtml(request.body);

    const email = await this.emailRepository.createEmail({
      account_id: accountId,
      created_by_user_id: createdByUserId,
      subject: request.subject,
      body_html: sanitizedBody,
      body_text: htmlToPlainText(sanitizedBody),
      template_id: request.templateId ? BigInt(request.templateId) : null,
      status: emailStatus,
      scheduled_send_at: scheduledDate,
      created_at: new Date(),
      sender_contact_id: senderContext.contactId ?? null,
      sender_contact_name: senderContext.displayName,
      reply_to_email: senderContext.replyTo,
      from_name_override: senderContext.displayName,
    });

    await this.sendBulkEmail(email.id, request, {
      queueImmediately: !shouldDelaySend,
    });

    return email.id;
  }

  /**
   * Compose and send an email to raw email addresses (internal-only helper).
   *
   * This exists for system-generated emails where recipients may not exist as contacts.
   * Routes should NOT expose this; it bypasses shared-schema recipient resolution.
   */
  async composeAndSendSystemEmailToAddresses(
    accountId: bigint,
    request: EmailSendToAddressesRequest,
    options?: ComposeEmailOptions,
  ): Promise<bigint> {
    const isSystemEmail = options?.isSystemEmail ?? false;

    const scheduledDateRaw = request.scheduledSend ? new Date(request.scheduledSend) : null;
    const scheduledDate =
      scheduledDateRaw && !Number.isNaN(scheduledDateRaw.getTime()) ? scheduledDateRaw : null;

    const shouldDelaySend = Boolean(scheduledDate && scheduledDate > new Date());
    const emailStatus = shouldDelaySend ? 'scheduled' : 'sending';

    if (!request.subject || !request.bodyHtml) {
      throw new ValidationError('Subject and body are required');
    }

    const recipientEmails = Array.from(
      new Set(
        (request.recipients?.emails ?? [])
          .map((email) => email.trim())
          .filter((email) => email.length > 0)
          .map((email) => email.toLowerCase()),
      ),
    ).filter((email) => this.hasValidEmail(email));

    if (recipientEmails.length === 0) {
      throw new ValidationError('At least one valid recipient email address is required');
    }

    const senderContext = this.resolveSystemSenderContext();

    const sanitizedBody = isSystemEmail
      ? sanitizeSystemEmailHtml(request.bodyHtml)
      : sanitizeRichHtml(request.bodyHtml);

    const email = await this.emailRepository.createEmail({
      account_id: accountId,
      created_by_user_id: null,
      subject: request.subject,
      body_html: sanitizedBody,
      body_text: htmlToPlainText(sanitizedBody),
      template_id: request.templateId ? BigInt(request.templateId) : null,
      status: emailStatus,
      scheduled_send_at: scheduledDate,
      created_at: new Date(),
      sender_contact_id: senderContext.contactId ?? null,
      sender_contact_name: senderContext.displayName,
      reply_to_email: senderContext.replyTo,
      from_name_override: senderContext.displayName,
    });

    const recipientPayload: dbCreateEmailRecipientInput[] = recipientEmails.map((emailAddress) => ({
      email_id: email.id,
      contact_id: null,
      email_address: emailAddress,
      contact_name: emailAddress,
      recipient_type: 'external',
    }));

    await this.emailRepository.createEmailRecipients(recipientPayload);
    await this.emailRepository.updateEmail(email.id, {
      total_recipients: recipientEmails.length,
      ...(shouldDelaySend ? {} : { status: 'sending' }),
    });

    if (shouldDelaySend) {
      return email.id;
    }

    await this.queueEmailBatches(
      email.id,
      recipientPayload.map((recipient) => ({
        contactId: null,
        emailAddress: recipient.email_address,
        contactName: recipient.contact_name ?? recipient.email_address,
        recipientType: recipient.recipient_type ?? 'external',
      })),
      email.subject,
      email.body_html,
      senderContext.settings,
      {
        senderContactId: senderContext.contactId,
        requireReplyTo: false,
      },
    );

    return email.id;
  }

  /**
   * Send bulk email using queue processing
   */
  async sendBulkEmail(
    emailId: bigint,
    request: EmailSendType,
    options?: { queueImmediately?: boolean },
  ): Promise<void> {
    try {
      const { queueImmediately = true } = options ?? {};
      const email = await this.emailRepository.findEmailWithAccount(emailId);

      if (!email) {
        throw new Error(`Email record not found: ${emailId}`);
      }

      // Resolve recipients
      const recipients = await this.resolveRecipients(
        email.account_id,
        request.seasonId ? BigInt(request.seasonId) : null,
        request.recipients,
      );

      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      const { settings: senderSettings, senderContactId } = this.buildSenderSettingsForEmail(email);

      const recipientPayload: dbCreateEmailRecipientInput[] = recipients.map((recipient) => ({
        email_id: emailId,
        contact_id: recipient.contactId,
        email_address: recipient.emailAddress,
        contact_name: recipient.contactName,
        recipient_type: recipient.recipientType,
      }));

      await this.emailRepository.createEmailRecipients(recipientPayload);

      await this.emailRepository.updateEmail(emailId, {
        total_recipients: recipients.length,
        ...(queueImmediately ? { status: 'sending' } : {}),
      });

      if (!queueImmediately) {
        console.log(`Stored ${recipients.length} recipients for scheduled email ${emailId}`);
        return;
      }

      // Load attachments for the email
      const attachments = await this.attachmentService.getAttachmentsForSending(emailId.toString());

      // Queue email batches for processing
      await this.queueEmailBatches(
        emailId,
        recipients,
        email.subject,
        email.body_html,
        senderSettings,
        {
          attachments,
          senderContactId,
          requireReplyTo: Boolean(email.reply_to_email),
        },
      );

      console.log(
        `Queued ${recipients.length} recipients in ${Math.ceil(recipients.length / this.BATCH_SIZE)} batches for email ${emailId}`,
      );
    } catch (error) {
      console.error(`Error queuing bulk email ${emailId}:`, error);

      // Update email status to failed
      await this.emailRepository.updateEmailStatus(emailId, 'failed');

      throw error;
    }
  }

  async getEmailDetails(accountId: bigint, emailId: bigint) {
    const email = await this.emailRepository.getEmailDetails(accountId, emailId);

    if (!email) {
      throw new NotFoundError('Email not found');
    }

    return EmailResponseFormatter.formatEmailDetail(email);
  }

  async listAccountEmails(
    accountId: bigint,
    paginationParams: PagingType,
    status?: string,
  ): Promise<EmailListPagedType> {
    const pagination = {
      page: paginationParams.page,
      limit: Math.min(paginationParams.limit, 100),
      offset: paginationParams.skip,
    };

    const { emails, total } = await this.emailRepository.listAccountEmails(accountId, {
      skip: pagination.offset,
      take: pagination.limit,
      status,
    });

    const paginationInfo = PaginationHelper.createMeta(pagination.page, pagination.limit, total);

    return EmailResponseFormatter.formatEmailList(emails, paginationInfo);
  }

  async deleteEmail(accountId: bigint, emailId: bigint): Promise<void> {
    const email = await this.emailRepository.findEmailWithAccount(emailId);

    if (!email || email.account_id !== accountId) {
      throw new NotFoundError('Email not found');
    }

    this.clearQueuedJobsForEmail(emailId);

    await this.attachmentService.deleteAllEmailAttachments(
      email.account_id.toString(),
      emailId.toString(),
    );

    await this.emailRepository.deleteEmail(emailId, accountId);
  }

  /**
   * Queue email batches for background processing
   */
  private async queueEmailBatches(
    emailId: bigint,
    recipients: ResolvedRecipient[],
    subject: string,
    bodyHtml: string,
    settings: EmailSettings,
    options: {
      attachments?: ServerEmailAttachment[];
      senderContactId?: bigint;
      requireReplyTo?: boolean;
    } = {},
  ): Promise<void> {
    const { attachments } = options;
    const now = new Date();

    const requireReplyTo = options.requireReplyTo ?? true;
    const trimmedReplyTo = settings.replyTo?.trim();

    if (requireReplyTo && (!trimmedReplyTo || !validator.isEmail(trimmedReplyTo))) {
      throw new ValidationError('Queued emails require a valid reply-to email address');
    }

    if (trimmedReplyTo && !validator.isEmail(trimmedReplyTo)) {
      throw new ValidationError('Invalid reply-to email address');
    }

    const sanitizedFromName = this.sanitizeDisplayName(settings.fromName);
    const jobSettings: EmailSettings = {
      ...settings,
      fromName: sanitizedFromName || settings.fromName,
      replyTo: trimmedReplyTo,
    };

    // Split recipients into batches and queue each batch
    for (let i = 0; i < recipients.length; i += this.BATCH_SIZE) {
      const batch = recipients.slice(i, i + this.BATCH_SIZE);
      const batchIndex = Math.floor(i / this.BATCH_SIZE);

      const job: EmailQueueJob = {
        id: `${emailId}-${batchIndex}-${Date.now()}`,
        emailId,
        batchIndex,
        recipients: batch,
        subject,
        bodyHtml,
        settings: jobSettings,
        retryCount: 0,
        rateLimitRetries: 0,
        scheduledAt: now,
        createdAt: now,
        attachments,
        senderContactId: options.senderContactId,
      };

      this.jobQueue.set(job.id, job);
    }
  }

  private clearQueuedJobsForEmail(emailId: bigint): void {
    const jobsToRemove: string[] = [];

    for (const [jobId, job] of this.jobQueue) {
      if (job.emailId === emailId) {
        jobsToRemove.push(jobId);
      }
    }

    for (const jobId of jobsToRemove) {
      this.jobQueue.delete(jobId);
      this.processingQueue.delete(jobId);
    }
  }

  /**
   * Start the background queue processor
   */
  private startQueueProcessor(): void {
    const startInterval = (intervalMs: number) => {
      if (this.queueProcessor) {
        clearInterval(this.queueProcessor);
      }

      this.queueProcessor = setInterval(async () => {
        try {
          await this.processQueue();
        } catch (error) {
          console.error('Queue processor error:', error);
        }
      }, intervalMs);
    };

    // Start immediately with a safe default while loading provider config
    startInterval(100);

    void this.getProviderConfig()
      .then((config) => {
        const interval = config?.PROCESS_INTERVAL_MS ?? 100;
        startInterval(interval);
        console.log(`Email queue processor started (interval ${interval}ms)`);
      })
      .catch((error) => {
        console.error('Failed to configure queue processor interval:', error);
      });
  }

  /**
   * Stop the background queue processor
   */
  public stopQueueProcessor(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
      console.log('Email queue processor stopped');
    }
  }

  /**
   * Start the scheduled email processor
   */
  private startScheduledEmailProcessor(): void {
    if (this.scheduledEmailProcessor) {
      clearInterval(this.scheduledEmailProcessor);
    }

    // Check for scheduled emails every minute
    this.scheduledEmailProcessor = setInterval(async () => {
      try {
        await this.processScheduledEmails();
      } catch (error) {
        console.error('Scheduled email processor error:', error);
      }
    }, 60000); // Check every minute

    console.log('Scheduled email processor started');
  }

  /**
   * Stop the scheduled email processor
   */
  public stopScheduledEmailProcessor(): void {
    if (this.scheduledEmailProcessor) {
      clearInterval(this.scheduledEmailProcessor);
      this.scheduledEmailProcessor = null;
      console.log('Scheduled email processor stopped');
    }
  }

  /**
   * Stop all processors
   */
  public stopAllProcessors(): void {
    this.stopQueueProcessor();
    this.stopScheduledEmailProcessor();
  }

  /**
   * Process scheduled emails that are ready to send
   */
  private async processScheduledEmails(): Promise<void> {
    try {
      const now = new Date();

      const scheduledEmails = await this.emailRepository.findScheduledEmailsReady(now);

      if (scheduledEmails.length === 0) {
        return; // No emails to process
      }

      console.log(`📅 Processing ${scheduledEmails.length} scheduled emails`);

      for (const email of scheduledEmails) {
        try {
          // Update status to 'sending' to prevent duplicate processing
          await this.emailRepository.updateEmailStatus(email.id, 'sending');

          // Check if recipients already exist (email was previously composed)
          const existingRecipients = await this.emailRepository.getEmailRecipients(email.id);

          if (existingRecipients.length > 0) {
            // Recipients already exist, process the email directly
            console.log(
              `📧 Processing scheduled email ${email.id} with existing ${existingRecipients.length} recipients`,
            );

            // Load attachments for the email
            const attachments = await this.attachmentService.getAttachmentsForSending(
              email.id.toString(),
            );

            const { settings: senderSettings, senderContactId } =
              this.buildSenderSettingsForEmail(email);

            // Queue email batches for processing using existing recipients
            const resolvedRecipients = existingRecipients.map((recipient) => ({
              contactId: recipient.contact_id,
              emailAddress: recipient.email_address,
              contactName: recipient.contact_name || 'Unknown',
              recipientType: recipient.recipient_type || 'individual',
            }));

            await this.queueEmailBatches(
              email.id,
              resolvedRecipients,
              email.subject,
              email.body_html,
              senderSettings,
              {
                attachments,
                senderContactId,
                requireReplyTo: Boolean(email.reply_to_email),
              },
            );
          } else {
            // No existing recipients - this shouldn't happen in normal flow,
            // but handle gracefully by marking as failed
            console.warn(`⚠️ Scheduled email ${email.id} has no recipients - marking as failed`);
            await this.emailRepository.updateEmail(email.id, {
              status: 'failed',
              sent_at: now,
            });
          }

          console.log(`✅ Scheduled email ${email.id} queued for processing`);
        } catch (error) {
          console.error(`❌ Error processing scheduled email ${email.id}:`, error);

          // Mark email as failed
          await this.emailRepository.updateEmail(email.id, {
            status: 'failed',
            sent_at: now,
          });
        }
      }
    } catch (error) {
      console.error('Error in processScheduledEmails:', error);
    }
  }

  /**
   * Process pending jobs in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.jobQueue.size === 0) {
      return;
    }

    // Check rate limits
    const canSend = await this.canSendEmails();
    if (!canSend) {
      return;
    }

    // Find next job to process
    const nextJob = this.getNextJob();
    if (!nextJob) {
      return;
    }

    // Mark job as processing
    this.processingQueue.add(nextJob.id);

    try {
      await this.processBatchJob(nextJob);

      // Remove completed job
      this.jobQueue.delete(nextJob.id);
      this.processingQueue.delete(nextJob.id);
    } catch (error) {
      console.error(`Error processing batch job ${nextJob.id}:`, error);

      // Handle retry logic
      await this.handleJobFailure(nextJob, error);
      this.processingQueue.delete(nextJob.id);
    }
  }

  /**
   * Check if we can send emails within rate limits (provider-aware)
   */
  private async canSendEmails(): Promise<boolean> {
    const config = await this.getProviderConfig();
    const now = new Date();

    if (this.globalRateLimitUntil) {
      if (now < this.globalRateLimitUntil) {
        return false;
      }

      this.globalRateLimitUntil = null;
      this.rateLimitWindow = { startTime: now, count: 0 };
      this.rateLimitMinuteWindow = { startTime: now, count: 0 };
    }

    // If rate limiting is disabled (e.g., Ethereal Email), always allow
    if (!config.RATE_LIMIT_ENABLED) {
      return true;
    }

    const windowStart = this.rateLimitWindow.startTime;
    const windowDurationMs = now.getTime() - windowStart.getTime();
    const minuteWindowStart = this.rateLimitMinuteWindow.startTime;
    const minuteDurationMs = now.getTime() - minuteWindowStart.getTime();

    // Reset window if it's been more than a second
    if (windowDurationMs >= 1000) {
      this.rateLimitWindow = { startTime: now, count: 0 };
    }

    // Reset minute window if it's been more than a minute
    if (minuteDurationMs >= 60000) {
      this.rateLimitMinuteWindow = { startTime: now, count: 0 };
    }

    // Check if we're under the per-second limit
    if (this.rateLimitWindow.count >= config.MAX_EMAILS_PER_SECOND) {
      return false;
    }

    // Check per-minute limit if configured
    if (
      config.MAX_EMAILS_PER_MINUTE > 0 &&
      this.rateLimitMinuteWindow.count >= config.MAX_EMAILS_PER_MINUTE
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get the next job to process
   */
  private getNextJob(): EmailQueueJob | null {
    const now = new Date();

    for (const [jobId, job] of this.jobQueue) {
      // Skip if already processing
      if (this.processingQueue.has(jobId)) {
        continue;
      }

      // Skip if scheduled for future
      if (job.scheduledAt > now) {
        continue;
      }

      return job;
    }

    return null;
  }

  /**
   * Process a single batch job (provider-aware)
   */
  private async processBatchJob(job: EmailQueueJob): Promise<void> {
    const config = await this.getProviderConfig();
    const providerType = await this.getProviderType();

    console.log(
      `Processing batch job ${job.id} with ${job.recipients.length} recipients (${providerType} provider)`,
    );

    const provider = await this.getProvider();
    let successCount = 0;
    let failureCount = 0;
    let rateLimitTriggered = false;
    let rateLimitRequeued = false;

    for (let index = 0; index < job.recipients.length; index++) {
      const recipient = job.recipients[index];

      // Check rate limit before each email (only if rate limiting enabled)
      if (config.RATE_LIMIT_ENABLED) {
        const canSend = await this.canSendEmails();
        if (!canSend) {
          const remainingRecipients = job.recipients.slice(index);
          if (remainingRecipients.length > 0) {
            await this.requeueBatch(job, remainingRecipients);
            rateLimitTriggered = true;
            rateLimitRequeued = true;
          }
          break;
        }
      }

      try {
        const emailOptions: EmailOptions = {
          to: recipient.emailAddress,
          subject: job.subject,
          html: job.bodyHtml,
          text: htmlToPlainText(job.bodyHtml),
          from: job.settings.fromEmail,
          fromName: job.settings.fromName,
          replyTo: job.settings.replyTo,
          attachments: job.attachments,
        };

        const result = await provider.sendEmail(emailOptions);

        if (!result.success && this.isRateLimitError(undefined, result.error)) {
          const rateLimitResult = await this.handleRateLimitBackoff(
            job,
            index,
            config,
            undefined,
            result.error,
          );
          rateLimitTriggered = true;
          rateLimitRequeued = rateLimitResult.requeued;
          failureCount += rateLimitResult.failedCount;
          break;
        }

        if (config.RATE_LIMIT_ENABLED && result.success) {
          this.rateLimitWindow.count++;
          this.rateLimitMinuteWindow.count++;
        }

        if (result.success) {
          await this.emailRepository.updateRecipientStatus(
            job.emailId,
            recipient.contactId ?? null,
            recipient.emailAddress,
            {
              status: 'sent',
              sent_at: new Date(),
              error_message: null,
            },
          );
          successCount++;
          if (result.previewUrl) {
            console.log(`📧 Email preview for ${recipient.emailAddress}: ${result.previewUrl}`);
          }
        } else {
          await this.emailRepository.updateRecipientStatus(
            job.emailId,
            recipient.contactId ?? null,
            recipient.emailAddress,
            {
              status: 'failed',
              error_message: result.error || null,
            },
          );
          failureCount++;
          console.warn(`❌ Email failed for ${recipient.emailAddress}: ${result.error}`);
        }
      } catch (error) {
        if (this.isRateLimitError(error)) {
          const rateLimitResult = await this.handleRateLimitBackoff(job, index, config, error);
          rateLimitTriggered = true;
          rateLimitRequeued = rateLimitResult.requeued;
          failureCount += rateLimitResult.failedCount;
          break;
        }

        failureCount++;
        console.error(`💥 Error sending email to ${recipient.emailAddress}:`, error);

        await this.emailRepository.updateRecipientStatus(
          job.emailId,
          recipient.contactId ?? null,
          recipient.emailAddress,
          {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        );
      }

      await this.sleep(config.EMAIL_DELAY_MS);
    }

    if (rateLimitTriggered) {
      if (rateLimitRequeued) {
        console.log(
          `⏳ Batch job ${job.id} paused after ${successCount} success, ${failureCount} failed due to provider rate limiting`,
        );
      } else {
        console.warn(
          `⚠️ Batch job ${job.id} exhausted rate limit retries. ${successCount} success, ${failureCount} failed`,
        );
      }
    } else {
      console.log(
        `✅ Batch job ${job.id} completed: ${successCount} success, ${failureCount} failed`,
      );
    }

    await this.checkAndUpdateEmailStatus(job.emailId);
  }

  private isRateLimitError(error: unknown, explicitMessage?: string): boolean {
    const candidateMessages: string[] = [];

    if (typeof explicitMessage === 'string') {
      candidateMessages.push(explicitMessage);
    }

    if (error && typeof error === 'object') {
      const errObj = error as {
        message?: string;
        response?: string;
        responseCode?: number;
        statusCode?: number;
        code?: string;
      };

      if (typeof errObj.message === 'string') {
        candidateMessages.push(errObj.message);
      }

      if (typeof errObj.response === 'string') {
        candidateMessages.push(errObj.response);
      }

      if (errObj.responseCode === 429 || errObj.statusCode === 429) {
        return true;
      }

      if (
        typeof errObj.code === 'string' &&
        errObj.code.toLowerCase() === 'eenvelope' &&
        typeof errObj.response === 'string' &&
        errObj.response.includes('429')
      ) {
        return true;
      }
    }

    return candidateMessages.some((message) => {
      const normalized = message.toLowerCase();
      return (
        normalized.includes('429') ||
        normalized.includes('rate limit') ||
        normalized.includes('too many requests')
      );
    });
  }

  private getRateLimitErrorMessage(error: unknown, explicitMessage?: string): string {
    if (typeof explicitMessage === 'string' && explicitMessage.trim().length > 0) {
      return explicitMessage;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      typeof (error as { response?: string }).response === 'string'
    ) {
      return (error as { response: string }).response;
    }

    return 'Rate limit exceeded';
  }

  private getRetryAfterDelayMs(error: unknown, explicitMessage?: string): number | null {
    const parseNumericDelay = (value: string | number): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 100000 ? value : value * 1000;
      }

      const num = Number(value);
      if (!Number.isFinite(num)) {
        return null;
      }

      return num > 100000 ? num : num * 1000;
    };

    const parseDateDelay = (value: string): number | null => {
      const retryDate = new Date(value);
      const diff = retryDate.getTime() - Date.now();
      return diff > 0 ? diff : null;
    };

    const candidates: Array<string | number> = [];

    if (typeof explicitMessage === 'string') {
      candidates.push(explicitMessage);
    }

    if (error && typeof error === 'object') {
      const errObj = error as {
        retryAfter?: string | number;
        headers?: Record<string, unknown>;
        response?: string;
        message?: string;
      };

      if (typeof errObj.retryAfter === 'string' || typeof errObj.retryAfter === 'number') {
        candidates.push(errObj.retryAfter);
      }

      if (errObj.headers && typeof errObj.headers === 'object') {
        const headerValue = (errObj.headers as Record<string, unknown>)['retry-after'];
        if (typeof headerValue === 'string' || typeof headerValue === 'number') {
          candidates.push(headerValue);
        }
      }

      if (typeof errObj.response === 'string') {
        candidates.push(errObj.response);
      }

      if (typeof errObj.message === 'string') {
        candidates.push(errObj.message);
      }
    }

    for (const candidate of candidates) {
      if (typeof candidate === 'number') {
        const numericDelay = parseNumericDelay(candidate);
        if (numericDelay !== null) {
          return numericDelay;
        }
      }

      if (typeof candidate === 'string') {
        const numericDelay = parseNumericDelay(candidate);
        if (numericDelay !== null) {
          return numericDelay;
        }

        const dateDelay = parseDateDelay(candidate);
        if (dateDelay !== null) {
          return dateDelay;
        }

        const retryAfterMatch = candidate.match(/retry[ -]?after[:]?\s*(\d+)/i);
        if (retryAfterMatch && retryAfterMatch[1]) {
          const parsed = Number(retryAfterMatch[1]);
          if (Number.isFinite(parsed)) {
            return parsed * 1000;
          }
        }

        const retryInMatch = candidate.match(
          /retry (?:in|after)\s*(\d+)\s*(seconds|second|secs|s)?/i,
        );
        if (retryInMatch && retryInMatch[1]) {
          const parsed = Number(retryInMatch[1]);
          if (Number.isFinite(parsed)) {
            return parsed * 1000;
          }
        }
      }
    }

    return null;
  }

  private async handleRateLimitBackoff(
    job: EmailQueueJob,
    startIndex: number,
    config: ProviderConfig,
    error: unknown,
    explicitMessage?: string,
  ): Promise<{ requeued: boolean; failedCount: number }> {
    const remainingRecipients = job.recipients.slice(startIndex);
    if (remainingRecipients.length === 0) {
      return { requeued: false, failedCount: 0 };
    }

    const attempt = job.rateLimitRetries + 1;
    const message = this.getRateLimitErrorMessage(error, explicitMessage);
    const retryAfterDelay = this.getRetryAfterDelayMs(error, explicitMessage);

    const fallbackDelay =
      this.RATE_LIMIT_BACKOFF_MS[Math.min(attempt - 1, this.RATE_LIMIT_BACKOFF_MS.length - 1)];
    const delay =
      retryAfterDelay !== null ? Math.max(retryAfterDelay, fallbackDelay) : fallbackDelay;
    const backoffEnd = new Date(Date.now() + delay);

    if (attempt > this.MAX_RATE_LIMIT_RETRIES) {
      console.error(
        `Job ${job.id} rate limit exceeded after ${this.MAX_RATE_LIMIT_RETRIES} attempts. Marking ${remainingRecipients.length} recipients as failed.`,
      );

      for (const recipient of remainingRecipients) {
        await this.emailRepository.updateRecipientStatus(
          job.emailId,
          recipient.contactId ?? null,
          recipient.emailAddress,
          {
            status: 'failed',
            error_message: `Rate limit exceeded: ${message}`,
          },
        );
      }

      this.globalRateLimitUntil = backoffEnd;
      this.rateLimitWindow = { startTime: new Date(), count: 0 };
      this.rateLimitMinuteWindow = { startTime: new Date(), count: 0 };
      return { requeued: false, failedCount: remainingRecipients.length };
    }

    const requeueJob: EmailQueueJob = {
      ...job,
      id: `${job.emailId}-${job.batchIndex}-ratelimit-${Date.now()}`,
      recipients: remainingRecipients,
      rateLimitRetries: attempt,
      scheduledAt: backoffEnd,
    };

    this.jobQueue.set(requeueJob.id, requeueJob);

    this.globalRateLimitUntil = backoffEnd;
    this.rateLimitWindow = { startTime: new Date(), count: 0 };
    this.rateLimitMinuteWindow = { startTime: new Date(), count: 0 };

    console.warn(
      `⏳ Rate limit encountered for job ${job.id}. Pausing all email sends for ${delay}ms (attempt ${attempt}/${this.MAX_RATE_LIMIT_RETRIES}). Message: ${message}`,
    );

    return { requeued: true, failedCount: 0 };
  }

  /**
   * Handle job failure and retry logic
   */
  private async handleJobFailure(job: EmailQueueJob, error: unknown): Promise<void> {
    job.retryCount++;
    job.rateLimitRetries = 0;

    if (job.retryCount <= this.MAX_RETRIES) {
      // Schedule retry with exponential backoff
      const retryDelay =
        this.RETRY_DELAYS[job.retryCount - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
      job.scheduledAt = new Date(Date.now() + retryDelay);

      console.log(
        `Retrying job ${job.id} in ${retryDelay}ms (attempt ${job.retryCount}/${this.MAX_RETRIES})`,
      );
    } else {
      // Max retries reached, fail the job
      console.error(`Job ${job.id} failed after ${this.MAX_RETRIES} retries:`, error);

      // Mark all recipients in this batch as failed
      for (const recipient of job.recipients) {
        await this.emailRepository.updateRecipientStatus(
          job.emailId,
          recipient.contactId ?? null,
          recipient.emailAddress,
          {
            status: 'failed',
            error_message: 'Max retries exceeded',
          },
        );
      }

      // Remove failed job
      this.jobQueue.delete(job.id);
      await this.checkAndUpdateEmailStatus(job.emailId);
    }
  }

  /**
   * Re-queue a batch with remaining recipients
   */
  private async requeueBatch(
    originalJob: EmailQueueJob,
    remainingRecipients: ResolvedRecipient[],
  ): Promise<void> {
    const newJob: EmailQueueJob = {
      ...originalJob,
      id: `${originalJob.emailId}-${originalJob.batchIndex}-requeue-${Date.now()}`,
      recipients: remainingRecipients,
      scheduledAt: new Date(Date.now() + 1000), // Delay 1 second
    };

    this.jobQueue.set(newJob.id, newJob);
  }

  /**
   * Check if all batches for an email are completed and update status
   */
  private async checkAndUpdateEmailStatus(emailId: bigint): Promise<void> {
    // Check if there are any pending jobs for this email
    const pendingJobs = Array.from(this.jobQueue.entries()).filter(
      ([jobId, job]) => job.emailId === emailId && !this.processingQueue.has(jobId),
    );
    if (pendingJobs.length > 0) {
      return; // Still have pending batches
    }

    const statusCounts = await this.emailRepository.getRecipientStatusCounts(emailId);

    const stats = statusCounts.reduce(
      (acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalRecipients = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const successfulDeliveries = stats.sent || 0;
    const failedDeliveries = stats.failed || 0;

    // Determine final email status
    let finalStatus: 'sent' | 'failed' | 'partial' = 'sent';
    if (successfulDeliveries === 0) {
      finalStatus = 'failed';
    } else if (failedDeliveries > 0) {
      finalStatus = 'partial';
    }

    // Update email record
    await this.emailRepository.updateEmail(emailId, {
      status: finalStatus,
      sent_at: new Date(),
      successful_deliveries: successfulDeliveries,
      failed_deliveries: failedDeliveries,
    });

    console.log(
      `Email ${emailId} completed: ${successfulDeliveries}/${totalRecipients} sent successfully`,
    );
  }

  /**
   * Get queue metrics for monitoring (provider-aware)
   */
  public async getQueueMetrics(): Promise<QueueMetrics & { provider: string }> {
    const config = await this.getProviderConfig();
    const providerType = await this.getProviderType();
    const pending = this.jobQueue.size - this.processingQueue.size;
    const processing = this.processingQueue.size;

    return {
      pending,
      processing,
      completed: 0, // Would need persistent storage to track
      failed: 0, // Would need persistent storage to track
      provider: providerType,
      rateLimit: {
        emailsPerSecond: config.MAX_EMAILS_PER_SECOND,
        emailsPerMinute: config.MAX_EMAILS_PER_MINUTE,
        currentWindow: {
          startTime: this.rateLimitWindow.startTime,
          count: this.rateLimitWindow.count,
        },
      },
    };
  }

  /**
   * Utility method for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Resolve recipients from selection criteria
   * TODO: This will be moved to a separate RecipientResolver service
   */
  private async resolveRecipients(
    accountId: bigint,
    seasonId: bigint | null,
    selection: EmailRecipientGroupsType,
  ): Promise<ResolvedRecipient[]> {
    const recipients: ResolvedRecipient[] = [];
    const seasonSelection = selection.seasonSelection;
    const useManagersOnly = seasonSelection?.managersOnly === true;

    // Add individual contacts
    if (selection.contacts && selection.contacts.length > 0) {
      const contactIds = selection.contacts.map((id: string) => BigInt(id));
      const contacts = await this.emailRepository.findContactsByIds(accountId, contactIds);

      recipients.push(
        ...contacts.map((contact) => ({
          contactId: contact.id,
          emailAddress: contact.email!,
          contactName: `${contact.firstname} ${contact.lastname}`.trim(),
          recipientType: 'individual',
        })),
      );
    }

    if (seasonId && seasonSelection?.season) {
      if (useManagersOnly) {
        // Get all managers for all teams in the season
        const seasonTeams = await this.teamService.getTeamsBySeasonId(seasonId, accountId);
        for (const team of seasonTeams) {
          const teamManagers = await this.teamManagerService.listManagers(BigInt(team.id));
          recipients.push(
            ...teamManagers.map((manager) => ({
              contactId: BigInt(manager.contact.id),
              emailAddress: manager.contact.email ?? '',
              contactName: `${manager.contact.firstName} ${manager.contact.lastName}`.trim(),
              recipientType: 'teamManager',
            })),
          );
        }
      } else {
        const seasonContacts = await this.seasonRepository.findSeasonParticipants(
          accountId,
          seasonId,
        );

        recipients.push(
          ...seasonContacts.map((contact) => ({
            contactId: contact.id,
            emailAddress: contact.email!,
            contactName: `${contact.firstname} ${contact.lastname}`.trim(),
            recipientType: 'season',
          })),
        );
      }
    }

    // add league members
    if (seasonId && seasonSelection?.leagues && seasonSelection.leagues.length > 0) {
      const leagueIds = seasonSelection.leagues.map((id: string) => BigInt(id));
      for (const id of leagueIds) {
        // get the teams in a league for the season
        const leagueTeams = await this.teamService.getTeamsByLeagueSeasonId(
          id,
          seasonId,
          accountId,
        );
        for (const team of leagueTeams) {
          if (useManagersOnly) {
            const teamManagers = await this.teamManagerService.listManagers(BigInt(team.id));
            recipients.push(
              ...teamManagers.map((manager) => ({
                contactId: BigInt(manager.contact.id),
                emailAddress: manager.contact.email ?? '',
                contactName: `${manager.contact.firstName} ${manager.contact.lastName}`.trim(),
                recipientType: 'teamManager',
              })),
            );
          } else {
            // for each team, get the roster members
            const teamMembers = await this.rosterService.getTeamRosterMembers(
              BigInt(team.id),
              seasonId,
              accountId,
            );

            recipients.push(
              ...teamMembers.rosterMembers.map((rosterMember) => ({
                contactId: BigInt(rosterMember.player.contact.id),
                emailAddress: rosterMember.player.contact.email!,
                contactName:
                  `${rosterMember.player.contact.firstName} ${rosterMember.player.contact.lastName}`.trim(),
                recipientType: 'league',
              })),
            );
          }
        }
      }
    }

    if (seasonId && seasonSelection?.divisions && seasonSelection.divisions.length > 0) {
      const divisionIds = seasonSelection.divisions.map((id: string) => BigInt(id));
      for (const id of divisionIds) {
        // get the teams in a division for the season
        const divisionTeams = await this.teamService.getTeamsByDivisionSeasonId(
          id,
          seasonId,
          accountId,
        );
        for (const team of divisionTeams) {
          if (useManagersOnly) {
            const teamManagers = await this.teamManagerService.listManagers(BigInt(team.id));
            recipients.push(
              ...teamManagers.map((manager) => ({
                contactId: BigInt(manager.contact.id),
                emailAddress: manager.contact.email ?? '',
                contactName: `${manager.contact.firstName} ${manager.contact.lastName}`.trim(),
                recipientType: 'teamManager',
              })),
            );
          } else {
            // for each team, get the roster members
            const teamMembers = await this.rosterService.getTeamRosterMembers(
              BigInt(team.id),
              seasonId,
              accountId,
            );

            recipients.push(
              ...teamMembers.rosterMembers.map((rosterMember) => ({
                contactId: BigInt(rosterMember.player.contact.id),
                emailAddress: rosterMember.player.contact.email!,
                contactName:
                  `${rosterMember.player.contact.firstName} ${rosterMember.player.contact.lastName}`.trim(),
                recipientType: 'division',
              })),
            );
          }
        }
      }
    }

    // add team members
    if (seasonId && seasonSelection?.teams && seasonSelection.teams.length > 0) {
      const teamIds = seasonSelection.teams.map((id: string) => BigInt(id));
      for (const id of teamIds) {
        if (useManagersOnly) {
          const teamManagers = await this.teamManagerService.listManagers(id);
          recipients.push(
            ...teamManagers.map((manager) => ({
              contactId: BigInt(manager.contact.id),
              emailAddress: manager.contact.email ?? '',
              contactName: `${manager.contact.firstName} ${manager.contact.lastName}`.trim(),
              recipientType: 'teamManager',
            })),
          );
        } else {
          const teamMembers = await this.rosterService.getTeamRosterMembers(
            id,
            seasonId,
            accountId,
          );

          recipients.push(
            ...teamMembers.rosterMembers.map((rosterMember) => ({
              contactId: BigInt(rosterMember.player.contact.id),
              emailAddress: rosterMember.player.contact.email!,
              contactName:
                `${rosterMember.player.contact.firstName} ${rosterMember.player.contact.lastName}`.trim(),
              recipientType: 'team',
            })),
          );
        }
      }
    }

    if (selection.workoutRecipients && selection.workoutRecipients.length > 0) {
      for (const workoutSelection of selection.workoutRecipients) {
        const workoutId = BigInt(workoutSelection.workoutId);
        const registrations = await this.workoutRepository.listRegistrations(
          accountId,
          workoutId,
          WORKOUT_REGISTRATIONS_MAX_EXPORT,
        );

        const registrationFilter =
          workoutSelection.registrationIds && workoutSelection.registrationIds.length > 0
            ? new Set(workoutSelection.registrationIds)
            : null;

        const managersOnlyFlag = workoutSelection.managersOnly === true;

        const targeted = registrations.filter((registration) => {
          if (registrationFilter && !registrationFilter.has(registration.id.toString())) {
            return false;
          }
          if (managersOnlyFlag && !registration.ismanager) {
            return false;
          }
          return true;
        });

        targeted.forEach((registration) => {
          recipients.push({
            contactId: null,
            emailAddress: registration.email,
            contactName: registration.name,
            recipientType: 'workoutRegistration',
          });
        });
      }
    }

    if (selection.teamsWantedRecipients && selection.teamsWantedRecipients.length > 0) {
      for (const classified of selection.teamsWantedRecipients) {
        const classifiedId = BigInt(classified.classifiedId);
        const contactInfo = await this.teamsWantedRepository.getTeamsWantedContactInfo(
          classifiedId,
          accountId,
        );
        const classifiedRecord = await this.teamsWantedRepository.findTeamsWantedById(
          classifiedId,
          accountId,
        );

        if (!contactInfo || !contactInfo.email) {
          continue;
        }

        const name = classifiedRecord?.name ?? 'Teams Wanted Recipient';

        recipients.push({
          contactId: null,
          emailAddress: contactInfo.email,
          contactName: name,
          recipientType: 'teamsWanted',
        });
      }
    }

    // Process umpire recipients
    if (selection.umpireRecipients && selection.umpireRecipients.length > 0) {
      for (const umpireSelection of selection.umpireRecipients) {
        const umpireId = BigInt(umpireSelection.umpireId);
        const umpire = await this.umpireRepository.findByAccountAndId(accountId, umpireId);

        if (umpire && umpire.contacts?.email) {
          const name =
            `${umpire.contacts.firstname || ''} ${umpire.contacts.lastname || ''}`.trim() ||
            'Umpire';

          recipients.push({
            contactId: umpire.contactid,
            emailAddress: umpire.contacts.email,
            contactName: name,
            recipientType: 'umpire',
          });
        }
      }
    }

    // remove duplicates and invalid emails
    const uniqueMap = new Map<string, ResolvedRecipient>();
    for (const recipient of recipients) {
      if (this.hasValidEmail(recipient.emailAddress) && !uniqueMap.has(recipient.emailAddress)) {
        uniqueMap.set(recipient.emailAddress, recipient);
      }
    }

    const uniqueRecipients = Array.from(uniqueMap.values());

    // Log summary
    console.log(
      `Resolved ${uniqueRecipients.length} unique recipients (from ${recipients.length} total)`,
    );

    return uniqueRecipients;
  }

  private hasValidEmail(email: string | null): boolean {
    return !!email && validator.isEmail(email);
  }

  private sanitizeDisplayName(name?: string | null): string {
    if (!name) {
      return '';
    }

    const normalized = name
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalized.length > 255 ? normalized.slice(0, 255) : normalized;
  }

  private buildContactDisplayName(
    firstName?: string | null,
    lastName?: string | null,
    fallback?: string,
  ): string {
    const parts = [firstName, lastName].map((part) => part?.trim()).filter(Boolean) as string[];
    if (parts.length === 0) {
      return fallback ? fallback.trim() : '';
    }
    return parts.join(' ');
  }

  private applySenderOverrides(
    baseSettings: EmailSettings,
    overrides: { fromName?: string | null; replyTo?: string | null },
    options: { requireReplyTo?: boolean } = {},
  ): EmailSettings {
    const overrideName = overrides.fromName ?? baseSettings.fromName;
    const sanitizedName = this.sanitizeDisplayName(overrideName) || baseSettings.fromName;

    const requireReplyTo = options.requireReplyTo ?? true;
    const candidateReplyTo = (overrides.replyTo ?? baseSettings.replyTo)?.trim();

    if (requireReplyTo && (!candidateReplyTo || !validator.isEmail(candidateReplyTo))) {
      throw new ValidationError('Queued emails require a valid reply-to email address');
    }

    if (candidateReplyTo && !validator.isEmail(candidateReplyTo)) {
      throw new ValidationError('Invalid reply-to email address');
    }

    return {
      ...baseSettings,
      fromName: sanitizedName,
      replyTo: candidateReplyTo,
    };
  }

  private resolveSystemSenderContext(): SenderContext {
    const baseSettings = EmailConfigFactory.getEmailSettings();
    const settings = this.applySenderOverrides(baseSettings, {}, { requireReplyTo: false });

    return {
      displayName: settings.fromName ?? baseSettings.fromName,
      replyTo: settings.replyTo,
      settings,
    };
  }

  private async resolveSenderContext(accountId: bigint, userId: string): Promise<SenderContext> {
    const baseSettings = EmailConfigFactory.getEmailSettings();
    const contact = await this.contactService.getContactByUserId(userId, accountId);

    const contactEmail = contact.email?.trim();
    if (!contactEmail || !validator.isEmail(contactEmail)) {
      throw new ValidationError('Sender contact must have a valid email address before sending');
    }

    const displayNameCandidate = this.buildContactDisplayName(
      contact.firstName,
      contact.lastName,
      contactEmail,
    );
    const overrides = this.applySenderOverrides(baseSettings, {
      fromName: displayNameCandidate,
      replyTo: contactEmail,
    });

    return {
      contactId: BigInt(contact.id),
      displayName: overrides.fromName ?? displayNameCandidate,
      replyTo: overrides.replyTo ?? contactEmail,
      settings: overrides,
    };
  }

  private buildSenderSettingsForEmail(email: {
    sender_contact_id?: bigint | null;
    sender_contact_name?: string | null;
    from_name_override?: string | null;
    reply_to_email?: string | null;
  }): { settings: EmailSettings; senderContactId?: bigint } {
    const baseSettings = EmailConfigFactory.getEmailSettings();
    const settings = this.applySenderOverrides(
      baseSettings,
      {
        fromName: email.from_name_override ?? email.sender_contact_name,
        replyTo: email.reply_to_email,
      },
      {
        requireReplyTo: Boolean(email.reply_to_email),
      },
    );

    return {
      settings,
      senderContactId: email.sender_contact_id ?? undefined,
    };
  }

  /**
   * Strip HTML tags for plain text version
   */
  /**
   * Generate HTML email template
   */
  private generatePasswordResetEmailHtml(
    username: string,
    resetUrl: string,
    accountName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${accountName}</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your password for your ${accountName} account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${accountName}. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email template
   */
  private generatePasswordResetEmailText(
    username: string,
    resetUrl: string,
    accountName: string,
  ): string {
    return `
${accountName} - Password Reset Request

Hello ${username},

We received a request to reset your password for your ${accountName} account.
To reset your password, please visit this link:
${resetUrl}

This link will expire in 24 hours for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This is an automated message from ${accountName}. Please do not reply to this email.
    `;
  }

  /**
   * Generate welcome email for new platform users
   */
  private generateGeneralWelcomeEmailHtml(loginUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ezRecSports.com</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ezRecSports.com</h1>
          </div>
          <div class="content">
            <h2>Welcome!</h2>
            <p>Thanks for creating an ezRecSports.com login. You're all set to sign in and connect with your organizations.</p>
            <p>Use the button below to access your account.</p>
            <a href="${loginUrl}" class="button">Sign In</a>
            <p>After signing in, you can join or manage organizations, review schedules, and stay connected with your teams.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ezRecSports.com. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateGeneralWelcomeEmailText(loginUrl: string): string {
    return `
Welcome to ezRecSports.com!

Thanks for creating an ezRecSports.com login. You're all set to sign in and connect with your organizations.

Sign in here: ${loginUrl}

After signing in, you can join or manage organizations, review schedules, and stay connected with your teams.

This is an automated message from ezRecSports.com. Please do not reply to this email.
    `.trim();
  }

  private generateAccountWelcomeEmailHtml(options: {
    accountName: string;
    accountDashboardUrl: string;
    loginUrl: string;
    contactName?: string;
    userName?: string;
  }): string {
    const { accountName, accountDashboardUrl, loginUrl, contactName, userName } = options;
    const greetingName = contactName || 'there';
    const loginLine = userName ? `<p>Your login: <strong>${userName}</strong></p>` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${accountName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${accountName}</h1>
          </div>
          <div class="content">
            <h2>Welcome aboard, ${greetingName}!</h2>
            <p>You're now connected to <strong>${accountName}</strong> on ezRecSports.com.</p>
            ${loginLine}
            <p>Sign in and head to the account dashboard to get started.</p>
            <a href="${loginUrl}" class="button">Sign In</a>
            <p>Once signed in, you can go directly to your account: <a href="${accountDashboardUrl}">${accountDashboardUrl}</a>.</p>
            <p>If you have any questions, reach out to your organization administrator.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ezRecSports.com. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAccountWelcomeEmailText(options: {
    accountName: string;
    accountDashboardUrl: string;
    loginUrl: string;
    contactName?: string;
    userName?: string;
  }): string {
    const { accountName, accountDashboardUrl, loginUrl, contactName, userName } = options;
    const greetingName = contactName || 'there';
    const loginLine = userName ? `Your login: ${userName}\n\n` : '';

    return `
Welcome aboard, ${greetingName}!

You're now connected to ${accountName} on ezRecSports.com.
${loginLine}Sign in: ${loginUrl}

After signing in, open your account dashboard here:
${accountDashboardUrl}

If you have any questions, reach out to your organization administrator.

This is an automated message from ezRecSports.com. Please do not reply to this email.
    `.trim();
  }

  private generateAccountPasswordSetupEmailHtml(options: {
    accountName?: string;
    accountDashboardUrl: string;
    resetUrl: string;
    contactName?: string;
    username: string;
  }): string {
    const { accountName, accountDashboardUrl, resetUrl, contactName, username } = options;
    const greetingName = contactName || username || 'there';
    const brand = accountName || 'ezRecSports.com';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${brand}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f6f8; }
          .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
          .header { background-color: #0d6efd; color: #ffffff; padding: 28px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 24px 20px 28px; }
          .content h2 { margin: 0 0 12px 0; font-size: 22px; color: #1f2937; }
          .content p { margin: 0 0 14px 0; }
          .button { display: inline-block; padding: 12px 20px; background-color: #0d6efd; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .muted { color: #6b7280; font-size: 14px; }
          .footer { padding: 16px 20px 24px; text-align: center; color: #6b7280; font-size: 12px; }
          a { color: #0d6efd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${brand}</h1>
          </div>
          <div class="content">
            <h2>Welcome!</h2>
            <p>Hi ${greetingName},</p>
            <p>
              An account has been created or linked for you on ${brand}. If you don’t have a password
              yet, use the link below to set one. If you already have a password, you can keep using
              it or reset it here.
            </p>
            <p><a href="${resetUrl}" class="button">Set your password</a></p>
            <p class="muted">If the button doesn't work, copy and paste this link:<br/><a href="${resetUrl}">${resetUrl}</a></p>
            <p>After setting your password, you can access your account here:<br/><a href="${accountDashboardUrl}">${accountDashboardUrl}</a></p>
            <p class="muted">If you didn’t expect this, you can ignore this email.</p>
          </div>
          <div class="footer">
            This is an automated message from ezRecSports.com. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAccountPasswordSetupEmailText(options: {
    accountName?: string;
    accountDashboardUrl: string;
    resetUrl: string;
    contactName?: string;
    username: string;
  }): string {
    const { accountName, accountDashboardUrl, resetUrl, contactName, username } = options;
    const greetingName = contactName || username;

    return [
      accountName ? `Welcome to ${accountName}!` : 'Welcome!',
      `Hi ${greetingName || 'there'},`,
      'An account has been created or linked for you. If you do not have a password yet, set one using the link below; if you already have a password, you can keep using it or reset it here.',
      '',
      `Set your password: ${resetUrl}`,
      `Afterwards, access your account: ${accountDashboardUrl}`,
      '',
      'If you didn’t expect this, you can ignore this email.',
      '',
      'Thanks,',
      'ezRecSports Team',
    ].join('\n');
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      const provider = await this.getProvider();
      return await provider.testConnection();
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}
