import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';

extendZodWithOpenApi(z);

// Request schemas
export const EmailRecipientGroupsSchema = z.object({
  season: z.boolean().optional().openapi({
    description: 'Includes all contacts associated with the current season.',
  }),
  leagues: z.array(z.string()).optional().openapi({
    description: 'Includes all contacts associated with the specified leagues.',
  }),
  divisions: z.array(z.string()).optional().openapi({
    description: 'Includes all contacts associated with the specified divisions.',
  }),
  teams: z.array(z.string()).optional().openapi({
    description: 'Includes all contacts associated with the specified teams.',
  }),
  contacts: z.array(z.string()).optional().openapi({
    description: 'Includes the specified contact IDs.',
  }),
  teamManagers: z.boolean().optional().openapi({
    description: 'Includes only team managers.',
  }),
});

export const EmailComposeSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  recipients: EmailRecipientGroupsSchema,
  subject: z.string(),
  body: z.string(),
  templateId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  scheduledSend: z.iso.datetime().optional(),
  status: z.enum(['scheduled', 'sending']),
});

export const UpsertEmailTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(2).max(500).optional(),
  subjectTemplate: z.string().min(2).max(100).optional(),
  bodyTemplate: z.string().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export const EmailTemplateSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  accountId: z.bigint().transform((val) => val.toString()),
  name: z.string(),
  description: z.string().optional(),
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string(),
  createdByUserId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean(),
});

export const EmailDetailRecipientSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  emailAddress: z.string(),
  contactName: z.string().optional(),
  recipientType: z.string().optional(),
  status: z.string(),
  sentAt: z.iso.datetime().optional(),
  deliveredAt: z.iso.datetime().optional(),
  openedAt: z.iso.datetime().optional(),
  clickedAt: z.iso.datetime().optional(),
  bounceReason: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const EmailAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  uploadedAt: z.iso.datetime().optional(),
  storagePath: z.string().optional(),
});

export const EmailDetailSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  subject: z.string(),
  bodyHtml: z.string().nullable(),
  bodyText: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  sentAt: z.iso.datetime().optional(),
  scheduledSendAt: z.iso.datetime().optional(),
  totalRecipients: z.number(),
  successfulDeliveries: z.number(),
  failedDeliveries: z.number(),
  bounceCount: z.number().optional(),
  openCount: z.number(),
  clickCount: z.number(),
  createdBy: z.string().nullable(),
  template: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  recipients: z.array(EmailDetailRecipientSchema),
  attachments: z.array(EmailAttachmentSchema),
});

export const EmailListItemSchema = z.object({
  id: z.string(),
  subject: z.string(),
  status: z.string(),
  createdAt: z.string(),
  sentAt: z.iso.datetime().optional(),
  totalRecipients: z.number(),
  successfulDeliveries: z.number(),
  failedDeliveries: z.number(),
  openCount: z.number(),
  clickCount: z.number(),
  createdBy: z.string().nullable(),
  templateName: z.string().nullable(),
});

export const EmailListPagedSchema = z.object({
  emails: z.array(EmailListItemSchema),
  pagination: PaginationWithTotalSchema,
});

export const EmailTemplatesListSchema = z.object({
  templates: z.array(EmailTemplateSchema),
  commonVariables: z.record(z.string(), z.string()),
});

// Email attachment upload result
export const AttachmentUploadResult = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  storagePath: z.string(),
});

// Types
export type EmailRecipientGroupsType = z.infer<typeof EmailRecipientGroupsSchema>;
export type EmailComposeType = z.infer<typeof EmailComposeSchema>;
export type UpsertEmailTemplateType = z.infer<typeof UpsertEmailTemplateSchema>;
export type EmailTemplateType = z.infer<typeof EmailTemplateSchema>;
export type EmailDetailRecipientType = z.infer<typeof EmailDetailRecipientSchema>;
export type EmailAttachmentType = z.infer<typeof EmailAttachmentSchema>;
export type EmailDetailType = z.infer<typeof EmailDetailSchema>;
export type EmailListItemType = z.infer<typeof EmailListItemSchema>;
export type EmailListPagedType = z.infer<typeof EmailListPagedSchema>;
export type EmailTemplatesListType = z.infer<typeof EmailTemplatesListSchema>;
export type AttachmentUploadResultType = z.infer<typeof AttachmentUploadResult>;
