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
} from '../../../types/emails/compose';
import { EmailTemplate, EmailComposeRequest } from '../../../types/emails/email';
import { EmailAttachment } from '../../../types/emails/attachments';
import {
  RecipientSelectionState,
  RecipientSelectionTab,
  createDefaultRecipientSelectionState,
  ContactGroup,
  GroupType,
  getTotalRecipientsFromGroups,
  getTotalWorkoutRecipients,
  getTotalTeamsWantedRecipients,
  getTotalUmpireRecipients,
  WorkoutRecipientSelection,
  TeamsWantedRecipientSelection,
  UmpireRecipientSelection,
} from '../../../types/emails/recipients';
import { createEmailService } from '../../../services/emailService';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { safeAsync, logError } from '../../../utils/errorHandling';

// Action types for state management
type ComposeAction =
  | { type: 'SET_SUBJECT'; payload: string }
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SELECT_TEMPLATE'; payload: EmailTemplate | undefined }
  | { type: 'CLEAR_TEMPLATE' }
  | { type: 'ADD_ATTACHMENTS'; payload: EmailAttachment[] }
  | { type: 'UPDATE_ATTACHMENTS'; payload: EmailAttachment[] }
  | { type: 'REMOVE_ATTACHMENT'; payload: string }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'SET_SCHEDULED'; payload: { scheduled: boolean; date?: Date } }
  | { type: 'CLEAR_SCHEDULE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SENDING'; payload: { isSending: boolean; progress?: number } }
  | { type: 'SET_ERRORS'; payload: ComposeValidationError[] }
  | { type: 'ADD_ERROR'; payload: ComposeValidationError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'RESET' }
  | { type: 'UPDATE_RECIPIENT_STATE'; payload: RecipientSelectionState }
  | {
      type: 'UPDATE_SELECTED_GROUPS';
      payload: Map<GroupType, ContactGroup[]>;
      workoutRecipients?: WorkoutRecipientSelection[];
      teamsWantedRecipients?: TeamsWantedRecipientSelection[];
      umpireRecipients?: UmpireRecipientSelection[];
    }
  | { type: 'CLEAR_ALL_RECIPIENTS' }
  | { type: 'REMOVE_SPECIFIC_GROUP'; payload: { groupType: GroupType; groupIndex: number } }
  | { type: 'SET_RECIPIENT_SEARCH_QUERY'; payload: string }
  | { type: 'SET_RECIPIENT_ACTIVE_TAB'; payload: RecipientSelectionTab };

// Initial state
const createInitialState = (
  config: EmailComposeConfig,
  initialData?: Partial<EmailComposeRequest>,
): EmailComposeState => ({
  subject: initialData?.subject || '',
  content: initialData?.body || '',
  isContentHtml: true,
  recipientState: undefined,
  attachments: [],
  selectedTemplate: undefined,
  isScheduled: !!initialData?.scheduledSend,
  scheduledDate: initialData?.scheduledSend,
  hasUnsavedChanges: false,
  isLoading: false,
  isSending: false,
  sendProgress: undefined,
  errors: [],
  resetCounter: 0,
  config,
});

// Helper functions for recipient state management
const createDefaultRecipientState = (): RecipientSelectionState =>
  createDefaultRecipientSelectionState();

const getRecipientState = (state: EmailComposeState): RecipientSelectionState =>
  state.recipientState || createDefaultRecipientState();

// Helper function to extract group IDs from ContactGroup
const extractGroupIds = (group: ContactGroup): string[] => {
  return Array.from(group.ids);
};

