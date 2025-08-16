'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo,
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
  processTemplate,
} from '../../../types/emails/compose';
import { EmailTemplate, EmailComposeRequest } from '../../../types/emails/email';
import { EmailAttachment } from '../../../types/emails/attachments';
import {
  RecipientSelectionState,
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionTab,
} from '../../../types/emails/recipients';
import { createEmailService } from '../../../services/emailService';
import { useAuth } from '../../../context/AuthContext';
import { safeAsync, logError } from '../../../utils/errorHandling';

// Action types for state management
type ComposeAction =
  | { type: 'SET_SUBJECT'; payload: string }
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SELECT_TEMPLATE'; payload: EmailTemplate | undefined }
  | { type: 'UPDATE_TEMPLATE_VARIABLE'; payload: { key: string; value: string } }
  | { type: 'CLEAR_TEMPLATE' }
  | { type: 'ADD_ATTACHMENTS'; payload: EmailAttachment[] }
  | { type: 'UPDATE_ATTACHMENTS'; payload: EmailAttachment[] }
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
  | { type: 'UPDATE_RECIPIENT_STATE'; payload: RecipientSelectionState }
  | { type: 'UPDATE_SELECTED_CONTACT_DETAILS'; payload: RecipientContact[] }
  | {
      type: 'SET_CONTACT_DATA';
      payload: { contacts: RecipientContact[]; teamGroups: TeamGroup[]; roleGroups: RoleGroup[] };
    }
  | { type: 'SELECT_CONTACT'; payload: string }
  | { type: 'DESELECT_CONTACT'; payload: string }
  | { type: 'TOGGLE_CONTACT'; payload: string }
  | { type: 'SELECT_CONTACT_RANGE'; payload: { fromId: string; toId: string } }
  | { type: 'SELECT_ALL_CONTACTS' }
  | { type: 'DESELECT_ALL_CONTACTS' }
  | { type: 'SELECT_TEAM_GROUP'; payload: TeamGroup }
  | { type: 'DESELECT_TEAM_GROUP'; payload: string }
  | { type: 'SELECT_ROLE_GROUP'; payload: RoleGroup }
  | { type: 'DESELECT_ROLE_GROUP'; payload: string }
  | { type: 'CLEAR_ALL_RECIPIENTS' }
  | { type: 'SET_RECIPIENT_SEARCH_QUERY'; payload: string }
  | { type: 'SET_RECIPIENT_ACTIVE_TAB'; payload: RecipientSelectionTab };

