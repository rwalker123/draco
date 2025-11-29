/**
 * Email composition type definitions
 */

import type {
  RecipientSelectionState,
  RecipientSelectionTab,
  ContactGroup,
  GroupType,
  WorkoutRecipientSelection,
  TeamsWantedRecipientSelection,
} from './recipients';
import type { EmailAttachment } from './attachments';
import type { EmailTemplate, EmailComposeRequest } from './email';
import type { RichTextEditorHandle } from '../../components/email/RichTextEditor';

/**
 * Email compose state - central state for entire composition
 */
export interface EmailComposeState {
  // Core content
  subject: string;
  content: string;
  isContentHtml: boolean;

  // Recipients (unified group-based system)
  recipientState?: RecipientSelectionState;

  // Attachments
  attachments: EmailAttachment[];

  // Template
  selectedTemplate?: EmailTemplate;

  // Scheduling
  isScheduled: boolean;
  scheduledDate?: Date;

  // Draft management
  isDraft: boolean;
  draftId?: string;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;

  // UI state
  isLoading: boolean;
  isSending: boolean;
  sendProgress?: number;
  errors: ComposeValidationError[];
  resetCounter: number; // Used to force component remounts on reset

  // Configuration
  config: EmailComposeConfig;
}

/**
 * Email compose actions
 */
export interface EmailComposeActions {
  // Content actions
  setSubject: (subject: string) => void;
  setContent: (content: string) => void;

  // Template actions
  selectTemplate: (template: EmailTemplate | undefined) => void;
  clearTemplate: () => void;

  // Attachment actions
  addAttachments: (attachments: EmailAttachment[]) => void;
  updateAttachments: (attachments: EmailAttachment[]) => void;
  removeAttachment: (attachmentId: string) => void;
  clearAttachments: () => void;

  // Scheduling actions
  setScheduled: (scheduled: boolean, date?: Date) => void;
  clearSchedule: () => void;

  // Draft actions
  saveDraft: () => Promise<boolean>;
  loadDraft: (draftId: string) => Promise<boolean>;
  clearDraft: () => void;

  // Send actions
  validateCompose: () => ComposeValidationResult;
  sendEmail: () => Promise<boolean>;

  // Recipient actions (unified group-based system)
  updateRecipientState: (state: RecipientSelectionState) => void;
  updateSelectedGroups: (
    groups: Map<GroupType, ContactGroup[]>,
    workoutRecipients?: WorkoutRecipientSelection[],
    teamsWantedRecipients?: TeamsWantedRecipientSelection[],
  ) => void;
  clearAllRecipients: () => void;
  removeSpecificGroup: (groupType: GroupType, groupIndex: number) => void;
  setRecipientSearchQuery: (query: string) => void;
  setRecipientActiveTab: (tab: RecipientSelectionTab) => void;

  // Utility actions
  reset: () => void;
  setError: (error: ComposeValidationError) => void;
  clearErrors: () => void;
}

/**
 * Email compose configuration
 */
export interface EmailComposeConfig {
  // Draft settings
  autoSaveDrafts: boolean;
  autoSaveInterval: number; // milliseconds

  // Validation settings
  requireSubject: boolean;
  requireRecipients: boolean;
  requireContent: boolean;

  // UI settings
  showTemplates: boolean;
  showScheduling: boolean;
  showAttachments: boolean;

  // Feature flags
  enableKeyboardShortcuts: boolean;
  enableRealTimeValidation: boolean;

  // Limits
  maxAttachments: number;
  maxAttachmentSize: number;
  maxRecipients: number;
}

/**
 * Email compose validation
 */
export interface ComposeValidationError {
  field: 'subject' | 'content' | 'recipients' | 'attachments' | 'schedule' | 'template' | 'general';
  message: string;
  severity: 'error' | 'warning';
}

export interface ComposeValidationResult {
  isValid: boolean;
  errors: ComposeValidationError[];
  warnings: ComposeValidationError[];
}

/**
 * Email compose context value
 */
export interface EmailComposeContextValue {
  state: EmailComposeState;
  actions: EmailComposeActions;
}

/**
 * Email compose provider props
 */
export interface EmailComposeProviderProps {
  children: React.ReactNode;
  accountId: string;
  seasonId?: string;
  initialData?: Partial<EmailComposeRequest>;
  config?: Partial<EmailComposeConfig>;
  onSendComplete?: (emailId: string) => void;
  onDraftSaved?: (draftId: string) => void;
  onError?: (error: Error) => void;
  editorRef?: React.RefObject<RichTextEditorHandle | null>;
}

/**
 * Template variable context for template processing
 */
