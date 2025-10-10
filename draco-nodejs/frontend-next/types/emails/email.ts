// Email types for frontend
export interface EmailRecipientSelection {
  contactIds: string[];
  groups: Array<{
    type: 'season' | 'league' | 'division' | 'teams';
    ids: string[];
  }>;
  onlyManagers: boolean;
}

export interface EmailComposeRequest {
  recipients: EmailRecipientSelection;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: string[];
  scheduledSend?: Date;
  seasonId?: string;
}

export interface EmailTemplate {
  id: string;
  accountId: string;
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

export interface EmailRecord {
  id: string;
  accountId: string;
  createdByUserId?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateId?: string;
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
  recipients?: EmailRecipient[];
  attachments?: AttachmentDetails[];
}

export type EmailStatus = 'draft' | 'sending' | 'sent' | 'failed' | 'scheduled' | 'partial';

export interface EmailRecipient {
  id: string;
  emailId?: string;
  contactId?: string;
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

export interface EmailListResponse {
  emails: EmailRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AttachmentDetails {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string | null;
  uploadedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export type EmailMode = 'mailto' | 'advanced';
