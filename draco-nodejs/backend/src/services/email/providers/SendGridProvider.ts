// SendGrid Email Provider
// Follows LSP - implements IEmailProvider interface

import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  ContactBounceInfo,
  IEmailProvider,
  EmailOptions,
  EmailResult,
  SendGridWebhookEvent,
  WebhookProcessingResult,
  RecipientUpdateData,
} from '../../../interfaces/emailInterfaces.js';
import { EmailConfig, EmailSettings } from '../../../config/email.js';
import prisma from '../../../lib/prisma.js';
import { IEmailRepository } from '../../../repositories/interfaces/IEmailRepository.js';

export class SendGridProvider implements IEmailProvider {
  private transporter: Transporter;
  private config: EmailConfig;
  private settings: EmailSettings;
  private emailRepository: IEmailRepository;

  constructor(config: EmailConfig, settings: EmailSettings, emailRepository: IEmailRepository) {
    this.config = config;
    this.settings = settings;
    this.emailRepository = emailRepository;
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: this.formatFromAddress(options.from, options.fromName),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
        })),
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('SendGrid email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email send error',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SendGrid connection test failed:', error);
      return false;
    }
  }

  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || this.settings.fromEmail;
    const fromName = name || this.settings.fromName;
    return `"${fromName}" <${fromEmail}>`;
  }

  /**
   * Process SendGrid webhook events
   */
  async processWebhookEvents(events: unknown[]): Promise<WebhookProcessingResult> {
    const result: WebhookProcessingResult = {
      processed: 0,
      errors: [],
      contactBounces: [],
    };

    for (const event of events as SendGridWebhookEvent[]) {
      try {
        await this.processWebhookEvent(event, result.contactBounces);
        result.processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Event ${event.sg_event_id}: ${errorMessage}`);
        console.error(`SendGrid webhook processing error for event ${event.sg_event_id}:`, error);
      }
    }

    return result;
  }

  /**
   * Process a single SendGrid webhook event
   */
  private async processWebhookEvent(
    event: SendGridWebhookEvent,
    contactBounces: ContactBounceInfo[],
  ): Promise<void> {
    const recipient = await this.findRecipientByEvent(event);

    if (!recipient) {
      console.warn(`No recipient found for SendGrid event: ${event.sg_event_id} (${event.email})`);
      return;
    }

    const statusMapping = {
      delivered: 'delivered',
      bounce: 'bounced',
      dropped: 'bounced',
      open: 'opened',
      click: 'clicked',
      processed: 'sent',
      deferred: 'pending',
      spam_report: 'bounced',
      unsubscribe: 'bounced',
      group_unsubscribe: 'bounced',
      group_resubscribe: 'sent',
    };

    const newStatus = statusMapping[event.event];
    if (!newStatus) {
      console.warn(`Unknown SendGrid event type: ${event.event}`);
      return;
    }

    await this.updateRecipientFromEvent(recipient.id, event, newStatus);
    await this.updateEmailStatistics(recipient.email_id, event.event);

    if (
      (event.event === 'bounce' || event.event === 'spam_report' || event.event === 'dropped') &&
      recipient.contact_id !== null
    ) {
      const marked = await this.emailRepository.markContactBounced(recipient.contact_id);

      if (marked) {
        const senderContact = recipient.email?.sender_contact ?? null;
        const senderName = senderContact
          ? `${senderContact.firstname} ${senderContact.lastname}`.trim()
          : null;

        contactBounces.push({
          contactId: recipient.contact_id,
          emailAddress: recipient.email_address,
          contactName: recipient.contact_name ?? null,
          senderEmail: senderContact?.email ?? null,
          senderName,
          bounceReason: event.reason || event.response || `SendGrid ${event.event}`,
          emailSubject: recipient.email?.subject ?? '',
        });
      }
    }
  }

  /**
   * Find recipient record by webhook event data
   */
  private async findRecipientByEvent(event: SendGridWebhookEvent) {
    // Try to find by email address and recent timestamp (within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return await prisma.email_recipients.findFirst({
      where: {
        email_address: event.email,
        sent_at: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        sent_at: 'desc',
      },
      include: {
        email: {
          select: {
            account_id: true,
            subject: true,
            sender_contact: {
              select: {
                email: true,
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update recipient status from webhook event
   */
  private async updateRecipientFromEvent(
    recipientId: bigint,
    event: SendGridWebhookEvent,
    newStatus: string,
  ): Promise<void> {
    const eventTimestamp = new Date(event.timestamp * 1000);

    // Update recipient status
    const updateData: RecipientUpdateData = {
      status: newStatus,
    };

    // Set specific timestamps based on event type
    switch (event.event) {
      case 'delivered':
        updateData.delivered_at = eventTimestamp;
        break;
      case 'open':
        updateData.opened_at = eventTimestamp;
        break;
      case 'click':
        updateData.clicked_at = eventTimestamp;
        break;
      case 'bounce':
      case 'dropped':
      case 'spam_report':
        updateData.bounce_reason = event.reason || event.response || `SendGrid ${event.event}`;
        break;
    }

    // Update error message for failed events
    if (['bounce', 'dropped', 'spam_report', 'unsubscribe'].includes(event.event)) {
      updateData.error_message = event.reason || event.response || `SendGrid ${event.event} event`;
    }

    await prisma.email_recipients.update({
      where: { id: recipientId },
      data: updateData,
    });

    // Create detailed event record
    await prisma.email_events.create({
      data: {
        email_recipient_id: recipientId,
        event_type: event.event,
        event_data: {
          sg_event_id: event.sg_event_id,
          sg_message_id: event.sg_message_id,
          smtp_id: event['smtp-id'],
          reason: event.reason,
          status: event.status,
          response: event.response,
          url: event.url,
          category: event.category,
          unique_args: event.unique_args,
        },
        occurred_at: eventTimestamp,
        user_agent: event.useragent,
        ip_address: event.ip,
      },
    });
  }

  /**
   * Update email aggregate statistics
   */
  private async updateEmailStatistics(emailId: bigint, eventType: string): Promise<void> {
    if (eventType === 'delivered') {
      await this.recalculateSuccessfulDeliveries(emailId);
      return;
    }

    if (!['bounce', 'open', 'click'].includes(eventType)) {
      return;
    }

    const incrementField =
      eventType === 'bounce'
        ? 'bounce_count'
        : eventType === 'open'
          ? 'open_count'
          : eventType === 'click'
            ? 'click_count'
            : null;

    if (incrementField) {
      await prisma.emails.update({
        where: { id: emailId },
        data: {
          [incrementField]: {
            increment: 1,
          },
        },
      });
    }
  }

  private async recalculateSuccessfulDeliveries(emailId: bigint): Promise<void> {
    await this.emailRepository.incrementSuccessfulDeliveries(emailId);
  }

  /**
   * Verify SendGrid webhook signature (for security)
   * This would be used in the webhook endpoint to verify the request came from SendGrid
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
    publicKey: string,
  ): boolean {
    if (!publicKey) {
      return false;
    }
    try {
      const timestampedPayload = `${timestamp}\r\n${payload}\r\n`;
      const verify = crypto.createVerify('SHA256');
      verify.update(timestampedPayload);
      return verify.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }
}
