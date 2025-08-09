// Email types for frontend
export interface EmailRecipientSelection {
  contactIds: string[];
  groups: {
    allContacts?: boolean;
    teamManagers?: string[];
    teamPlayers?: string[];
    roles?: string[];
  };
}

export interface EmailComposeRequest {
  recipients: EmailRecipientSelection;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: string[];
  scheduledSend?: Date;
}

export interface Contact {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  isActive: boolean;
}

export type EmailMode = 'mailto' | 'advanced';

export interface EmailAction {
  mode: EmailMode;
  recipients: Contact[];
  subject?: string;
  body?: string;
}
