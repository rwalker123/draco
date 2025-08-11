'use client';

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useEffect, 
  useRef,
  useMemo 
} from 'react';
import { 
  EmailComposeState,
  EmailComposeActions,
  EmailComposeContextValue,
  EmailComposeProviderProps,
  EmailComposeConfig,
  ComposeValidationError,
  ComposeValidationResult,
  DEFAULT_COMPOSE_CONFIG,
  validateComposeData,
  processTemplate
} from '../../../types/emails/compose';
import { EmailTemplate, EmailComposeRequest } from '../../../types/emails/email';
import { EmailAttachment } from '../../../types/emails/attachments';
import { RecipientSelectionState } from '../../../types/emails/recipients';
import { createEmailService } from '../../../services/emailService';
import { useAuth } from '../../../context/AuthContext';

// Action types for state management
type ComposeAction =
  | { type: 'SET_SUBJECT'; payload: string }
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SELECT_TEMPLATE'; payload: EmailTemplate | undefined }
  | { type: 'UPDATE_TEMPLATE_VARIABLE'; payload: { key: string; value: string } }
  | { type: 'CLEAR_TEMPLATE' }
  | { type: 'ADD_ATTACHMENTS'; payload: EmailAttachment[] }
  | { type: 'REMOVE_ATTACHMENT'; payload: string }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'SET_SCHEDULED'; payload: { scheduled: boolean; date?: Date } }
  | { type: 'CLEAR_SCHEDULE' }
  | { type: 'SET_DRAFT_DATA'; payload: { isDraft: boolean; draftId?: string; lastSaved?: Date } }
  | { type: 'CLEAR_DRAFT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SENDING'; payload: { isSending: boolean; progress?: number } }
  | { type: 'SET_ERRORS'; payload: ComposeValidationError[] }
  | { type: 'ADD_ERROR'; payload: ComposeValidationError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'RESET' }
  | { type: 'UPDATE_RECIPIENT_STATE'; payload: RecipientSelectionState };

// Initial state
const createInitialState = (
  config: EmailComposeConfig,
  initialData?: Partial<EmailComposeRequest>
): EmailComposeState => ({
  subject: initialData?.subject || '',
  content: initialData?.body || '',
  isContentHtml: true,
  recipientState: undefined,
  attachments: [],
  selectedTemplate: undefined,
  templateVariables: {},
  isScheduled: !!initialData?.scheduledSend,
  scheduledDate: initialData?.scheduledSend,
  isDraft: false,
  draftId: undefined,
  lastSaved: undefined,
  hasUnsavedChanges: false,
  isLoading: false,
  isSending: false,
  sendProgress: undefined,
  errors: [],
  config,
});

// Reducer function
function composeReducer(state: EmailComposeState, action: ComposeAction): EmailComposeState {
  switch (action.type) {
    case 'SET_SUBJECT':
      return {
        ...state,
        subject: action.payload,
        hasUnsavedChanges: true,
      };

    case 'SET_CONTENT':
      return {
        ...state,
        content: action.payload,
        hasUnsavedChanges: true,
      };

    case 'SELECT_TEMPLATE':
      if (!action.payload) {
        return {
          ...state,
          selectedTemplate: undefined,
          templateVariables: {},
          hasUnsavedChanges: true,
        };
      }

      return {
        ...state,
        selectedTemplate: action.payload,
        subject: action.payload.subjectTemplate || state.subject,
        content: action.payload.bodyTemplate || state.content,
        hasUnsavedChanges: true,
      };

    case 'UPDATE_TEMPLATE_VARIABLE':
      return {
        ...state,
        templateVariables: {
          ...state.templateVariables,
          [action.payload.key]: action.payload.value,
        },
        hasUnsavedChanges: true,
      };

    case 'CLEAR_TEMPLATE':
      return {
        ...state,
        selectedTemplate: undefined,
        templateVariables: {},
        hasUnsavedChanges: true,
      };

    case 'ADD_ATTACHMENTS':
      return {
        ...state,
        attachments: [...state.attachments, ...action.payload],
        hasUnsavedChanges: true,
      };

    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        attachments: state.attachments.filter(att => att.id !== action.payload),
        hasUnsavedChanges: true,
      };

    case 'CLEAR_ATTACHMENTS':
      return {
        ...state,
        attachments: [],
        hasUnsavedChanges: true,
      };

    case 'SET_SCHEDULED':
      return {
        ...state,
        isScheduled: action.payload.scheduled,
        scheduledDate: action.payload.date,
        hasUnsavedChanges: true,
      };

    case 'CLEAR_SCHEDULE':
      return {
        ...state,
        isScheduled: false,
        scheduledDate: undefined,
        hasUnsavedChanges: true,
      };

    case 'SET_DRAFT_DATA':
      return {
        ...state,
        isDraft: action.payload.isDraft,
        draftId: action.payload.draftId,
        lastSaved: action.payload.lastSaved,
        hasUnsavedChanges: false,
      };

    case 'CLEAR_DRAFT':
      return {
        ...state,
        isDraft: false,
        draftId: undefined,
        lastSaved: undefined,
        hasUnsavedChanges: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_SENDING':
      return {
        ...state,
        isSending: action.payload.isSending,
        sendProgress: action.payload.progress,
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors.filter(e => e.field !== action.payload.field), action.payload],
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };

    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload,
      };

    case 'UPDATE_RECIPIENT_STATE':
      return {
        ...state,
        recipientState: action.payload,
        hasUnsavedChanges: true,
      };

    case 'RESET':
      return createInitialState(state.config);

    default:
      return state;
  }
}

