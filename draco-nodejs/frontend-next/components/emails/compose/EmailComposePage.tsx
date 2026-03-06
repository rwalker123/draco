'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Fab,
  Button,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
// Using Box/Stack layout only; avoid Grid2 to match project conventions
import { KeyboardArrowDown as ExpandIcon, CloudOff as OfflineIcon } from '@mui/icons-material';

import { EmailComposeProvider, useEmailCompose } from './EmailComposeProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { useHierarchicalData } from '../../../hooks/useHierarchicalData';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { ComposeHeader } from './ComposeHeader';
import { ComposeActions } from './ComposeActions';
import { ScheduleDialog } from './ScheduleDialog';
import AdvancedRecipientDialog from '../recipients/AdvancedRecipientDialog';
import { FileUploadComponent } from '../attachments/FileUploadComponent';
import RichTextEditor, { type RichTextEditorHandle } from '../../email/RichTextEditor';
import ConfirmationDialog from '../../common/ConfirmationDialog';

import {
  RecipientContact,
  RecipientSelectionState,
  ContactGroup,
} from '../../../types/emails/recipients';
import { GroupBadgeEditDialog } from './GroupBadgeEditDialog';
import { GroupContact } from '../../../services/emailRecipientService';
import { EmailAttachment } from '../../../types/emails/attachments';
import { EmailComposeRequest } from '../../../types/emails/email';
import PageSectionHeader from '../../common/PageSectionHeader';

