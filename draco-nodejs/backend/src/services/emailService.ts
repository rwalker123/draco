// Enhanced Email Service for Draco Sports Manager
// Follows SRP/DIP - depends on IEmailProvider interface

import {
  IEmailProvider,
  EmailOptions,
  EmailComposeRequest,
  ResolvedRecipient,
  EmailSettings,
  EmailRecipientSelection,
} from '../interfaces/emailInterfaces';
import { EmailProviderFactory } from './email/EmailProviderFactory';
import { EmailConfigFactory } from '../config/email';
import prisma from '../lib/prisma';

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

  constructor(config?: EmailConfig, fromEmail?: string, baseUrl?: string) {
    // Legacy constructor for backward compatibility
    this.baseUrl = baseUrl || EmailConfigFactory.getBaseUrl();
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
   * Send bulk email to resolved recipients
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

      // Resolve recipients (this will be implemented in RecipientResolver service)
      const recipients = await this.resolveRecipients(email.account_id, request.recipients);

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

      // Send emails in batches
      const batchSize = 100;
      const settings = EmailConfigFactory.getEmailSettings();

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await this.sendBatch(emailId, batch, email.subject, email.body_html, settings);
      }

      // Update email status
      await prisma.emails.update({
        where: { id: emailId },
        data: {
          status: 'sent',
          sent_at: new Date(),
          total_recipients: recipients.length,
        },
      });
    } catch (error) {
      console.error(`Error sending bulk email ${emailId}:`, error);

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
   * Send a batch of emails
   */
  private async sendBatch(
    emailId: bigint,
    recipients: ResolvedRecipient[],
    subject: string,
    bodyHtml: string,
    settings: EmailSettings,
  ): Promise<void> {
    const provider = await this.getProvider();

    for (const recipient of recipients) {
      try {
        const emailOptions: EmailOptions = {
          to: recipient.emailAddress,
          subject,
          html: bodyHtml,
          text: this.stripHtml(bodyHtml),
          from: settings.fromEmail,
          fromName: settings.fromName,
          replyTo: settings.replyTo,
        };

        const result = await provider.sendEmail(emailOptions);

        // Update recipient status
        await prisma.email_recipients.updateMany({
          where: {
            email_id: emailId,
            contact_id: recipient.contactId,
          },
          data: {
            status: result.success ? 'sent' : 'failed',
            sent_at: result.success ? new Date() : null,
            error_message: result.error || null,
          },
        });

        // Log preview URL for development
        if (result.previewUrl) {
          console.log(`Email preview for ${recipient.emailAddress}: ${result.previewUrl}`);
        }
      } catch (error) {
        console.error(`Error sending email to ${recipient.emailAddress}:`, error);

        // Update recipient status to failed
        await prisma.email_recipients.updateMany({
          where: {
            email_id: emailId,
            contact_id: recipient.contactId,
          },
          data: {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
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