const calculateTotalRecipients = (
  groups: Map<GroupType, ContactGroup[]>,
  workoutRecipients?: WorkoutRecipientSelection[],
  teamsWantedRecipients?: TeamsWantedRecipientSelection[],
  umpireRecipients?: UmpireRecipientSelection[],
): number => {
  return (
    getTotalRecipientsFromGroups(groups) +
    getTotalWorkoutRecipients(workoutRecipients) +
    getTotalTeamsWantedRecipients(teamsWantedRecipients) +
    getTotalUmpireRecipients(umpireRecipients)
  );
};

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

    case 'CLEAR_TEMPLATE':
      return {
        ...state,
        selectedTemplate: undefined,
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

    case 'UPDATE_SELECTED_GROUPS': {
      const recipientState = getRecipientState(state);

      const workoutRecipients =
        action.workoutRecipients ?? recipientState.selectedWorkoutRecipients;
      const teamsWantedRecipients =
        action.teamsWantedRecipients ?? recipientState.selectedTeamsWantedRecipients;
      const umpireRecipients = action.umpireRecipients ?? recipientState.selectedUmpireRecipients;

      // Calculate total recipients from unified groups
      const totalRecipients = calculateTotalRecipients(
        action.payload,
        workoutRecipients,
        teamsWantedRecipients,
        umpireRecipients,
      );

      // For now, assume all recipients are valid (this will be refined later)
      const validEmailCount = totalRecipients;

      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedGroups: action.payload,
          selectedWorkoutRecipients: workoutRecipients,
          selectedTeamsWantedRecipients: teamsWantedRecipients,
          selectedUmpireRecipients: umpireRecipients,
          totalRecipients,
          validEmailCount,
          invalidEmailCount: totalRecipients - validEmailCount,
        },
        hasUnsavedChanges: true,
      };
    }

    case 'CLEAR_ALL_RECIPIENTS': {
      return {
        ...state,
        recipientState: createDefaultRecipientState(),
        hasUnsavedChanges: true,
      };
    }

    case 'REMOVE_SPECIFIC_GROUP': {
      const recipientState = getRecipientState(state);
      const { groupType, groupIndex } = action.payload;

      if (!recipientState.selectedGroups) {
        return state;
      }

      // Create a new copy of the selectedGroups Map
      const newSelectedGroups = new Map(recipientState.selectedGroups);
      const groupsForType = newSelectedGroups.get(groupType);

      if (!groupsForType || groupIndex >= groupsForType.length) {
        return state; // Invalid group type or index
      }

      // Remove the specific group at the given index
      const updatedGroupsForType = [...groupsForType];
      updatedGroupsForType.splice(groupIndex, 1);

      // Update or remove the group type entry
      if (updatedGroupsForType.length === 0) {
        newSelectedGroups.delete(groupType);
      } else {
        newSelectedGroups.set(groupType, updatedGroupsForType);
      }

      // Recalculate totals
      const totalRecipients = calculateTotalRecipients(
        newSelectedGroups,
        recipientState.selectedWorkoutRecipients,
        recipientState.selectedTeamsWantedRecipients,
        recipientState.selectedUmpireRecipients,
      );
      const validEmailCount = totalRecipients; // Assume all valid for now

      return {
        ...state,
        recipientState: {
          ...recipientState,
          selectedGroups: newSelectedGroups,
          selectedWorkoutRecipients: recipientState.selectedWorkoutRecipients,
          selectedTeamsWantedRecipients: recipientState.selectedTeamsWantedRecipients,
          selectedUmpireRecipients: recipientState.selectedUmpireRecipients,
          totalRecipients,
          validEmailCount,
          invalidEmailCount: totalRecipients - validEmailCount,
        },
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
      return {
        ...createInitialState(state.config),
        resetCounter: state.resetCounter + 1,
      };

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
  seasonId,
  initialData,
  config: userConfig = {},
  onSendComplete,
  onError,
  editorRef,
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const config = useMemo(() => ({ ...DEFAULT_COMPOSE_CONFIG, ...userConfig }), [userConfig]);
  const [state, dispatch] = useReducer(composeReducer, createInitialState(config, initialData));

  // Refs for service
  const emailServiceRef = useRef(token ? createEmailService(token, apiClient) : null);
  const initialTemplateLoadedRef = useRef<string | null>(null);

  // Update email service when token changes
  useEffect(() => {
    if (token) {
      emailServiceRef.current = createEmailService(token, apiClient);
    } else {
      emailServiceRef.current = null;
    }
  }, [token, apiClient]);

  /**
   * Load template automatically when templateId is provided in initialData
   * This typically happens when navigating from template selection to compose
   */
  useEffect(() => {
    const loadInitialTemplate = async () => {
      if (!initialData?.templateId || !emailServiceRef.current || !token) {
        return;
      }

      // Skip if this templateId has already been loaded by this effect
      if (initialTemplateLoadedRef.current === initialData.templateId) {
        return;
      }

      // Mark as loading this template (prevents concurrent loads)
      initialTemplateLoadedRef.current = initialData.templateId;

      dispatch({ type: 'SET_LOADING', payload: true });

      const result = await safeAsync(
        async () => {
          const template = await emailServiceRef.current!.getTemplate(
            accountId,
            initialData.templateId!,
          );
          return { template };
        },
        {
          accountId,
          operation: 'load_template',
          additionalData: { templateId: initialData.templateId },
        },
      );

      dispatch({ type: 'SET_LOADING', payload: false });

      if (result.success) {
        dispatch({ type: 'SELECT_TEMPLATE', payload: result.data.template });
      } else {
        // Clear the ref on failure so retry is possible
        initialTemplateLoadedRef.current = null;
        logError(result.error, 'loadInitialTemplate');
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            field: 'template',
            message: result.error.userMessage || 'Failed to load template',
            severity: 'error',
          },
        });

        if (onError) {
          onError(new Error(result.error.message));
        }
      }
    };

    loadInitialTemplate();
  }, [initialData?.templateId, accountId, token, onError]);

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
        const selectedGroups = state.recipientState?.selectedGroups;
        const selectedWorkoutRecipients = state.recipientState?.selectedWorkoutRecipients || [];
        const selectedTeamsWantedRecipients =
          state.recipientState?.selectedTeamsWantedRecipients || [];
        const selectedUmpireRecipients = state.recipientState?.selectedUmpireRecipients || [];

        const hasGroupRecipients = selectedGroups && selectedGroups.size > 0;
        const hasWorkoutRecipients = selectedWorkoutRecipients.length > 0;
        const hasTeamsWantedRecipients = selectedTeamsWantedRecipients.length > 0;
        const hasUmpireRecipients = selectedUmpireRecipients.length > 0;

        if (
          !hasGroupRecipients &&
          !hasWorkoutRecipients &&
          !hasTeamsWantedRecipients &&
          !hasUmpireRecipients
        ) {
          dispatch({
            type: 'ADD_ERROR',
            payload: {
              field: 'recipients',
              message:
                'No recipients selected. Please choose contacts, groups, workout registrants, Teams Wanted, or Umpires.',
              severity: 'error',
            },
          });
          return Promise.reject(new Error('No recipients selected'));
        }

        const bodyContent = editorRef?.current?.getSanitizedContent?.() || state.content;

        const contacts =
          selectedGroups && selectedGroups.size > 0
            ? Array.from(
                selectedGroups.get('individuals')?.flatMap((grp) => Array.from(grp.ids)) ?? [],
              )
            : [];

        let managersOnly = false;
        const leagues = new Set<string>();
        const divisions = new Set<string>();
        const teams = new Set<string>();
        let includeSeason = false;

        if (selectedGroups && selectedGroups.size > 0) {
          for (const [groupType, groupList] of selectedGroups) {
            if (groupType === 'individuals') {
              continue;
            }

            if (!['season', 'league', 'division', 'teams'].includes(groupType)) {
              dispatch({
                type: 'ADD_ERROR',
                payload: {
                  field: 'recipients',
                  message: `Invalid recipient group type: ${groupType}. Please refresh and try again.`,
                  severity: 'error',
                },
              });
              return Promise.reject(new Error(`Invalid group type: ${groupType}`));
            }

            for (const group of groupList) {
              managersOnly = group.managersOnly;
              if (groupType === 'season') {
                includeSeason = true;
              }
              if (groupType === 'league') {
                extractGroupIds(group).forEach((id) => leagues.add(id));
              }
              if (groupType === 'division') {
                extractGroupIds(group).forEach((id) => divisions.add(id));
              }
              if (groupType === 'teams') {
                extractGroupIds(group).forEach((id) => teams.add(id));
              }
            }
          }
        }

        const emailRequest: EmailComposeRequest = {
          recipients: {
            contacts,
            seasonSelection:
              includeSeason || leagues.size || divisions.size || teams.size
                ? {
                    season: includeSeason || undefined,
                    leagues: leagues.size ? Array.from(leagues) : undefined,
                    divisions: divisions.size ? Array.from(divisions) : undefined,
                    teams: teams.size ? Array.from(teams) : undefined,
                    managersOnly: managersOnly || undefined,
                  }
                : undefined,
            workoutRecipients: selectedWorkoutRecipients.map((selection) => ({
              workoutId: selection.workoutId,
              registrationIds: selection.registrationIds
                ? Array.from(selection.registrationIds)
                : undefined,
              managersOnly: selection.managersOnly,
            })),
            teamsWantedRecipients: selectedTeamsWantedRecipients.map((selection) => ({
              classifiedId: selection.classifiedId,
            })),
            umpireRecipients: selectedUmpireRecipients.map((selection) => ({
              umpireId: selection.umpireId,
            })),
          },
          subject: state.subject,
          body: bodyContent,
          templateId: state.selectedTemplate?.id,
          attachments: state.attachments.filter((a) => a.status === 'uploaded').map((a) => a.url!),
          scheduledSend: state.isScheduled ? state.scheduledDate : undefined,
          seasonId,
        };

        dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 50 } });
        const emailId = await emailServiceRef.current!.composeEmail(accountId, emailRequest);

        dispatch({ type: 'SET_SENDING', payload: { isSending: true, progress: 100 } });

        return { emailId: emailId ?? 'workout-email' };
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

      // Error is already handled through state dispatch above
      // onError callback removed to prevent double error throwing

      dispatch({ type: 'SET_SENDING', payload: { isSending: false, progress: undefined } });
      return false;
    }
  }, [state, accountId, token, validateCompose, onSendComplete, editorRef, seasonId]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const setError = useCallback((error: ComposeValidationError) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  // Unified group-based recipient actions
  const updateRecipientState = useCallback((recipientState: RecipientSelectionState) => {
    dispatch({ type: 'UPDATE_RECIPIENT_STATE', payload: recipientState });
  }, []);

  const updateSelectedGroups = useCallback(
    (
      groups: Map<GroupType, ContactGroup[]>,
      workoutRecipients?: WorkoutRecipientSelection[],
      teamsWantedRecipients?: TeamsWantedRecipientSelection[],
      umpireRecipients?: UmpireRecipientSelection[],
    ) => {
      dispatch({
        type: 'UPDATE_SELECTED_GROUPS',
        payload: groups,
        workoutRecipients,
        teamsWantedRecipients,
        umpireRecipients,
      });
    },
    [],
  );

  const clearAllRecipients = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_RECIPIENTS' });
  }, []);

  const removeSpecificGroup = useCallback((groupType: GroupType, groupIndex: number) => {
    dispatch({ type: 'REMOVE_SPECIFIC_GROUP', payload: { groupType, groupIndex } });
  }, []);

  const setRecipientSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_RECIPIENT_SEARCH_QUERY', payload: query });
  }, []);

  const setRecipientActiveTab = useCallback((tab: RecipientSelectionTab) => {
    dispatch({ type: 'SET_RECIPIENT_ACTIVE_TAB', payload: tab });
  }, []);

  // Create actions object
  const actions: EmailComposeActions = {
    setSubject,
    setContent,
    selectTemplate,
    clearTemplate,
    addAttachments,
    updateAttachments,
    removeAttachment,
    clearAttachments,
    setScheduled,
    clearSchedule,
    validateCompose,
    sendEmail,
    reset,
    setError,
    clearErrors,
    updateRecipientState,
    updateSelectedGroups,
    clearAllRecipients,
    removeSpecificGroup,
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
