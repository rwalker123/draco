// Enhanced Email Service for Draco Sports Manager
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
import { NotFoundError } from '../utils/customErrors.js';
import {
  EmailListPagedType,
  EmailRecipientGroupsType,
  EmailSendType,
  PagingType,
} from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IEmailRepository,
  ISeasonsRepository,
  dbCreateEmailRecipientInput,
} from '../repositories/index.js';
import { EmailResponseFormatter } from '../responseFormatters/index.js';
import { RosterService } from './rosterService.js';
import { ServiceFactory } from './serviceFactory.js';
import validator from 'validator';
import { TeamService } from './teamService.js';

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
  private baseUrl: string;
  private jobQueue: Map<string, EmailQueueJob> = new Map();
  private processingQueue: Set<string> = new Set();
  private queueProcessor: NodeJS.Timeout | null = null;
  private scheduledEmailProcessor: NodeJS.Timeout | null = null;
  private rateLimitWindow: { startTime: Date; count: number } = {
    startTime: new Date(),
    count: 0,
  };
  private attachmentService: EmailAttachmentService;
  private emailRepository: IEmailRepository;
  private seasonRepository: ISeasonsRepository;
  private rosterService: RosterService;
  private teamService: TeamService;

  // Provider-specific queue configuration
  private readonly PROVIDER_CONFIGS = {
    sendgrid: {
      MAX_EMAILS_PER_SECOND: 80, // Conservative SendGrid limit
      MAX_EMAILS_PER_MINUTE: 4800,
      RATE_LIMIT_ENABLED: true,
      EMAIL_DELAY_MS: 12, // ~80 emails per second
      PROCESS_INTERVAL_MS: 100,
    },
    ethereal: {
      MAX_EMAILS_PER_SECOND: 100, // No real limits for test email
      MAX_EMAILS_PER_MINUTE: 6000,
      RATE_LIMIT_ENABLED: true, // No rate limiting for development
      EMAIL_DELAY_MS: 12, // Very fast for development
      PROCESS_INTERVAL_MS: 100, // Faster processing for dev
    },
  } as const;

  private readonly BATCH_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // ms delays for retries
  private readonly MAX_RATE_LIMIT_RETRIES = 5;
  private readonly RATE_LIMIT_BACKOFF_MS = [5000, 10000, 20000, 35000, 55000];
  private currentProviderType: 'sendgrid' | 'ethereal' | null = null;

  constructor(config?: EmailConfig, fromEmail?: string, baseUrl?: string) {
    // Legacy constructor for backward compatibility
    this.baseUrl = baseUrl || EmailConfigFactory.getBaseUrl();
    this.attachmentService = new EmailAttachmentService();
    this.emailRepository = RepositoryFactory.getEmailRepository();
    this.seasonRepository = RepositoryFactory.getSeasonsRepository();
    this.rosterService = ServiceFactory.getRosterService();
    this.teamService = ServiceFactory.getTeamService();

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
  private async getProviderType(): Promise<'sendgrid' | 'ethereal'> {
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
  ): Promise<boolean> {
    try {
      const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
      const settings = EmailConfigFactory.getEmailSettings();

      const emailOptions: EmailOptions = {
        to: toEmail,
        subject: 'Draco Sports Manager - Password Reset Request',
        html: this.generatePasswordResetEmailHtml(username, resetUrl),
        text: this.generatePasswordResetEmailText(username, resetUrl),
        from: settings.fromEmail,
        fromName: settings.fromName,
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

  /**
   * Compose and send bulk email to multiple recipients
   */
  async composeAndSendEmail(
    accountId: bigint,
    createdByUserId: string,
    request: EmailSendType,
  ): Promise<bigint> {
    const scheduledDateRaw = request.scheduledSend ? new Date(request.scheduledSend) : null;
    const scheduledDate =
      scheduledDateRaw && !Number.isNaN(scheduledDateRaw.getTime()) ? scheduledDateRaw : null;

    const shouldDelaySend = Boolean(scheduledDate && scheduledDate > new Date());
    const emailStatus = shouldDelaySend ? 'scheduled' : 'sending';

    const email = await this.emailRepository.createEmail({
      account_id: accountId,
      created_by_user_id: createdByUserId,
      subject: request.subject,
      body_html: request.body,
      body_text: this.stripHtml(request.body),
      template_id: request.templateId ? BigInt(request.templateId) : null,
      status: emailStatus,
      scheduled_send_at: scheduledDate,
      created_at: new Date(),
    });

    await this.sendBulkEmail(email.id, request, {
      queueImmediately: !shouldDelaySend,
    });

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
        attachments,
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

  /**
   * Queue email batches for background processing
   */
  private async queueEmailBatches(
    emailId: bigint,
    recipients: ResolvedRecipient[],
    subject: string,
    bodyHtml: string,
    attachments?: ServerEmailAttachment[],
  ): Promise<void> {
    const settings = EmailConfigFactory.getEmailSettings();
    const now = new Date();

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
        settings,
        retryCount: 0,
        rateLimitRetries: 0,
        scheduledAt: now,
        createdAt: now,
        attachments,
      };

      this.jobQueue.set(job.id, job);
    }
  }

  /**
   * Start the background queue processor
   */
  private startQueueProcessor(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
    }

    // Start with default interval, will adjust dynamically based on provider
    this.queueProcessor = setInterval(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        console.error('Queue processor error:', error);
      }
    }, 100); // Will be adjusted based on provider

    console.log('Email queue processor started');
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
              attachments,
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

    // If rate limiting is disabled (e.g., Ethereal Email), always allow
    if (!config.RATE_LIMIT_ENABLED) {
      return true;
    }

    const now = new Date();
    const windowStart = this.rateLimitWindow.startTime;
    const windowDurationMs = now.getTime() - windowStart.getTime();

    // Reset window if it's been more than a second
    if (windowDurationMs >= 1000) {
      this.rateLimitWindow = { startTime: now, count: 0 };
      return true;
    }

    // Check if we're under the per-second limit
    return this.rateLimitWindow.count < config.MAX_EMAILS_PER_SECOND;
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
          text: this.stripHtml(job.bodyHtml),
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
        }

        if (result.success) {
          await this.emailRepository.updateRecipientStatus(job.emailId, recipient.contactId, {
            status: 'sent',
            sent_at: new Date(),
            error_message: null,
          });
          successCount++;
          if (result.previewUrl) {
            console.log(`📧 Email preview for ${recipient.emailAddress}: ${result.previewUrl}`);
          }
        } else {
          await this.emailRepository.updateRecipientStatus(job.emailId, recipient.contactId, {
            status: 'failed',
            error_message: result.error || null,
          });
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

        await this.emailRepository.updateRecipientStatus(job.emailId, recipient.contactId, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
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

    if (attempt > this.MAX_RATE_LIMIT_RETRIES) {
      console.error(
        `Job ${job.id} rate limit exceeded after ${this.MAX_RATE_LIMIT_RETRIES} attempts. Marking ${remainingRecipients.length} recipients as failed.`,
      );

      for (const recipient of remainingRecipients) {
        await this.emailRepository.updateRecipientStatus(job.emailId, recipient.contactId, {
          status: 'failed',
          error_message: `Rate limit exceeded: ${message}`,
        });
      }

      return { requeued: false, failedCount: remainingRecipients.length };
    }

    const delay =
      this.RATE_LIMIT_BACKOFF_MS[attempt - 1] ??
      this.RATE_LIMIT_BACKOFF_MS[this.RATE_LIMIT_BACKOFF_MS.length - 1];

    const requeueJob: EmailQueueJob = {
      ...job,
      id: `${job.emailId}-${job.batchIndex}-ratelimit-${Date.now()}`,
      recipients: remainingRecipients,
      rateLimitRetries: attempt,
      scheduledAt: new Date(Date.now() + delay),
    };

    this.jobQueue.set(requeueJob.id, requeueJob);

    this.rateLimitWindow = {
      startTime: new Date(),
      count: config.MAX_EMAILS_PER_SECOND,
    };

    console.warn(
      `⏳ Rate limit encountered for job ${job.id}. Re-queued ${remainingRecipients.length} recipients in ${delay}ms (attempt ${attempt}/${this.MAX_RATE_LIMIT_RETRIES}). Message: ${message}`,
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
        await this.emailRepository.updateRecipientStatus(job.emailId, recipient.contactId, {
          status: 'failed',
          error_message: 'Max retries exceeded',
        });
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
    // Placeholder implementation - will be enhanced
    const recipients: ResolvedRecipient[] = [];

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

    if (seasonId && selection.season) {
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

    // add league members
    if (seasonId && selection.leagues && selection.leagues.length > 0) {
      const leagueIds = selection.leagues.map((id: string) => BigInt(id));
      for (const id of leagueIds) {
        // get the teams in a league for the season
        const leagueTeams = await this.teamService.getTeamsByLeagueSeasonId(
          id,
          seasonId,
          accountId,
        );
        for (const team of leagueTeams) {
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

    if (seasonId && selection.divisions && selection.divisions.length > 0) {
      const divisionIds = selection.divisions.map((id: string) => BigInt(id));
      for (const id of divisionIds) {
        // get the teams in a division for the season
        const divisionTeams = await this.teamService.getTeamsByDivisionSeasonId(
          id,
          seasonId,
          accountId,
        );
        for (const team of divisionTeams) {
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

    // add team members
    if (seasonId && selection.teams && selection.teams.length > 0) {
      const teamIds = selection.teams.map((id: string) => BigInt(id));
      for (const id of teamIds) {
        const teamMembers = await this.rosterService.getTeamRosterMembers(id, seasonId, accountId);

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

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Generate HTML email template
   */
  private generatePasswordResetEmailHtml(username: string, resetUrl: string): string {
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
            <h1>Draco Sports Manager</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your password for your Draco Sports Manager account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Draco Sports Manager. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email template
   */
  private generatePasswordResetEmailText(username: string, resetUrl: string): string {
    return `
Draco Sports Manager - Password Reset Request

Hello ${username},

We received a request to reset your password for your Draco Sports Manager account.

To reset your password, please visit this link:
${resetUrl}

This link will expire in 24 hours for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This is an automated message from Draco Sports Manager. Please do not reply to this email.
    `;
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
