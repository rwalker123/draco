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
  attachments?: EmailAttachment[];
}

// Email sending result
export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string; // For Ethereal Email preview
  error?: string;
}

// Email attachment
export interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
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

// Email composition request interfaces
export interface EmailComposeRequest {
  recipients: EmailRecipientSelection;
  subject: string;
  body: string;
  templateId?: bigint;
  attachments?: string[]; // File storage IDs
  scheduledSend?: Date;
}

export interface EmailRecipientSelection {
  contactIds: string[];
  groups: EmailRecipientGroups;
}

export interface EmailRecipientGroups {
  allContacts?: boolean;
  teamManagers?: string[]; // Team season IDs
  teamPlayers?: string[]; // Team season IDs
  roles?: string[]; // Role IDs
}

// Email template interfaces
export interface EmailTemplate {
  id: bigint;
  accountId: bigint;
  name: string;
  description?: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface EmailTemplateCreateRequest {
  name: string;
  description?: string;
  subjectTemplate?: string;
  bodyTemplate: string;
}

export interface EmailTemplateUpdateRequest {
  name?: string;
  description?: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
  isActive?: boolean;
}

// Email record interfaces
export interface EmailRecord {
  id: bigint;
  accountId: bigint;
  createdByUserId?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateId?: bigint;
  status: EmailStatus;
  scheduledSendAt?: Date;
  createdAt: Date;
  sentAt?: Date;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
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

export interface EmailListResponse {
  emails: EmailRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Email validation interface
export interface IEmailValidator {
  validateComposeRequest(request: EmailComposeRequest): ValidationResult;
  validateEmailAddress(email: string): boolean;
  validateRecipientSelection(selection: EmailRecipientSelection): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
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

export interface IRecipientResolver {
  resolveRecipients(
    accountId: bigint,
    selection: EmailRecipientSelection,
  ): Promise<ResolvedRecipient[]>;
}

// Database type interfaces for Prisma results
export interface EmailTemplateDbRecord {
  id: bigint;
  account_id: bigint;
  name: string;
  description: string | null;
  subject_template: string | null;
  body_template: string;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface EmailSettings {
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  provider: 'sendgrid' | 'ethereal';
}

export interface EmailQueryFilter {
  account_id: bigint;
  status?: string;
}

export interface EtherealTestAccount {
  user: string;
  pass: string;
}
