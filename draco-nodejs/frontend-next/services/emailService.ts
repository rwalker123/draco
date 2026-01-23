// Email Service for Frontend API Integration
// Handles all communication with the email backend APIs

import {
  composeAccountEmail as apiComposeAccountEmail,
  listAccountEmails as apiListAccountEmails,
  getAccountEmail as apiGetAccountEmail,
  createEmailTemplate as apiCreateEmailTemplate,
  listEmailTemplates as apiListEmailTemplates,
  getEmailTemplate as apiGetEmailTemplate,
  updateEmailTemplate as apiUpdateEmailTemplate,
  deleteEmailTemplate as apiDeleteEmailTemplate,
  previewEmailTemplate as apiPreviewEmailTemplate,
  uploadEmailAttachments as apiUploadEmailAttachments,
  listEmailAttachments as apiListEmailAttachments,
  downloadEmailAttachment as apiDownloadEmailAttachment,
  deleteEmailAttachment as apiDeleteEmailAttachment,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { EmailSendSchema } from '@draco/shared-schemas';
import type {
  AttachmentUploadResultType,
  EmailAttachmentType,
  EmailDetailRecipientType,
  EmailDetailType,
  EmailListItemType,
  EmailListPagedType,
  EmailRecipientGroupsType,
  EmailTemplateType,
  EmailSendType,
} from '@draco/shared-schemas';
import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';
import type {
  EmailComposeRequest,
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
  EmailRecord,
  EmailStatus,
  EmailRecipient,
  EmailListResponse,
  AttachmentDetails,
} from '../types/emails/email';

const DEFAULT_COMPOSE_EMAIL_ID = '0';

const toOptionalIsoString = (value?: Date): string | undefined => {
  if (!value) {
    return undefined;
  }

  const isoValue = value.toISOString();
  return isoValue;
};

const parseDate = (value?: string | null): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

const mapTemplate = (template: EmailTemplateType): EmailTemplate => ({
  id: template.id,
  accountId: template.accountId,
  name: template.name,
  description: template.description ?? undefined,
  subjectTemplate: template.subjectTemplate ?? undefined,
  bodyTemplate: template.bodyTemplate,
  createdByUserId: template.createdByUserId ?? undefined,
  createdAt: parseDate(template.createdAt) ?? new Date(template.createdAt),
  updatedAt: parseDate(template.updatedAt) ?? new Date(template.updatedAt),
  isActive: template.isActive,
});

const mapAttachment = (
  attachment: AttachmentUploadResultType | EmailAttachmentType,
): AttachmentDetails => {
  const uploadedAtValue =
    'uploadedAt' in attachment ? (attachment.uploadedAt ?? undefined) : undefined;

  return {
    id: attachment.id,
    filename: attachment.filename,
    originalName: attachment.originalName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType ?? null,
    uploadedAt: parseDate(uploadedAtValue),
  };
};

const mapRecipient = (recipient: EmailDetailRecipientType): EmailRecipient => ({
  id: recipient.id,
  emailAddress: recipient.emailAddress,
  contactName: recipient.contactName ?? undefined,
  recipientType: recipient.recipientType ?? undefined,
  status: recipient.status as EmailRecipient['status'],
  sentAt: parseDate(recipient.sentAt),
  deliveredAt: parseDate(recipient.deliveredAt),
  openedAt: parseDate(recipient.openedAt),
  clickedAt: parseDate(recipient.clickedAt),
  bounceReason: recipient.bounceReason ?? undefined,
  errorMessage: recipient.errorMessage ?? undefined,
});

const mapEmailDetail = (accountId: string, detail: EmailDetailType): EmailRecord => ({
  id: detail.id,
  accountId,
  createdByUserId: detail.createdBy ?? undefined,
  subject: detail.subject,
  bodyHtml: detail.bodyHtml ?? '',
  bodyText: detail.bodyText ?? undefined,
  templateId: detail.template?.id,
  status: detail.status as EmailStatus,
  scheduledSendAt: parseDate(detail.scheduledSendAt),
  createdAt: parseDate(detail.createdAt) ?? new Date(detail.createdAt),
  sentAt: parseDate(detail.sentAt),
  totalRecipients: detail.totalRecipients,
  successfulDeliveries: detail.successfulDeliveries,
  failedDeliveries: detail.failedDeliveries,
  bounceCount: detail.bounceCount ?? 0,
  openCount: detail.openCount,
  clickCount: detail.clickCount,
  recipients: detail.recipients?.map(mapRecipient) ?? [],
  attachments: detail.attachments?.map(mapAttachment) ?? [],
});

const mapEmailSummary = (accountId: string, summary: EmailListItemType): EmailRecord => ({
  id: summary.id,
  accountId,
  createdByUserId: summary.createdBy ?? undefined,
  subject: summary.subject,
  bodyHtml: '',
  bodyText: undefined,
  templateId: undefined,
  status: summary.status as EmailStatus,
  scheduledSendAt: undefined,
  createdAt: parseDate(summary.createdAt) ?? new Date(summary.createdAt),
  sentAt: parseDate(summary.sentAt),
  totalRecipients: summary.totalRecipients,
  successfulDeliveries: summary.successfulDeliveries,
  failedDeliveries: summary.failedDeliveries,
  bounceCount: 0,
  openCount: summary.openCount,
  clickCount: summary.clickCount,
});

const mapListResponse = (accountId: string, data: EmailListPagedType): EmailListResponse => ({
  emails: data.emails.map((item) => mapEmailSummary(accountId, item)),
  pagination: {
    total: data.pagination.total,
    page: data.pagination.page,
    limit: data.pagination.limit,
    totalPages:
      data.pagination.limit > 0 ? Math.ceil(data.pagination.total / data.pagination.limit) : 0,
  },
});

const mapRecipients = (recipients: EmailComposeRequest['recipients']): EmailRecipientGroupsType => {
  const groups: EmailRecipientGroupsType = {};

  if (recipients.contacts && recipients.contacts.length > 0) {
    groups.contacts = recipients.contacts;
  }

  if (recipients.seasonSelection) {
    groups.seasonSelection = {
      ...recipients.seasonSelection,
      leagues: recipients.seasonSelection.leagues?.length
        ? recipients.seasonSelection.leagues
        : undefined,
      divisions: recipients.seasonSelection.divisions?.length
        ? recipients.seasonSelection.divisions
        : undefined,
      teams: recipients.seasonSelection.teams?.length
        ? recipients.seasonSelection.teams
        : undefined,
    };
  }

  if (recipients.workoutRecipients && recipients.workoutRecipients.length > 0) {
    groups.workoutRecipients = recipients.workoutRecipients.map((recipient) => ({
      ...recipient,
      registrationIds: recipient.registrationIds?.length ? recipient.registrationIds : undefined,
    }));
  }

  if (recipients.teamsWantedRecipients && recipients.teamsWantedRecipients.length > 0) {
    groups.teamsWantedRecipients = recipients.teamsWantedRecipients;
  }

  if (recipients.umpireRecipients && recipients.umpireRecipients.length > 0) {
    groups.umpireRecipients = recipients.umpireRecipients;
  }

  return groups;
};

const buildComposePayload = (request: EmailComposeRequest): EmailSendType => {
  const payload: EmailSendType = {
    id: DEFAULT_COMPOSE_EMAIL_ID,
    recipients: mapRecipients(request.recipients),
    subject: request.subject,
    body: request.body,
    templateId: request.templateId,
    attachments: request.attachments?.length ? request.attachments : undefined,
    scheduledSend: toOptionalIsoString(request.scheduledSend),
    status: request.scheduledSend ? 'scheduled' : 'sending',
    seasonId: request.seasonId,
  };

  EmailSendSchema.parse(payload);

  return payload;
};

// Email service class
export class EmailService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  // Email Composition Methods

  async composeEmail(
    accountId: string,
    request: EmailComposeRequest,
    files?: File[],
  ): Promise<string> {
    const payload = buildComposePayload(request);

    if (files && files.length > 0) {
      // Use multipart form data when files are present
      // The OpenAPI generator types only the JSON content type, not multipart/form-data.
      // The formDataBodySerializer handles the actual serialization correctly.
      const result = await apiComposeAccountEmail({
        client: this.client,
        path: { accountId },
        // @ts-expect-error - multipart body has different shape than JSON body; serializer handles it
        body: { metadata: JSON.stringify(payload), attachments: files },
        throwOnError: false,
        ...formDataBodySerializer,
        headers: { 'Content-Type': null },
      });

      const data = unwrapApiResult(result, 'Failed to send email');
      return data.emailId;
    }

    // Use JSON when no files
    const result = await apiComposeAccountEmail({
      client: this.client,
      path: { accountId },
      body: payload,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to send email');
    return data.emailId;
  }

  async listEmails(
    accountId: string,
    page = 1,
    limit = 25,
    status?: EmailStatus,
  ): Promise<EmailListResponse> {
    const result = await apiListAccountEmails({
      client: this.client,
      path: { accountId },
      query: {
        page,
        limit,
        status,
      },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load emails');
    return mapListResponse(accountId, data as EmailListPagedType);
  }

  async getEmail(accountId: string, emailId: string): Promise<EmailRecord> {
    const result = await apiGetAccountEmail({
      client: this.client,
      path: { accountId, emailId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load email details') as EmailDetailType;
    return mapEmailDetail(accountId, data);
  }

  // Email Template Methods

  async createTemplate(
    accountId: string,
    template: EmailTemplateCreateRequest,
  ): Promise<EmailTemplate> {
    const result = await apiCreateEmailTemplate({
      client: this.client,
      path: { accountId },
      body: template,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to create template') as EmailTemplateType;
    return mapTemplate(data);
  }

  async listTemplates(accountId: string): Promise<EmailTemplate[]> {
    const result = await apiListEmailTemplates({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load templates');
    return data.templates.map(mapTemplate);
  }

  async getTemplate(accountId: string, templateId: string): Promise<EmailTemplate> {
    const result = await apiGetEmailTemplate({
      client: this.client,
      path: { accountId, templateId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load template') as EmailTemplateType;
    return mapTemplate(data);
  }

  async updateTemplate(
    accountId: string,
    templateId: string,
    updates: EmailTemplateUpdateRequest,
  ): Promise<EmailTemplate> {
    const result = await apiUpdateEmailTemplate({
      client: this.client,
      path: { accountId, templateId },
      body: updates,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to update template') as EmailTemplateType;
    return mapTemplate(data);
  }

  async deleteTemplate(accountId: string, templateId: string): Promise<void> {
    const result = await apiDeleteEmailTemplate({
      client: this.client,
      path: { accountId, templateId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete template');
  }

  async previewTemplate(
    accountId: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; body: string }> {
    const result = await apiPreviewEmailTemplate({
      client: this.client,
      path: { accountId, templateId },
      body: { variables },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to preview template');
  }

  // Attachment Methods

  async uploadAttachments(
    accountId: string,
    emailId: string,
    files: File[],
  ): Promise<AttachmentDetails[]> {
    const result = await apiUploadEmailAttachments({
      client: this.client,
      path: { accountId, emailId },
      body: { attachments: files },
      throwOnError: false,
      ...formDataBodySerializer,
      headers: { 'Content-Type': null },
    });

    const data = unwrapApiResult(
      result,
      'Failed to upload attachments',
    ) as AttachmentUploadResultType[];
    return data.map(mapAttachment);
  }

  async listAttachments(accountId: string, emailId: string): Promise<AttachmentDetails[]> {
    const result = await apiListEmailAttachments({
      client: this.client,
      path: { accountId, emailId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load attachments') as EmailAttachmentType[];
    return data.map(mapAttachment);
  }

  async downloadAttachment(
    accountId: string,
    emailId: string,
    attachmentId: string,
  ): Promise<Blob> {
    const result = await apiDownloadEmailAttachment({
      client: this.client,
      path: { accountId, emailId, attachmentId },
      throwOnError: false,
      parseAs: 'blob',
    });

    const data = unwrapApiResult(result, 'Failed to download attachment');
    return data as Blob;
  }

  async deleteAttachment(accountId: string, emailId: string, attachmentId: string): Promise<void> {
    const result = await apiDeleteEmailAttachment({
      client: this.client,
      path: { accountId, emailId, attachmentId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete attachment');
  }
}

// Factory function to create email service
export const createEmailService = (token?: string | null, client?: Client): EmailService => {
  return new EmailService(token, client);
};
