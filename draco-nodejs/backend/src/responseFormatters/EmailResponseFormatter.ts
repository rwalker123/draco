import {
  EmailDetailRecipientType,
  EmailDetailType,
  EmailListItemType,
  EmailListPagedType,
} from '@draco/shared-schemas';
import { dbEmailDetails, dbEmailRecipient, dbEmailSummary } from '../repositories/index.js';
import { PaginationMeta } from '../utils/pagination.js';
import { DateUtils } from '../utils/dateUtils.js';

export class EmailResponseFormatter {
  private static formatDateTime(date?: Date | null): string | undefined {
    if (!date) {
      return undefined;
    }
    return DateUtils.formatDateTimeForResponse(date) ?? date.toISOString();
  }

  static formatEmailDetail(email: dbEmailDetails): EmailDetailType {
    const createdAt = this.formatDateTime(email.created_at) ?? email.created_at.toISOString();

    return {
      id: email.id.toString(),
      subject: email.subject,
      bodyHtml: email.body_html,
      bodyText: email.body_text,
      status: email.status,
      createdAt,
      sentAt: this.formatDateTime(email.sent_at),
      scheduledSendAt: this.formatDateTime(email.scheduled_send_at),
      totalRecipients: Number(email.total_recipients ?? 0),
      successfulDeliveries: Number(email.successful_deliveries ?? 0),
      failedDeliveries: Number(email.failed_deliveries ?? 0),
      bounceCount: email.bounce_count ? Number(email.bounce_count) : undefined,
      openCount: Number(email.open_count ?? 0),
      clickCount: Number(email.click_count ?? 0),
      createdBy: email.created_by?.username ?? null,
      template: email.template
        ? {
            id: email.template.id.toString(),
            name: email.template.name,
          }
        : null,
      recipients: email.recipients.map((recipient) => this.formatEmailRecipient(recipient)),
      attachments: email.attachments.map((attachment) => ({
        id: attachment.id.toString(),
        filename: attachment.filename,
        originalName: attachment.original_name,
        fileSize: Number(attachment.file_size ?? 0),
        mimeType: attachment.mime_type ?? 'application/octet-stream',
        uploadedAt: this.formatDateTime(attachment.uploaded_at),
        storagePath: attachment.storage_path ?? undefined,
      })),
    };
  }

  static formatEmailList(emails: dbEmailSummary[], pagination: PaginationMeta): EmailListPagedType {
    return {
      emails: emails.map((email) => this.toEmailListItem(email)),
      pagination,
    };
  }

  private static toEmailListItem(email: dbEmailSummary): EmailListItemType {
    const createdAt = this.formatDateTime(email.created_at) ?? email.created_at.toISOString();
    return {
      id: email.id.toString(),
      subject: email.subject,
      status: email.status,
      createdAt,
      sentAt: this.formatDateTime(email.sent_at),
      totalRecipients: Number(email.total_recipients ?? 0),
      successfulDeliveries: Number(email.successful_deliveries ?? 0),
      failedDeliveries: Number(email.failed_deliveries ?? 0),
      openCount: Number(email.open_count ?? 0),
      clickCount: Number(email.click_count ?? 0),
      createdBy: email.created_by?.username ?? null,
      templateName: email.template?.name ?? null,
    };
  }

  private static formatEmailRecipient(recipient: dbEmailRecipient): EmailDetailRecipientType {
    return {
      id: recipient.id.toString(),
      emailAddress: recipient.email_address,
      contactName: recipient.contact_name ?? undefined,
      recipientType: recipient.recipient_type ?? undefined,
      status: recipient.status,
      sentAt: this.formatDateTime(recipient.sent_at),
      deliveredAt: this.formatDateTime(recipient.delivered_at),
      openedAt: this.formatDateTime(recipient.opened_at),
      clickedAt: this.formatDateTime(recipient.clicked_at),
      bounceReason: recipient.bounce_reason ?? undefined,
      errorMessage: recipient.error_message ?? undefined,
    };
  }
}
