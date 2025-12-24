// Resend Email Provider
// Implements IEmailProvider using the Resend transactional email API

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';
import { Webhook } from 'svix';
import {
  EmailOptions,
  EmailResult,
  IEmailProvider,
  RecipientUpdateData,
  ResendWebhookEvent,
  ServerEmailAttachment,
  WebhookProcessingResult,
} from '../../../interfaces/emailInterfaces.js';
import { EmailConfig, EmailSettings } from '../../../config/email.js';
import prisma from '../../../lib/prisma.js';
import type { Prisma } from '#prisma/client';

type ResendAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

export class ResendProvider implements IEmailProvider {
  private client: Resend;
  private config: EmailConfig;
  private settings: EmailSettings;

  constructor(config: EmailConfig, settings: EmailSettings) {
    if (!config.resendApiKey) {
      throw new Error('Missing Resend API key in email configuration');
    }

    this.config = config;
    this.settings = settings;
    this.client = new Resend(config.resendApiKey);
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const attachments = options.attachments
        ? await this.buildAttachments(options.attachments)
        : undefined;

      const { data, error } = await this.client.emails.send({
        from: this.formatFromAddress(options.from, options.fromName),
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments,
      });

      if (error) {
        console.error('Resend email send error:', error);
        return {
          success: false,
          error: error.message ?? 'Resend email send error',
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Resend email send exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email send error',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.domains.list();

      if (result.error) {
        console.error('Resend connection test failed:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Resend connection test exception:', error);
      return false;
    }
  }

  async processWebhookEvents(events: ResendWebhookEvent[]): Promise<WebhookProcessingResult> {
    const result: WebhookProcessingResult = {
      processed: 0,
      errors: [],
    };

    for (const event of events) {
      try {
        await this.processWebhookEvent(event);
        result.processed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Resend webhook error';
        result.errors.push(message);
        console.error('Resend webhook processing error:', error);
      }
    }

    return result;
  }

  private async processWebhookEvent(event: ResendWebhookEvent): Promise<void> {
    const eventType = this.resolveEventType(event);
    if (!eventType) {
      console.warn('Resend webhook received with unknown event type', event);
      return;
    }

    const recipientRecords = await this.findRecipientsByEvent(event);
    if (recipientRecords.length === 0) {
      console.warn('Resend webhook recipient lookup returned no records', event);
      return;
    }

    const newStatus = this.mapEventToStatus(eventType);
    if (!newStatus) {
      console.warn(`Resend webhook event type not mapped to status: ${eventType}`);
      return;
    }

    const eventTimestamp = this.resolveEventTimestamp(event);

    await Promise.all(
      recipientRecords.map(async (recipient) => {
        await this.updateRecipientFromEvent(recipient.id, event, newStatus, eventTimestamp);
        await this.updateEmailStatistics(recipient.email_id, eventType);
      }),
    );
  }

  private async findRecipientsByEvent(event: ResendWebhookEvent) {
    const toAddresses = this.resolveRecipientEmails(event);
    if (toAddresses.length === 0) {
      return [];
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return await prisma.email_recipients.findMany({
      where: {
        email_address: {
          in: toAddresses,
        },
        sent_at: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        sent_at: 'desc',
      },
    });
  }

  private async updateRecipientFromEvent(
    recipientId: bigint,
    event: ResendWebhookEvent,
    newStatus: string,
    eventTimestamp: Date | null,
  ): Promise<void> {
    const updateData: RecipientUpdateData = {
      status: newStatus,
    };

    const eventType = this.resolveEventType(event);

    switch (eventType) {
      case 'email.delivered':
        updateData.delivered_at = eventTimestamp ?? new Date();
        break;
      case 'email.opened':
        updateData.opened_at = eventTimestamp ?? new Date();
        break;
      case 'email.clicked':
        updateData.clicked_at = eventTimestamp ?? new Date();
        break;
      case 'email.bounced':
      case 'email.failed':
      case 'email.complained':
        updateData.bounce_reason =
          event.data?.reason || event.data?.smtp_response || `Resend ${eventType}`;
        updateData.error_message = updateData.bounce_reason;
        break;
    }

    await prisma.email_recipients.update({
      where: { id: recipientId },
      data: updateData,
    });

    await prisma.email_events.create({
      data: {
        email_recipient_id: recipientId,
        event_type: eventType ?? 'unknown',
        event_data: this.serializeEvent(event),
        occurred_at: eventTimestamp ?? new Date(),
      },
    });
  }

  private async updateEmailStatistics(emailId: bigint, eventType: string): Promise<void> {
    // Only update stats for certain event types
    if (!['email.bounced', 'email.opened', 'email.clicked'].includes(eventType)) {
      return;
    }

    const incrementField =
      eventType === 'email.bounced'
        ? 'bounce_count'
        : eventType === 'email.opened'
          ? 'open_count'
          : eventType === 'email.clicked'
            ? 'click_count'
            : null;

    if (!incrementField) {
      return;
    }

    await prisma.emails.update({
      where: { id: emailId },
      data: {
        [incrementField]: {
          increment: 1,
        },
      },
    });
  }

  static verifyWebhookSignature(
    payload: string,
    headers: {
      'svix-id'?: string;
      'svix-timestamp'?: string;
      'svix-signature'?: string;
    },
    secret: string,
  ): boolean {
    if (!secret) {
      console.warn('Resend webhook secret not configured, skipping signature verification');
      return true;
    }

    try {
      const webhook = new Webhook(secret);
      webhook.verify(payload, {
        'svix-id': headers['svix-id'] ?? '',
        'svix-timestamp': headers['svix-timestamp'] ?? '',
        'svix-signature': headers['svix-signature'] ?? '',
      });
      return true;
    } catch (error) {
      console.error('Resend webhook signature verification failed:', error);
      return false;
    }
  }

  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || this.settings.fromEmail;
    const fromName = name || this.settings.fromName;
    return `${fromName ? `"${fromName}" ` : ''}<${fromEmail}>`;
  }

  private async buildAttachments(
    attachments: ServerEmailAttachment[],
  ): Promise<ResendAttachment[] | undefined> {
    const transformed: ResendAttachment[] = [];

    for (const attachment of attachments) {
      const buffer = await this.resolveAttachmentBuffer(attachment);
      if (!buffer) {
        console.warn(
          `Skipping attachment "${attachment.filename}" for Resend email (no content available)`,
        );
        continue;
      }

      transformed.push({
        filename: attachment.filename || this.deriveFilename(attachment.path),
        content: buffer.toString('base64'),
        contentType: attachment.contentType,
      });
    }

    return transformed.length > 0 ? transformed : undefined;
  }

  private async resolveAttachmentBuffer(attachment: ServerEmailAttachment): Promise<Buffer | null> {
    if (attachment.content) {
      return attachment.content;
    }

    if (attachment.path) {
      try {
        return await fs.readFile(attachment.path);
      } catch (error) {
        console.error(`Failed to read attachment at path "${attachment.path}"`, error);
        return null;
      }
    }

    return null;
  }

  private deriveFilename(attachmentPath?: string): string {
    if (!attachmentPath) {
      return 'attachment';
    }

    return path.basename(attachmentPath);
  }

  private resolveEventType(event: ResendWebhookEvent): string | null {
    return event.type || event.data?.event || null;
  }

  private resolveRecipientEmails(event: ResendWebhookEvent): string[] {
    const emailData = event.data?.email;
    if (!emailData) {
      return [];
    }

    if (Array.isArray(emailData.to)) {
      return emailData.to.filter((value): value is string => typeof value === 'string');
    }

    if (typeof emailData.to === 'string') {
      return [emailData.to];
    }

    return [];
  }

  private resolveEventTimestamp(event: ResendWebhookEvent): Date | null {
    if (event.data?.created_at) {
      const created = new Date(event.data.created_at);
      if (!Number.isNaN(created.getTime())) {
        return created;
      }
    }

    const timestamp = event.data?.timestamp;
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000);
    }

    if (typeof timestamp === 'string') {
      const parsed = Number(timestamp);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed * 1000);
      }
    }

    return null;
  }

  private mapEventToStatus(eventType: string): string | null {
    const statusMapping: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.failed': 'failed',
      'email.complained': 'bounced',
    };

    return statusMapping[eventType] ?? null;
  }

  private serializeEvent(event: ResendWebhookEvent): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(event ?? {})) as Prisma.InputJsonValue;
  }
}