export interface TemplateVariableContext {
  // User variables
  user?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
  };

  // Account variables
  account?: {
    name?: string;
    type?: string;
  };

  // Date variables
  date?: {
    today?: string;
    currentYear?: string;
    currentMonth?: string;
  };

  // Custom variables (user-defined)
  custom?: Record<string, string>;
}

/**
 * Send options for email composition
 */
export interface EmailSendOptions {
  scheduledSend?: Date;
  testMode?: boolean;
  saveAsDraft?: boolean;
  sendCopy?: boolean;
}

/**
 * Compose mode types
 */
export type ComposeMode = 'create' | 'reply' | 'forward' | 'template' | 'draft';

/**
 * Compose step for multi-step composition
 */
export type ComposeStep = 'recipients' | 'content' | 'attachments' | 'review' | 'send';

/**
 * Compose keyboard shortcuts
 */
export interface ComposeKeyboardShortcuts {
  save: string; // 'Ctrl+S' or 'Cmd+S'
  send: string; // 'Ctrl+Enter' or 'Cmd+Enter'
  bold: string; // 'Ctrl+B' or 'Cmd+B'
  italic: string; // 'Ctrl+I' or 'Cmd+I'
  undo: string; // 'Ctrl+Z' or 'Cmd+Z'
  redo: string; // 'Ctrl+Y' or 'Cmd+Shift+Z'
}

/**
 * Default compose configuration
 */
export const DEFAULT_COMPOSE_CONFIG: EmailComposeConfig = {
  autoSaveDrafts: true,
  autoSaveInterval: 30000, // 30 seconds
  requireSubject: true,
  requireRecipients: true,
  requireContent: true,
  showTemplates: true,
  showScheduling: true,
  showAttachments: true,
  enableKeyboardShortcuts: true,
  enableRealTimeValidation: true,
  maxAttachments: 10,
  maxAttachmentSize: 25 * 1024 * 1024, // 25MB
  maxRecipients: 500,
};

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: ComposeKeyboardShortcuts = {
  save: 'Ctrl+S',
  send: 'Ctrl+Enter',
  bold: 'Ctrl+B',
  italic: 'Ctrl+I',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
};

/**
 * Template variable extraction utility
 */
export function extractTemplateVariables(template: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

/**
 * Process template with variables
 */
export function processTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    processed = processed.replace(regex, value || '');
  });

  return processed;
}

/**
 * Validate email compose data
 */
export function validateComposeData(
  state: EmailComposeState,
  config: EmailComposeConfig,
): ComposeValidationResult {
  const errors: ComposeValidationError[] = [];
  const warnings: ComposeValidationError[] = [];

  // Subject validation
  if (config.requireSubject && !state.subject.trim()) {
    errors.push({
      field: 'subject',
      message: 'Subject is required',
      severity: 'error',
    });
  }

  // Recipients validation
  if (
    config.requireRecipients &&
    (!state.recipientState || state.recipientState.totalRecipients === 0)
  ) {
    errors.push({
      field: 'recipients',
      message: 'At least one recipient is required',
      severity: 'error',
    });
  }

  // Recipient limit validation
  if (state.recipientState && state.recipientState.totalRecipients > config.maxRecipients) {
    errors.push({
      field: 'recipients',
      message: `Too many recipients. Maximum ${config.maxRecipients} allowed.`,
      severity: 'error',
    });
  }

  // Attachment validation
  if (state.attachments.length > config.maxAttachments) {
    errors.push({
      field: 'attachments',
      message: `Too many attachments. Maximum ${config.maxAttachments} allowed.`,
      severity: 'error',
    });
  }

  // Attachment size validation
  const totalSize = state.attachments.reduce((sum, att) => sum + att.size, 0);
  if (totalSize > config.maxAttachmentSize * config.maxAttachments) {
    errors.push({
      field: 'attachments',
      message: 'Total attachment size exceeds limit',
      severity: 'error',
    });
  }

  // Schedule validation
  if (state.isScheduled && state.scheduledDate) {
    if (state.scheduledDate <= new Date()) {
      errors.push({
        field: 'schedule',
        message: 'Scheduled date must be in the future',
        severity: 'error',
      });
    }
  }

  // Template validation
  if (state.selectedTemplate) {
    const requiredVars = extractTemplateVariables(
      state.selectedTemplate.subjectTemplate + state.selectedTemplate.bodyTemplate,
    );

    // Template variables will be replaced with actual data when sent

    if (requiredVars.length > 0) {
      warnings.push({
        field: 'template',
        message: `Template contains variables: ${requiredVars.join(', ')}. These will be replaced with actual data when emails are sent.`,
        severity: 'warning',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