interface EmailComposePageProps {
  accountId: string;
  seasonId?: string;
  initialData?: Partial<EmailComposeRequest>;
  onSendComplete?: (emailId: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface ComponentErrorState {
  contacts: string | null;
  teams: string | null;
  roles: string | null;
  network: string | null;
}

interface DialogState {
  scheduleDialogOpen: boolean;
  advancedRecipientDialogOpen: boolean;
  advancedRecipientDialogKey: number;
  cancelConfirmDialogOpen: boolean;
  groupEditDialogOpen: boolean;
  editingGroup: ContactGroup | null;
}

interface ComponentState {
  errors: ComponentErrorState;
  isOnline: boolean;
  retryCount: number;
  actionsCollapsed: boolean;
}

/**
 * Internal compose page component (wrapped with providers)
 */
const EmailComposePageInternal: React.FC<
  Omit<EmailComposePageProps, 'initialData' | 'onSendComplete' | 'onCancel'> & {
    onSendComplete?: (emailId: string) => void;
    editorRef?: React.RefObject<RichTextEditorHandle | null>;
  }
> = function EmailComposePageInternal({
  accountId,
  seasonId,
  loading = false,
  error = null,
  onRetry,
  editorRef,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { state, actions } = useEmailCompose();

  // Consolidated state management
  const maxRetries = 3;

  const [dialogState, setDialogState] = useState<DialogState>({
    scheduleDialogOpen: false,
    advancedRecipientDialogOpen: false,
    advancedRecipientDialogKey: 0,
    cancelConfirmDialogOpen: false,
    groupEditDialogOpen: false,
    editingGroup: null,
  });

  const [componentState, setComponentState] = useState<ComponentState>({
    errors: {
      contacts: null,
      teams: null,
      roles: null,
      network: null,
    },
    isOnline: navigator.onLine,
    retryCount: 0,
    actionsCollapsed: false,
  });

  // Use centralized notification management
  const { notification, showNotification, hideNotification } = useNotifications();

  const { hierarchicalData } = useHierarchicalData(accountId, seasonId);

  const isGeneralLoading = loading;
  const hasErrors = error || Object.values(componentState.errors).some(Boolean);

  // Network status monitoring
  useEffect(() => {
    const abortController = new AbortController();

    const handleOnline = () => {
      if (abortController.signal.aborted) return;
      setComponentState((prev) => ({ ...prev, isOnline: true }));
      showNotification('Connection restored', 'success');
      // Clear network errors when coming back online
      setComponentState((prev) => ({
        ...prev,
        errors: { ...prev.errors, network: null },
      }));
    };

    const handleOffline = () => {
      if (abortController.signal.aborted) return;
      setComponentState((prev) => ({
        ...prev,
        isOnline: false,
        errors: { ...prev.errors, network: 'No internet connection' },
      }));
      showNotification('Connection lost. Some features may not work.', 'warning');
    };

    window.addEventListener('online', handleOnline, { signal: abortController.signal });
    window.addEventListener('offline', handleOffline, { signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [showNotification]);

  const handleScheduleOpen = () => {
    setDialogState((prev) => ({ ...prev, scheduleDialogOpen: true }));
  };

  const handleScheduleClose = () => {
    setDialogState((prev) => ({ ...prev, scheduleDialogOpen: false }));
  };

  const handleScheduleComplete = (date: Date) => {
    showNotification(
      `Email scheduled for ${new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date)}`,
      'success',
    );
  };

  // Preview functionality removed to eliminate cursor jumping issues
  // handlePreviewOpen and handlePreviewClose have been removed since preview is no longer needed

  const handleAdvancedRecipientOpen = () => {
    setDialogState((prev) => ({
      ...prev,
      advancedRecipientDialogOpen: true,
      advancedRecipientDialogKey: prev.advancedRecipientDialogKey + 1,
    }));
  };

  const handleAdvancedRecipientClose = () => {
    setDialogState((prev) => ({ ...prev, advancedRecipientDialogOpen: false }));
  };

  const handleCancelClick = () => {
    setDialogState((prev) => ({ ...prev, cancelConfirmDialogOpen: true }));
  };

  const handleCancelConfirm = () => {
    actions.reset();
    setDialogState((prev) => ({ ...prev, cancelConfirmDialogOpen: false }));
    showNotification('Email cleared successfully', 'success');
  };

  const handleCancelDialogClose = () => {
    setDialogState((prev) => ({ ...prev, cancelConfirmDialogOpen: false }));
  };

  const handleEditGroup = (group: ContactGroup) => {
    setDialogState((prev) => ({
      ...prev,
      groupEditDialogOpen: true,
      editingGroup: group,
    }));
  };

  const handleEditGroupClose = () => {
    setDialogState((prev) => ({
      ...prev,
      groupEditDialogOpen: false,
      editingGroup: null,
    }));
  };

  const handleEditGroupApply = (selectedContactIds: Set<string>, allContacts: GroupContact[]) => {
    if (!dialogState.editingGroup) return;

    actions.convertGroupToIndividuals(dialogState.editingGroup, selectedContactIds, allContacts);
    showNotification('Group converted to individual selections', 'success');
    handleEditGroupClose();
  };

  const handleRetry = () => {
    if (componentState.retryCount >= maxRetries) {
      showNotification('Maximum retry attempts reached. Please refresh the page.', 'error');
      return;
    }

    setComponentState((prev) => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      errors: {
        contacts: null,
        teams: null,
        roles: null,
        network: null,
      },
    }));

    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }

    showNotification(`Retrying... (${componentState.retryCount + 1}/${maxRetries})`, 'info');
  };

  const syncEditorContent = () => {
    if (editorRef?.current) {
      const currentContent = editorRef.current.getSanitizedContent();
      if (currentContent !== state.content) {
        actions.setContent(currentContent);
      }
    }
  };

  const handleAttachmentsChange = (newAttachments: EmailAttachment[]) => {
    actions.clearAttachments();
    actions.addAttachments(newAttachments);
  };

  const handleRecipientSelectionChange = (
    recipientState: RecipientSelectionState,
    selectedContacts?: RecipientContact[],
  ) => {
    try {
      const individualContactDetails = new Map<string, RecipientContact>(
        (selectedContacts ?? []).map((c) => [c.id, c]),
      );
      actions.updateRecipientState({ ...recipientState, individualContactDetails });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipients';
      setComponentState((prev) => ({
        ...prev,
        errors: { ...prev.errors, contacts: errorMessage },
      }));
      showNotification(errorMessage, 'error');
    }
  };

  const handleNotificationClose = () => {
    hideNotification();
  };

  useEffect(() => {
    if (!state.config.enableKeyboardShortcuts) return;

    const abortController = new AbortController();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (abortController.signal.aborted) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              if (editorRef?.current) {
                const currentContent = editorRef.current.getSanitizedContent();
                if (currentContent !== state.content) {
                  actions.setContent(currentContent);
                }
              }
              actions.sendEmail();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [actions, editorRef, state.config.enableKeyboardShortcuts, state.content]);

  // Auto-collapse actions on mobile when scrolling with proper cleanup
  useEffect(() => {
    if (!isMobile) return;

    const abortController = new AbortController();
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (abortController.signal.aborted) return;

      const currentScrollY = window.scrollY;
      setComponentState((prev) => ({
        ...prev,
        actionsCollapsed: currentScrollY > lastScrollY && currentScrollY > 100,
      }));
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [isMobile]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Error Banner */}
      {!componentState.isOnline && (
        <Alert severity="warning" icon={<OfflineIcon />} sx={{ borderRadius: 0 }}>
          <Typography variant="body2">
            You are currently offline. Some features may not work properly.
          </Typography>
        </Alert>
      )}

      {/* Component Errors */}
      {hasErrors && (
        <Alert
          severity="error"
          sx={{ borderRadius: 0 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              disabled={componentState.retryCount >= maxRetries}
            >
              Retry
            </Button>
          }
        >
          <AlertTitle>Some features may not work properly</AlertTitle>
          {componentState.errors.teams && `Teams: ${componentState.errors.teams}. `}
          {componentState.errors.roles && `Roles: ${componentState.errors.roles}. `}
          {componentState.errors.network && `Network: ${componentState.errors.network}. `}
        </Alert>
      )}

      {/* Loading Progress Bar */}
      {isGeneralLoading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: hasErrors || !componentState.isOnline ? 'auto' : 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
        />
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              flex: 1,
              p: isMobile ? 2 : 3,
              pb: isMobile ? 12 : 8,
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={3}>
              {/* Compose Header */}
              <ComposeHeader
                showFromField={!isMobile}
                showRecipientCount={true}
                showValidationErrors={true}
                compact={isMobile}
                onRecipientSelectionClick={handleAdvancedRecipientOpen}
                onCancelClick={handleCancelClick}
                onEditGroup={handleEditGroup}
                loading={loading}
              />

              {/* Content Editor */}
              <Box sx={{ flex: 1, minHeight: 300 }}>
                {/* 
                    Key prop forces React to remount RichTextEditor when template changes.
                    This is necessary because RichTextEditor only reads initialValue on mount,
                    so without this key, template content wouldn't populate when users select templates.
                  */}
                <RichTextEditor
                  key={`editor-${state.resetCounter}-${state.selectedTemplate?.id || 'no-template'}`}
                  ref={editorRef}
                  initialValue={state.content}
                  placeholder="Write your email content..."
                  disabled={state.isSending}
                  minHeight={isMobile ? 200 : 300}
                />
              </Box>

              {/* Enhanced File Upload */}
              <Box>
                <PageSectionHeader title="File Attachments" gutterBottom />

                <ErrorBoundary
                  fallback={
                    <Alert severity="error" sx={{ mt: 2 }}>
                      File upload component failed to load. Please refresh the page to try again.
                    </Alert>
                  }
                  onError={(error) => {
                    console.error('FileUploadComponent error:', error);
                    showNotification('File upload component failed to load', 'error');
                  }}
                >
                  <FileUploadComponent
                    accountId={accountId}
                    onAttachmentsChange={handleAttachmentsChange}
                    showPreview={true}
                    compact={isMobile}
                    disabled={state.isSending}
                  />
                </ErrorBoundary>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Actions Bar */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          borderTop: 1,
          borderColor: 'divider',
          p: 2,
          backgroundColor: 'background.paper',
          zIndex: theme.zIndex.appBar,
          transform:
            isMobile && componentState.actionsCollapsed ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <ComposeActions
          onScheduleClick={handleScheduleOpen}
          compact={isMobile}
          onBeforeSend={syncEditorContent}
          editorRef={editorRef}
        />
      </Box>

      {/* Floating Action Buttons */}
      {isMobile && componentState.actionsCollapsed && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}>
          <Stack spacing={1}>
            <Fab
              size="small"
              color="secondary"
              onClick={() => setComponentState((prev) => ({ ...prev, actionsCollapsed: false }))}
            >
              <ExpandIcon />
            </Fab>
          </Stack>
        </Box>
      )}

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={dialogState.scheduleDialogOpen}
        onClose={handleScheduleClose}
        onSchedule={handleScheduleComplete}
      />

      {/* Advanced Recipient Dialog */}
      <ErrorBoundary
        onError={(error) => {
          console.error('AdvancedRecipientDialog error:', error);
          setComponentState((prev) => ({
            ...prev,
            errors: { ...prev.errors, contacts: 'Advanced recipient dialog failed' },
          }));
          showNotification('Advanced recipient dialog failed to load', 'error');
          setDialogState((prev) => ({ ...prev, advancedRecipientDialogOpen: false }));
        }}
      >
        <AdvancedRecipientDialog
          key={`recipient-dialog-${dialogState.advancedRecipientDialogKey}`}
          open={dialogState.advancedRecipientDialogOpen}
          onClose={handleAdvancedRecipientClose}
          onApply={handleRecipientSelectionChange}
          accountId={accountId}
          seasonId={seasonId}
          loading={loading}
          error={componentState.errors.teams || componentState.errors.roles}
          onRetry={handleRetry}
          initialSelectedGroups={state.recipientState?.selectedGroups}
          initialWorkoutRecipients={state.recipientState?.selectedWorkoutRecipients}
          initialWorkoutManagersOnly={state.recipientState?.workoutManagersOnly}
          initialTeamsWantedRecipients={state.recipientState?.selectedTeamsWantedRecipients}
          initialUmpireRecipients={state.recipientState?.selectedUmpireRecipients}
          initialIndividualContactDetails={state.recipientState?.individualContactDetails}
          preloadedHierarchicalData={hierarchicalData}
        />
      </ErrorBoundary>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogState.cancelConfirmDialogOpen}
        onClose={handleCancelDialogClose}
        onConfirm={handleCancelConfirm}
        title="Clear Email"
        message="Are you sure you want to clear this email? All content, recipients, and attachments will be lost. This action cannot be undone."
        confirmText="Clear Email"
        cancelText="Keep Editing"
        confirmButtonColor="error"
      />

      {/* Group Badge Edit Dialog */}
      {dialogState.editingGroup && (
        <GroupBadgeEditDialog
          open={dialogState.groupEditDialogOpen}
          onClose={handleEditGroupClose}
          onApply={handleEditGroupApply}
          accountId={accountId}
          seasonId={seasonId || ''}
          group={dialogState.editingGroup}
        />
      )}

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleNotificationClose} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/**
 * EmailComposePage - Complete email composition interface with all providers
 */
export const EmailComposePage: React.FC<EmailComposePageProps> = ({
  accountId,
  seasonId,
  initialData,
  onSendComplete,
  loading = false,
  error = null,
  onRetry,
}) => {
  // Editor ref to access content - shared between provider and internal component
  const editorRef = useRef<RichTextEditorHandle | null>(null);

  const handleProviderSendComplete = (emailId: string) => {
    if (onSendComplete) {
      onSendComplete(emailId);
    }
  };

  const handleProviderError = (error: Error) => {
    console.error('Compose error:', error);
  };
  return (
    <EmailComposeProvider
      accountId={accountId}
      seasonId={seasonId}
      initialData={initialData}
      onSendComplete={handleProviderSendComplete}
      onError={handleProviderError}
      editorRef={editorRef}
    >
      <EmailComposePageInternal
        accountId={accountId}
        seasonId={seasonId}
        loading={loading}
        error={error}
        onRetry={onRetry}
        editorRef={editorRef}
      />
    </EmailComposeProvider>
  );
};
