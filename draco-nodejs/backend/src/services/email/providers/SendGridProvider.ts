// SendGrid Email Provider
// Follows LSP - implements IEmailProvider interface

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  IEmailProvider,
  EmailOptions,
  EmailResult,
  SendGridWebhookEvent,
  WebhookProcessingResult,
  RecipientUpdateData,
} from '../../../interfaces/emailInterfaces.js';
import { EmailConfig } from '../../../config/email.js';
import prisma from '../../../lib/prisma.js';

export class SendGridProvider implements IEmailProvider {
  private transporter: Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
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
    const fromEmail = email || 'noreply@ezrecsports.com';
    const fromName = name || 'ezRecSports.com';
    return `"${fromName}" <${fromEmail}>`;
  }

  /**
   * Process SendGrid webhook events
   */
  async processWebhookEvents(events: SendGridWebhookEvent[]): Promise<WebhookProcessingResult> {
    const result: WebhookProcessingResult = {
      processed: 0,
      errors: [],
    };

    for (const event of events) {
      try {
        await this.processWebhookEvent(event);
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
  private async processWebhookEvent(event: SendGridWebhookEvent): Promise<void> {
    // Find the email recipient by email address and message ID
    const recipient = await this.findRecipientByEvent(event);

    if (!recipient) {
      console.warn(`No recipient found for SendGrid event: ${event.sg_event_id} (${event.email})`);
      return;
    }

    // Map SendGrid events to our email status
    const statusMapping = {
      delivered: 'delivered',
      bounce: 'bounced',
      dropped: 'bounced', // Treat dropped as bounced
      open: 'opened',
      click: 'clicked',
      processed: 'sent', // Email was processed by SendGrid
      deferred: 'pending', // Temporary failure, still trying
      spam_report: 'bounced',
      unsubscribe: 'bounced', // Treat as bounced to prevent further sends
      group_unsubscribe: 'bounced',
      group_resubscribe: 'sent', // Back to sent status
    };

    const newStatus = statusMapping[event.event];
    if (!newStatus) {
      console.warn(`Unknown SendGrid event type: ${event.event}`);
      return;
    }

    // Update recipient status and add event record
    await this.updateRecipientFromEvent(recipient.id, event, newStatus);

    // Update email aggregate statistics
    await this.updateEmailStatistics(recipient.email_id, event.event);
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
        sent_at: 'desc', // Get the most recent one
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
    // Only update stats for specific events that affect totals
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

  /**
   * Verify SendGrid webhook signature (for security)
   * This would be used in the webhook endpoint to verify the request came from SendGrid
   */
  static verifyWebhookSignature(_payload: string, _signature: string, _publicKey: string): boolean {
    // This would implement SendGrid's webhook signature verification
    // For now, return true (in production, implement proper verification)
    console.warn(
      'SendGrid webhook signature verification not implemented - accepting all requests',
    );
    return true;
  }
}