// Initial state
const createInitialState = (
  config: EmailComposeConfig,
  contacts: RecipientContact[] = [],
  teamGroups: TeamGroup[] = [],
  roleGroups: RoleGroup[] = [],
  initialData?: Partial<EmailComposeRequest>,
): EmailComposeState => ({
  subject: initialData?.subject || '',
  content: initialData?.body || '',
  isContentHtml: true,
  recipientState: undefined,
  contacts,
  teamGroups,
  roleGroups,
  selectedContactDetails: [],
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

// Helper functions for recipient state management
const createDefaultRecipientState = (): RecipientSelectionState => ({
  selectedContactIds: new Set<string>(),
  allContacts: false,
  selectedTeamGroups: [],
  selectedRoleGroups: [],
  totalRecipients: 0,
  validEmailCount: 0,
  invalidEmailCount: 0,
  searchQuery: '',
  activeTab: 'contacts' as RecipientSelectionTab,
});

const getRecipientState = (state: EmailComposeState): RecipientSelectionState =>
  state.recipientState || createDefaultRecipientState();

const calculateRecipientCounts = (
  selectedContactIds: Set<string>,
  state: EmailComposeState,
): { totalRecipients: number; validEmailCount: number; invalidEmailCount: number } => {
  const totalRecipients = selectedContactIds.size;

  // For email validation, use both state.contacts and selectedContactDetails
  const availableContactsForValidation = [
    ...state.contacts,
    ...state.selectedContactDetails.filter((c) => !state.contacts.some((sc) => sc.id === c.id)),
  ];
  const selectedContacts = availableContactsForValidation.filter((c) =>
    selectedContactIds.has(c.id),
  );
  const validEmailCount = selectedContacts.filter((c) => c.hasValidEmail).length;

  return {
    totalRecipients,
    validEmailCount,
    invalidEmailCount: totalRecipients - validEmailCount,
  };
};

const getAvailableContactsForSelection = (state: EmailComposeState): RecipientContact[] => [
  ...state.contacts,
  ...state.selectedContactDetails.filter((c) => !state.contacts.some((sc) => sc.id === c.id)),
];

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

    case 'UPDATE_ATTACHMENTS':
      return {
        ...state,
        attachments: action.payload,
        hasUnsavedChanges: true,
      };

    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        attachments: state.attachments.filter((att) => att.id !== action.payload),
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
        errors: [...state.errors.filter((e) => e.field !== action.payload.field), action.payload],
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

    case 'UPDATE_SELECTED_CONTACT_DETAILS':
      return {
        ...state,
        selectedContactDetails: action.payload,
        hasUnsavedChanges: true,
      };

    case 'SET_CONTACT_DATA':
      return {
        ...state,
        contacts: action.payload.contacts,
        teamGroups: action.payload.teamGroups,
        roleGroups: action.payload.roleGroups,
      };

    case 'SELECT_CONTACT': {
      const recipientState = getRecipientState(state);

      // Check if contact has valid email before allowing selection
      const availableContacts = getAvailableContactsForSelection(state);
      const contactToSelect = availableContacts.find((c) => c.id === action.payload);
      if (!contactToSelect || !contactToSelect.hasValidEmail) {
        return state; // Don't select contacts without valid email
      }

      const newSelectedContactIds = new Set(recipientState.selectedContactIds);
      newSelectedContactIds.add(action.payload);

      const counts = calculateRecipientCounts(newSelectedContactIds, state);

      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedContactIds: newSelectedContactIds,
          ...counts,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'DESELECT_CONTACT': {
      if (!state.recipientState) return state;

      const newSelectedContactIds = new Set(state.recipientState.selectedContactIds);
      newSelectedContactIds.delete(action.payload);

      // Also remove from selectedContactDetails if present
      const newSelectedContactDetails = state.selectedContactDetails.filter(
        (c) => c.id !== action.payload,
      );

      // Calculate counts from the selectedContactDetails array (which has the full set)
      // or fall back to counting selected IDs
      const totalRecipients = newSelectedContactIds.size;
      const validEmailCount = newSelectedContactDetails.filter((c) => c.hasValidEmail).length;

      return {
        ...state,
        selectedContactDetails: newSelectedContactDetails,
        recipientState: {
          ...state.recipientState,
          selectedContactIds: newSelectedContactIds,
          totalRecipients,
          validEmailCount,
          invalidEmailCount: totalRecipients - validEmailCount,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'TOGGLE_CONTACT': {
      const recipientState = getRecipientState(state);
      const newSelectedContactIds = new Set(recipientState.selectedContactIds);

      if (newSelectedContactIds.has(action.payload)) {
        // Always allow deselection
        newSelectedContactIds.delete(action.payload);
      } else {
        // Check if contact has valid email before allowing selection
        const availableContacts = getAvailableContactsForSelection(state);
        const contactToSelect = availableContacts.find((c) => c.id === action.payload);
        if (!contactToSelect || !contactToSelect.hasValidEmail) {
          return state; // Don't select contacts without valid email
        }
        newSelectedContactIds.add(action.payload);
      }

      const counts = calculateRecipientCounts(newSelectedContactIds, state);

      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedContactIds: newSelectedContactIds,
          ...counts,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'SELECT_CONTACT_RANGE': {
      const recipientState = getRecipientState(state);

      const fromIndex = state.contacts.findIndex((c) => c.id === action.payload.fromId);
      const toIndex = state.contacts.findIndex((c) => c.id === action.payload.toId);

      if (fromIndex === -1 || toIndex === -1) return state;

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);
      const rangeIds = state.contacts.slice(startIndex, endIndex + 1).map((c) => c.id);

      const newSelectedContactIds = new Set([...recipientState.selectedContactIds, ...rangeIds]);
      const counts = calculateRecipientCounts(newSelectedContactIds, state);

      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedContactIds: newSelectedContactIds,
          ...counts,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'SELECT_TEAM_GROUP': {
      const recipientState = getRecipientState(state);

      const newSelectedTeamGroups = [...recipientState.selectedTeamGroups];
      if (!newSelectedTeamGroups.find((t) => t.id === action.payload.id)) {
        newSelectedTeamGroups.push(action.payload);
      }

      // TODO: Calculate effective recipients including team group members
      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedTeamGroups: newSelectedTeamGroups,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'DESELECT_TEAM_GROUP': {
      if (!state.recipientState) return state;

      const newSelectedTeamGroups = state.recipientState.selectedTeamGroups.filter(
        (t) => t.id !== action.payload,
      );

      return {
        ...state,
        recipientState: {
          ...state.recipientState,
          selectedTeamGroups: newSelectedTeamGroups,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'SELECT_ROLE_GROUP': {
      const recipientState = getRecipientState(state);

      const newSelectedRoleGroups = [...recipientState.selectedRoleGroups];
      if (!newSelectedRoleGroups.find((r) => r.roleId === action.payload.roleId)) {
        newSelectedRoleGroups.push(action.payload);
      }

      // TODO: Calculate effective recipients including role group members
      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedRoleGroups: newSelectedRoleGroups,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'DESELECT_ROLE_GROUP': {
      if (!state.recipientState) return state;

      const newSelectedRoleGroups = state.recipientState.selectedRoleGroups.filter(
        (r) => r.roleId !== action.payload,
      );

      return {
        ...state,
        recipientState: {
          ...state.recipientState,
          selectedRoleGroups: newSelectedRoleGroups,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'SELECT_ALL_CONTACTS': {
      const recipientState = getRecipientState(state);

      const validEmailCount = state.contacts.filter((c) => c.hasValidEmail).length;

      return {
        ...state,
        recipientState: {
          ...recipientState,
          allContacts: true,
          selectedContactIds: new Set<string>(),
          selectedTeamGroups: [],
          selectedRoleGroups: [],
          totalRecipients: state.contacts.length,
          validEmailCount,
          invalidEmailCount: state.contacts.length - validEmailCount,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'DESELECT_ALL_CONTACTS': {
      if (!state.recipientState) return state;

      return {
        ...state,
        recipientState: {
          ...state.recipientState,
          allContacts: false,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'CLEAR_ALL_RECIPIENTS': {
      return {
        ...state,
        selectedContactDetails: [],
        recipientState: createDefaultRecipientState(),
        hasUnsavedChanges: true,
      };
    }

    case 'SET_RECIPIENT_SEARCH_QUERY': {
      const recipientState = getRecipientState(state);

      return {
        ...state,
        recipientState: {
          ...recipientState,
          searchQuery: action.payload,
        },
      };
    }

    case 'SET_RECIPIENT_ACTIVE_TAB': {
      const recipientState = getRecipientState(state);

      return {
        ...state,
        recipientState: {
          ...recipientState,
          activeTab: action.payload,
        },
      };
    }

    case 'RESET':
      return createInitialState(state.config, state.contacts, state.teamGroups, state.roleGroups);

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
  contacts,
  teamGroups = [],
  roleGroups = [],
  initialData,
  config: userConfig = {},
  onSendComplete,
  onDraftSaved,
  onError,
}) => {
  const { token } = useAuth();
  const config = useMemo(() => ({ ...DEFAULT_COMPOSE_CONFIG, ...userConfig }), [userConfig]);
  const [state, dispatch] = useReducer(
    composeReducer,
    createInitialState(config, contacts, teamGroups, roleGroups, initialData),
  );

  // Refs for intervals and service
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emailServiceRef = useRef(token ? createEmailService(token) : null);

  // Update email service when token changes
  useEffect(() => {
    if (token) {
      emailServiceRef.current = createEmailService(token);
    }
  }, [token]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!emailServiceRef.current || !token) return false;

    dispatch({ type: 'SET_LOADING', payload: true });

    const result = await safeAsync(
      async () => {
        // Create draft request (will be used for API call when draft saving is implemented)
        const draftRequest: EmailComposeRequest = {
          recipients: {
            contactIds: state.recipientState?.selectedContactIds
              ? Array.from(state.recipientState.selectedContactIds)
              : [],
            groups: {
              allContacts: state.recipientState?.allContacts,
              teamPlayers: state.recipientState?.selectedTeamGroups.map((g) => g.id),
              roles: state.recipientState?.selectedRoleGroups.map((r) => r.roleId),
            },
          },
          subject: state.selectedTemplate
            ? processTemplate(state.subject, state.templateVariables)
            : state.subject,
          body: state.selectedTemplate
            ? processTemplate(state.content, state.templateVariables)
            : state.content,
          templateId: state.selectedTemplate?.id,
          attachments: state.attachments.filter((a) => a.status === 'uploaded').map((a) => a.url!),
          scheduledSend: state.isScheduled ? state.scheduledDate : undefined,
        };

        // TODO: Implement draft saving in EmailService
        // const draftId = await emailServiceRef.current.saveDraft(accountId, draftRequest);
        const draftId = `draft_${Date.now()}`; // Temporary mock
        void draftRequest; // Suppress unused variable warning until API is implemented

        return { draftId };
      },
      {
        accountId,
        operation: 'save_draft',
      },
    );

    dispatch({ type: 'SET_LOADING', payload: false });

    if (result.success) {
      dispatch({
        type: 'SET_DRAFT_DATA',
        payload: {
          isDraft: true,
          draftId: result.data.draftId,
          lastSaved: new Date(),
        },
      });

      if (onDraftSaved) {
        onDraftSaved(result.data.draftId);
      }

      return true;
    } else {
      logError(result.error, 'saveDraft');
      dispatch({
        type: 'ADD_ERROR',
        payload: {
          field: 'general',
          message: result.error.userMessage,
          severity: 'error',
        },
      });

      if (onError) {
        onError(new Error(result.error.message));
      }

      return false;
    }
  }, [state, accountId, token, onDraftSaved, onError]);

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
  }, [
    state.hasUnsavedChanges,
    state.isSending,
    config.autoSaveDrafts,
    config.autoSaveInterval,
    saveDraft,
  ]);

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

  const updateAttachments = useCallback((attachments: EmailAttachment[]) => {
    dispatch({ type: 'UPDATE_ATTACHMENTS', payload: attachments });
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

  const loadDraft = useCallback(
    async (draftId: string): Promise<boolean> => {
      if (!emailServiceRef.current || !token) return false;

      dispatch({ type: 'SET_LOADING', payload: true });

      const result = await safeAsync(
        async () => {
          // TODO: Implement draft loading in EmailService
          // const draft = await emailServiceRef.current.loadDraft(accountId, draftId);

          // For now, just mark as draft loaded
          return { draftId };
        },
        {
          accountId,
          operation: 'load_draft',
          additionalData: { draftId },
        },
      );

      dispatch({ type: 'SET_LOADING', payload: false });

      if (result.success) {
        dispatch({
          type: 'SET_DRAFT_DATA',
          payload: {
            isDraft: true,
            draftId: result.data.draftId,
            lastSaved: new Date(),
          },
        });

        return true;
      } else {
        logError(result.error, 'loadDraft');
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            field: 'general',
            message: result.error.userMessage,
            severity: 'error',
          },
        });

        if (onError) {
          onError(new Error(result.error.message));
        }

        return false;
      }
    },
    [accountId, token, onError],
  );

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

    // Validate before sending
    const validation = validateCompose();
    if (!validation.isValid) {
      return false;
    }

    dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 0 } });
    dispatch({ type: 'CLEAR_ERRORS' });

    const result = await safeAsync(
      async () => {
        // Prepare email request
        const emailRequest: EmailComposeRequest = {
          recipients: {
            contactIds: state.recipientState?.selectedContactIds
              ? Array.from(state.recipientState.selectedContactIds)
              : [],
            groups: {
              allContacts: state.recipientState?.allContacts,
              teamPlayers: state.recipientState?.selectedTeamGroups.map((g) => g.id),
              roles: state.recipientState?.selectedRoleGroups.map((r) => r.roleId),
            },
          },
          subject: state.selectedTemplate
            ? processTemplate(state.subject, state.templateVariables)
            : state.subject,
          body: state.selectedTemplate
            ? processTemplate(state.content, state.templateVariables)
            : state.content,
          templateId: state.selectedTemplate?.id,
          attachments: state.attachments.filter((a) => a.status === 'uploaded').map((a) => a.url!),
          scheduledSend: state.isScheduled ? state.scheduledDate : undefined,
        };

        // Send email with progress updates
        dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 50 } });
        const emailId = await emailServiceRef.current!.composeEmail(accountId, emailRequest);
        dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 100 } });

        return { emailId };
      },
      {
        accountId,
        operation: 'send_email',
        additionalData: {
          recipientCount: state.recipientState?.totalRecipients || 0,
          hasScheduledSend: state.isScheduled,
          templateId: state.selectedTemplate?.id,
        },
      },
    );

    if (result.success) {
      // Clear draft if it exists
      if (state.isDraft) {
        clearDraft();
      }

      // Reset state
      dispatch({ type: 'RESET' });

      if (onSendComplete) {
        onSendComplete(result.data.emailId);
      }

      dispatch({ type: 'SET_SENDING', payload: { isSending: false, progress: undefined } });
      return true;
    } else {
      logError(result.error, 'sendEmail');
      dispatch({
        type: 'ADD_ERROR',
        payload: {
          field: 'general',
          message: result.error.userMessage,
          severity: 'error',
        },
      });

      if (onError) {
        onError(new Error(result.error.message));
      }

      dispatch({ type: 'SET_SENDING', payload: { isSending: false, progress: undefined } });
      return false;
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

  const updateRecipientState = useCallback((recipientState: RecipientSelectionState) => {
    dispatch({ type: 'UPDATE_RECIPIENT_STATE', payload: recipientState });
  }, []);

  const updateSelectedContactDetails = useCallback((contacts: RecipientContact[]) => {
    dispatch({ type: 'UPDATE_SELECTED_CONTACT_DETAILS', payload: contacts });
  }, []);

  // Individual recipient actions
  const selectContact = useCallback((contactId: string) => {
    dispatch({ type: 'SELECT_CONTACT', payload: contactId });
  }, []);

  const deselectContact = useCallback((contactId: string) => {
    dispatch({ type: 'DESELECT_CONTACT', payload: contactId });
  }, []);

  const toggleContact = useCallback((contactId: string) => {
    dispatch({ type: 'TOGGLE_CONTACT', payload: contactId });
  }, []);

  const selectContactRange = useCallback((fromId: string, toId: string) => {
    dispatch({ type: 'SELECT_CONTACT_RANGE', payload: { fromId, toId } });
  }, []);

  const selectAllContacts = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_CONTACTS' });
  }, []);

  const deselectAllContacts = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL_CONTACTS' });
  }, []);

  const selectTeamGroup = useCallback((group: TeamGroup) => {
    dispatch({ type: 'SELECT_TEAM_GROUP', payload: group });
  }, []);

  const deselectTeamGroup = useCallback((teamId: string) => {
    dispatch({ type: 'DESELECT_TEAM_GROUP', payload: teamId });
  }, []);

  const selectRoleGroup = useCallback((group: RoleGroup) => {
    dispatch({ type: 'SELECT_ROLE_GROUP', payload: group });
  }, []);

  const deselectRoleGroup = useCallback((roleId: string) => {
    dispatch({ type: 'DESELECT_ROLE_GROUP', payload: roleId });
  }, []);

  const clearAllRecipients = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_RECIPIENTS' });
  }, []);

  const isContactSelected = useCallback(
    (contactId: string): boolean => {
      if (!state.recipientState) return false;

      if (state.recipientState.allContacts) return true;

      return state.recipientState.selectedContactIds.has(contactId);
    },
    [state.recipientState],
  );

  const getSelectedContacts = useCallback((): RecipientContact[] => {
    if (!state.recipientState) return [];

    if (state.recipientState.allContacts) {
      return state.contacts;
    }

    return state.contacts.filter((contact) =>
      state.recipientState!.selectedContactIds.has(contact.id),
    );
  }, [state.recipientState, state.contacts]);

  const getEffectiveRecipients = useCallback((): RecipientContact[] => {
    const contacts = getSelectedContacts();
    // TODO: Add team group members and role group members
    return contacts;
  }, [getSelectedContacts]);

  const setRecipientSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_RECIPIENT_SEARCH_QUERY', payload: query });
  }, []);

  const setRecipientActiveTab = useCallback((tab: RecipientSelectionTab) => {
    dispatch({ type: 'SET_RECIPIENT_ACTIVE_TAB', payload: tab });
  }, []);

  // Update contact data when props change
  useEffect(() => {
    dispatch({
      type: 'SET_CONTACT_DATA',
      payload: { contacts, teamGroups, roleGroups },
    });
  }, [contacts, teamGroups, roleGroups]);

  // Create actions object
  const actions: EmailComposeActions = {
    setSubject,
    setContent,
    selectTemplate,
    updateTemplateVariable,
    clearTemplate,
    addAttachments,
    updateAttachments,
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
    updateRecipientState,
    updateSelectedContactDetails,
    selectContact,
    deselectContact,
    toggleContact,
    selectContactRange,
    selectAllContacts,
    deselectAllContacts,
    selectTeamGroup,
    deselectTeamGroup,
    selectRoleGroup,
    deselectRoleGroup,
    clearAllRecipients,
    isContactSelected,
    getSelectedContacts,
    getEffectiveRecipients,
    setRecipientSearchQuery,
    setRecipientActiveTab,
  };

  // Context value
  const contextValue: EmailComposeContextValue = {
    state,
    actions,
  };

  return (
    <EmailComposeContext.Provider value={contextValue}>{children}</EmailComposeContext.Provider>
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
