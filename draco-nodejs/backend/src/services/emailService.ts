// Enhanced Email Service for Draco Sports Manager
// Follows SRP/DIP - depends on IEmailProvider interface

import {
  IEmailProvider,
  EmailOptions,
  EmailComposeRequest,
  ResolvedRecipient,
  EmailSettings,
  EmailRecipientSelection,
} from '../interfaces/emailInterfaces.js';
import { EmailProviderFactory } from './email/EmailProviderFactory.js';
import { EmailConfigFactory } from '../config/email.js';
import prisma from '../lib/prisma.js';

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
  scheduledAt: Date;
  createdAt: Date;
}

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
  private rateLimitWindow: { startTime: Date; count: number } = {
    startTime: new Date(),
    count: 0,
  };

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
      MAX_EMAILS_PER_SECOND: 1000, // No real limits for test email
      MAX_EMAILS_PER_MINUTE: 60000,
      RATE_LIMIT_ENABLED: false, // No rate limiting for development
      EMAIL_DELAY_MS: 1, // Very fast for development
      PROCESS_INTERVAL_MS: 10, // Faster processing for dev
    },
  } as const;

  private readonly BATCH_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // ms delays for retries
  private currentProviderType: 'sendgrid' | 'ethereal' | null = null;

  constructor(config?: EmailConfig, fromEmail?: string, baseUrl?: string) {
    // Legacy constructor for backward compatibility
    this.baseUrl = baseUrl || EmailConfigFactory.getBaseUrl();

    // Start queue processor
    this.startQueueProcessor();

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
    request: EmailComposeRequest,
  ): Promise<bigint> {
    // Create email record in database
    const email = await prisma.emails.create({
      data: {
        account_id: accountId,
        created_by_user_id: createdByUserId,
        subject: request.subject,
        body_html: request.body,
        body_text: this.stripHtml(request.body),
        template_id: request.templateId,
        status: request.scheduledSend ? 'scheduled' : 'sending',
        scheduled_send_at: request.scheduledSend,
        created_at: new Date(),
      },
    });

    // If scheduled for future, return email ID (will be sent later by scheduler)
    if (request.scheduledSend && request.scheduledSend > new Date()) {
      return email.id;
    }

    // Send immediately
    await this.sendBulkEmail(email.id, request);

    return email.id;
  }

  /**
   * Send bulk email using queue processing
   */
  async sendBulkEmail(emailId: bigint, request: EmailComposeRequest): Promise<void> {
    try {
      // Get email record
      const email = await prisma.emails.findUnique({
        where: { id: emailId },
        include: { accounts: true },
      });

      if (!email) {
        throw new Error(`Email record not found: ${emailId}`);
      }

      // Resolve recipients
      const recipients = await this.resolveRecipients(email.account_id, request.recipients);

      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      // Create recipient records
      await prisma.email_recipients.createMany({
        data: recipients.map((recipient) => ({
          email_id: emailId,
          contact_id: recipient.contactId,
          email_address: recipient.emailAddress,
          contact_name: recipient.contactName,
          recipient_type: recipient.recipientType,
          status: 'pending',
        })),
      });

      // Update email with recipient count
      await prisma.emails.update({
        where: { id: emailId },
        data: {
          total_recipients: recipients.length,
          status: 'sending',
        },
      });

      // Queue email batches for processing
      await this.queueEmailBatches(emailId, recipients, email.subject, email.body_html);

      console.log(
        `Queued ${recipients.length} recipients in ${Math.ceil(recipients.length / this.BATCH_SIZE)} batches for email ${emailId}`,
      );
    } catch (error) {
      console.error(`Error queuing bulk email ${emailId}:`, error);

      // Update email status to failed
      await prisma.emails.update({
        where: { id: emailId },
        data: {
          status: 'failed',
        },
      });

      throw error;
    }
  }

  /**
   * Queue email batches for background processing
   */
  private async queueEmailBatches(
    emailId: bigint,
    recipients: ResolvedRecipient[],
    subject: string,
    bodyHtml: string,
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
        scheduledAt: now,
        createdAt: now,
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

    for (const recipient of job.recipients) {
      // Check rate limit before each email (only if rate limiting enabled)
      if (config.RATE_LIMIT_ENABLED) {
        const canSend = await this.canSendEmails();
        if (!canSend) {
          // Re-queue remaining recipients
          const remainingRecipients = job.recipients.slice(job.recipients.indexOf(recipient));
          if (remainingRecipients.length > 0) {
            await this.requeueBatch(job, remainingRecipients);
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
        };

        const result = await provider.sendEmail(emailOptions);

        // Update rate limit counter (only if rate limiting enabled)
        if (config.RATE_LIMIT_ENABLED) {
          this.rateLimitWindow.count++;
        }

        // Update recipient status
        await prisma.email_recipients.updateMany({
          where: {
            email_id: job.emailId,
            contact_id: recipient.contactId,
          },
          data: {
            status: result.success ? 'sent' : 'failed',
            sent_at: result.success ? new Date() : null,
            error_message: result.error || null,
          },
        });

        if (result.success) {
          successCount++;
          if (result.previewUrl) {
            console.log(`📧 Email preview for ${recipient.emailAddress}: ${result.previewUrl}`);
          }
        } else {
          failureCount++;
          console.warn(`❌ Email failed for ${recipient.emailAddress}: ${result.error}`);
        }
      } catch (error) {
        failureCount++;
        console.error(`💥 Error sending email to ${recipient.emailAddress}:`, error);

        // Update recipient status to failed
        await prisma.email_recipients.updateMany({
          where: {
            email_id: job.emailId,
            contact_id: recipient.contactId,
          },
          data: {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      // Provider-specific delay between emails
      await this.sleep(config.EMAIL_DELAY_MS);
    }

    console.log(
      `✅ Batch job ${job.id} completed: ${successCount} success, ${failureCount} failed`,
    );

    // Update email status if this was the last batch
    await this.checkAndUpdateEmailStatus(job.emailId);
  }

  /**
   * Handle job failure and retry logic
   */
  private async handleJobFailure(job: EmailQueueJob, error: unknown): Promise<void> {
    job.retryCount++;

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
        await prisma.email_recipients.updateMany({
          where: {
            email_id: job.emailId,
            contact_id: recipient.contactId,
          },
          data: {
            status: 'failed',
            error_message: 'Max retries exceeded',
          },
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
    const pendingJobs = Array.from(this.jobQueue.values()).filter((job) => job.emailId === emailId);
    if (pendingJobs.length > 0) {
      return; // Still have pending batches
    }

    // Get recipient statistics
    const recipientStats = await prisma.email_recipients.groupBy({
      by: ['status'],
      where: { email_id: emailId },
      _count: { status: true },
    });

    const stats = recipientStats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.status;
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
    await prisma.emails.update({
      where: { id: emailId },
      data: {
        status: finalStatus,
        sent_at: new Date(),
        successful_deliveries: successfulDeliveries,
        failed_deliveries: failedDeliveries,
      },
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
    selection: EmailRecipientSelection,
  ): Promise<ResolvedRecipient[]> {
    // Placeholder implementation - will be enhanced
    const recipients: ResolvedRecipient[] = [];

    // Add individual contacts
    if (selection.contactIds?.length > 0) {
      const contacts = await prisma.contacts.findMany({
        where: {
          id: { in: selection.contactIds.map((id: string) => BigInt(id)) },
          creatoraccountid: accountId,
          email: { not: null },
        },
      });

      recipients.push(
        ...contacts.map((contact) => ({
          contactId: contact.id,
          emailAddress: contact.email!,
          contactName: `${contact.firstname} ${contact.lastname}`.trim(),
          recipientType: 'individual',
        })),
      );
    }

    return recipients;
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
