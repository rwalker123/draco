// Email Interfaces for Draco Sports Manager
// Follows ISP - segregated interfaces for different concerns

// Core email sending interface
export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  testConnection(): Promise<boolean>;
}

// Email options for sending
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: ServerEmailAttachment[];
}

// Email sending result
export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string; // For Ethereal Email preview
  error?: string;
}

// Email attachment
export interface ServerEmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

// Email attachment details
export interface AttachmentDetails {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string | null;
  uploadedAt: Date;
}

// Email attachment with buffer
export interface AttachmentWithBuffer {
  attachment: AttachmentDetails;
  buffer: Buffer;
}

// Template processing interface
export interface IEmailTemplateEngine {
  processTemplate(template: string, variables: Record<string, unknown>): string;
  validateTemplate(template: string): TemplateValidationResult;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  variables: string[];
}

export type EmailStatus = 'draft' | 'sending' | 'sent' | 'failed' | 'scheduled' | 'partial';

export interface EmailRecipient {
  id: bigint;
  emailId: bigint;
  contactId: bigint;
  emailAddress: string;
  contactName?: string;
  recipientType?: string;
  status: EmailRecipientStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bounceReason?: string;
  errorMessage?: string;
}

export type EmailRecipientStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'failed'
  | 'opened'
  | 'clicked';

// Email analytics interfaces
export interface EmailAnalytics {
  emailId: bigint;
  totalRecipients: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// Email tracking interface
export interface IEmailTracker {
  trackSent(recipientId: bigint): Promise<void>;
  trackDelivered(recipientId: bigint): Promise<void>;
  trackOpened(recipientId: bigint, userAgent?: string, ipAddress?: string): Promise<void>;
  trackClicked(recipientId: bigint, userAgent?: string, ipAddress?: string): Promise<void>;
  trackBounced(recipientId: bigint, bounceReason: string): Promise<void>;
}

// Recipient resolution interface
export interface ResolvedRecipient {
  contactId: bigint;
  emailAddress: string;
  contactName: string;
  recipientType: string;
}

export interface EmailSettings {
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  provider: 'sendgrid' | 'ethereal' | 'ses' | 'resend';
}

export interface EtherealTestAccount {
  user: string;
  pass: string;
}

// SendGrid webhook event interfaces
export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event:
    | 'delivered'
    | 'bounce'
    | 'dropped'
    | 'open'
    | 'click'
    | 'processed'
    | 'deferred'
    | 'spam_report'
    | 'unsubscribe'
    | 'group_unsubscribe'
    | 'group_resubscribe';
  sg_event_id: string;
  sg_message_id: string;
  'smtp-id'?: string;
  reason?: string;
  status?: string;
  response?: string;
  url?: string;
  useragent?: string;
  ip?: string;
  category?: string[];
  unique_args?: Record<string, string>;
  marketing_campaign_id?: string;
  marketing_campaign_name?: string;
}

export interface ResendWebhookEvent {
  type: string;
  object?: string;
  data?: {
    event?: string;
    created_at?: string;
    timestamp?: number;
    reason?: string;
    smtp_response?: string;
    tags?: Array<Record<string, unknown>>;
    email?: {
      id?: string;
      to?: string[];
      from?: string;
      subject?: string;
      cc?: string[];
      bcc?: string[];
      reply_to?: string[] | string;
      headers?: Record<string, unknown>;
    };
  };
}

export interface WebhookProcessingResult {
  processed: number;
  errors: string[];
}

export interface RecipientUpdateData {
  status: string;
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  bounce_reason?: string;
  error_message?: string;
}