// Context
const EmailComposeContext = createContext<EmailComposeContextValue | null>(null);

/**
 * EmailComposeProvider - Manages email composition state and actions
 */
export const EmailComposeProvider: React.FC<EmailComposeProviderProps> = ({
  children,
  accountId,
  initialData,
  config: userConfig = {},
  onSendComplete,
  onDraftSaved,
  onError,
}) => {
  const { token } = useAuth();
  const config = useMemo(() => ({ ...DEFAULT_COMPOSE_CONFIG, ...userConfig }), [userConfig]);
  const [state, dispatch] = useReducer(composeReducer, createInitialState(config, initialData));
  
  // Refs for intervals and service
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emailServiceRef = useRef(token ? createEmailService(token) : null);
  
  // Update email service when token changes
  useEffect(() => {
    if (token) {
      emailServiceRef.current = createEmailService(token);
    }
  }, [token]);

  // Auto-save drafts
  useEffect(() => {
    if (config.autoSaveDrafts && state.hasUnsavedChanges && !state.isSending) {
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
      
      autoSaveIntervalRef.current = setTimeout(() => {
        saveDraft();
      }, config.autoSaveInterval);
    }
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
    };
  }, [state.hasUnsavedChanges, state.isSending, config.autoSaveDrafts, config.autoSaveInterval, saveDraft]);

  // Actions
  const setSubject = useCallback((subject: string) => {
    dispatch({ type: 'SET_SUBJECT', payload: subject });
  }, []);

  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', payload: content });
  }, []);

  const selectTemplate = useCallback((template: EmailTemplate | undefined) => {
    dispatch({ type: 'SELECT_TEMPLATE', payload: template });
  }, []);

  const updateTemplateVariable = useCallback((key: string, value: string) => {
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLE', payload: { key, value } });
  }, []);

  const clearTemplate = useCallback(() => {
    dispatch({ type: 'CLEAR_TEMPLATE' });
  }, []);

  const addAttachments = useCallback((attachments: EmailAttachment[]) => {
    dispatch({ type: 'ADD_ATTACHMENTS', payload: attachments });
  }, []);

  const removeAttachment = useCallback((attachmentId: string) => {
    dispatch({ type: 'REMOVE_ATTACHMENT', payload: attachmentId });
  }, []);

  const clearAttachments = useCallback(() => {
    dispatch({ type: 'CLEAR_ATTACHMENTS' });
  }, []);

  const setScheduled = useCallback((scheduled: boolean, date?: Date) => {
    dispatch({ type: 'SET_SCHEDULED', payload: { scheduled, date } });
  }, []);

  const clearSchedule = useCallback(() => {
    dispatch({ type: 'CLEAR_SCHEDULE' });
  }, []);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!emailServiceRef.current || !token) return false;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Create draft request (will be used for API call when draft saving is implemented)
      const draftRequest: EmailComposeRequest = {
        recipients: {
          contactIds: state.recipientState?.selectedContactIds ? 
            Array.from(state.recipientState.selectedContactIds) : [],
          groups: {
            allContacts: state.recipientState?.allContacts,
            teamPlayers: state.recipientState?.selectedTeamGroups.map(g => g.id),
            roles: state.recipientState?.selectedRoleGroups.map(r => r.roleId),
          }
        },
        subject: state.selectedTemplate ? 
          processTemplate(state.subject, state.templateVariables) : state.subject,
        body: state.selectedTemplate ? 
          processTemplate(state.content, state.templateVariables) : state.content,
        templateId: state.selectedTemplate?.id,
        attachments: state.attachments.filter(a => a.status === 'uploaded').map(a => a.url!),
        scheduledSend: state.isScheduled ? state.scheduledDate : undefined,
      };

      // TODO: Implement draft saving in EmailService
      // const draftId = await emailServiceRef.current.saveDraft(accountId, draftRequest);
      const draftId = `draft_${Date.now()}`; // Temporary mock
      
      // Use draftRequest when API is implemented
      console.log('Draft request prepared:', draftRequest);

      dispatch({ 
        type: 'SET_DRAFT_DATA', 
        payload: { 
          isDraft: true, 
          draftId, 
          lastSaved: new Date() 
        } 
      });

      if (onDraftSaved) {
        onDraftSaved(draftId);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      dispatch({ 
        type: 'ADD_ERROR', 
        payload: { 
          field: 'general', 
          message: errorMessage, 
          severity: 'error' 
        } 
      });
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, token, onDraftSaved, onError]);

  const loadDraft = useCallback(async (draftId: string): Promise<boolean> => {
    if (!emailServiceRef.current || !token) return false;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Implement draft loading in EmailService
      // const draft = await emailServiceRef.current.loadDraft(accountId, draftId);
      
      // For now, just mark as draft loaded
      dispatch({ 
        type: 'SET_DRAFT_DATA', 
        payload: { 
          isDraft: true, 
          draftId, 
          lastSaved: new Date() 
        } 
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load draft';
      dispatch({ 
        type: 'ADD_ERROR', 
        payload: { 
          field: 'general', 
          message: errorMessage, 
          severity: 'error' 
        } 
      });
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [token, onError]);

  const clearDraft = useCallback(() => {
    dispatch({ type: 'CLEAR_DRAFT' });
  }, []);

  const validateCompose = useCallback((): ComposeValidationResult => {
    const result = validateComposeData(state, config);
    dispatch({ type: 'SET_ERRORS', payload: result.errors });
    return result;
  }, [state, config]);

  const sendEmail = useCallback(async (): Promise<boolean> => {
    if (!emailServiceRef.current || !token) return false;

    try {
      // Validate before sending
      const validation = validateCompose();
      if (!validation.isValid) {
        return false;
      }

      dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 0 } });
      dispatch({ type: 'CLEAR_ERRORS' });

      // Prepare email request
      const emailRequest: EmailComposeRequest = {
        recipients: {
          contactIds: state.recipientState?.selectedContactIds ? 
            Array.from(state.recipientState.selectedContactIds) : [],
          groups: {
            allContacts: state.recipientState?.allContacts,
            teamPlayers: state.recipientState?.selectedTeamGroups.map(g => g.id),
            roles: state.recipientState?.selectedRoleGroups.map(r => r.roleId),
          }
        },
        subject: state.selectedTemplate ? 
          processTemplate(state.subject, state.templateVariables) : state.subject,
        body: state.selectedTemplate ? 
          processTemplate(state.content, state.templateVariables) : state.content,
        templateId: state.selectedTemplate?.id,
        attachments: state.attachments.filter(a => a.status === 'uploaded').map(a => a.url!),
        scheduledSend: state.isScheduled ? state.scheduledDate : undefined,
      };

      // Send email
      dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 50 } });
      const emailId = await emailServiceRef.current.composeEmail(accountId, emailRequest);
      
      dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 100 } });
      
      // Clear draft if it exists
      if (state.isDraft) {
        clearDraft();
      }

      // Reset state
      dispatch({ type: 'RESET' });

      if (onSendComplete) {
        onSendComplete(emailId);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      dispatch({ 
        type: 'ADD_ERROR', 
        payload: { 
          field: 'general', 
          message: errorMessage, 
          severity: 'error' 
        } 
      });
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      return false;
    } finally {
      dispatch({ type: 'SET_SENDING', payload: { isSending: false, progress: undefined } });
    }
  }, [state, accountId, token, validateCompose, clearDraft, onSendComplete, onError]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const setError = useCallback((error: ComposeValidationError) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  // Create actions object
  const actions: EmailComposeActions = {
    setSubject,
    setContent,
    selectTemplate,
    updateTemplateVariable,
    clearTemplate,
    addAttachments,
    removeAttachment,
    clearAttachments,
    setScheduled,
    clearSchedule,
    saveDraft,
    loadDraft,
    clearDraft,
    validateCompose,
    sendEmail,
    reset,
    setError,
    clearErrors,
  };

  // Context value
  const contextValue: EmailComposeContextValue = {
    state,
    actions,
  };

  return (
    <EmailComposeContext.Provider value={contextValue}>
      {children}
    </EmailComposeContext.Provider>
  );
};

/**
 * Hook to use email compose context
 */
export function useEmailCompose(): EmailComposeContextValue {
  const context = useContext(EmailComposeContext);
  if (!context) {
    throw new Error('useEmailCompose must be used within an EmailComposeProvider');
  }
  return context;
}