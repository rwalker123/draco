'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Fab,
  Drawer,
  IconButton,
  Button,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
// Using Box/Stack layout only; avoid Grid2 to match project conventions
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ExpandIcon,
  CloudOff as OfflineIcon,
  Wifi as OnlineIcon,
} from '@mui/icons-material';

import { EmailComposeProvider, useEmailCompose } from './EmailComposeProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { ComposeHeader } from './ComposeHeader';
import { ComposeActions } from './ComposeActions';
import ComposeSidebar from './ComposeSidebar';
import { ScheduleDialog } from './ScheduleDialog';
import AdvancedRecipientDialog from '../recipients/AdvancedRecipientDialog';
import { FileUploadComponent } from '../attachments/FileUploadComponent';
import RichTextEditor from '../../email/RichTextEditor';
import ConfirmationDialog from '../../common/ConfirmationDialog';

import { RecipientContact, RecipientSelectionState } from '../../../types/emails/recipients';
import { EmailAttachment } from '../../../types/emails/attachments';
import { EmailComposeRequest } from '../../../types/emails/email';

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
  teams: string | null;
  roles: string | null;
  templates: string | null;
  network: string | null;
}

interface DialogState {
  sidebarOpen: boolean;
  scheduleDialogOpen: boolean;
  advancedRecipientDialogOpen: boolean;
  cancelConfirmDialogOpen: boolean;
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
    editorRef?: React.RefObject<{
      getCurrentContent: () => string;
      getTextContent: () => string;
      insertText: (text: string) => void;
    } | null>;
  }
> = React.memo(
  function EmailComposePageInternal({
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
      sidebarOpen: !isMobile,
      scheduleDialogOpen: false,
      advancedRecipientDialogOpen: false,
      cancelConfirmDialogOpen: false,
    });

    const [componentState, setComponentState] = useState<ComponentState>({
      errors: {
        teams: null,
        roles: null,
        templates: null,
        network: null,
      },
      isOnline: navigator.onLine,
      retryCount: 0,
      actionsCollapsed: false,
    });

    // Use centralized notification management
    const { notification, showNotification, hideNotification } = useNotifications();

    // Overall loading state - memoized for performance
    const isGeneralLoading = useMemo(() => loading, [loading]);
    const hasErrors = useMemo(
      () => error || Object.values(componentState.errors).some(Boolean),
      [error, componentState.errors],
    );

    // Network status monitoring with AbortController for cleanup
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

    // Handle sidebar toggle
    const handleSidebarToggle = useCallback(() => {
      setDialogState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
    }, []);

    // Handle schedule dialog
    const handleScheduleOpen = useCallback(() => {
      setDialogState((prev) => ({ ...prev, scheduleDialogOpen: true }));
    }, []);

    const handleScheduleClose = useCallback(() => {
      setDialogState((prev) => ({ ...prev, scheduleDialogOpen: false }));
    }, []);

    const handleScheduleComplete = useCallback(
      (date: Date) => {
        showNotification(
          `Email scheduled for ${new Intl.DateTimeFormat('en-US', {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(date)}`,
          'success',
        );
      },
      [showNotification],
    );

    // Preview functionality removed to eliminate cursor jumping issues
    // handlePreviewOpen and handlePreviewClose have been removed since preview is no longer needed

    // Handle advanced recipient dialog
    const handleAdvancedRecipientOpen = useCallback(() => {
      setDialogState((prev) => ({ ...prev, advancedRecipientDialogOpen: true }));
    }, []);

    const handleAdvancedRecipientClose = useCallback(() => {
      setDialogState((prev) => ({ ...prev, advancedRecipientDialogOpen: false }));
    }, []);

    // Handle cancel/clear functionality
    const handleCancelClick = useCallback(() => {
      setDialogState((prev) => ({ ...prev, cancelConfirmDialogOpen: true }));
    }, []);

    const handleCancelConfirm = useCallback(() => {
      actions.reset();
      setDialogState((prev) => ({ ...prev, cancelConfirmDialogOpen: false }));
      showNotification('Email cleared successfully', 'success');
    }, [actions, showNotification]);

    const handleCancelDialogClose = useCallback(() => {
      setDialogState((prev) => ({ ...prev, cancelConfirmDialogOpen: false }));
    }, []);

    // Error handling and retry functionality
    const handleRetry = useCallback(() => {
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
          templates: null,
          network: null,
        },
      }));

      if (onRetry) {
        onRetry();
      } else {
        // Default retry behavior - reload the page
        window.location.reload();
      }

      showNotification(`Retrying... (${componentState.retryCount + 1}/${maxRetries})`, 'info');
    }, [componentState.retryCount, maxRetries, onRetry, showNotification]);

    // Sync editor content to state before operations that need current content
    const syncEditorContent = useCallback(() => {
      if (editorRef?.current) {
        const currentContent = editorRef.current.getCurrentContent();
        if (currentContent !== state.content) {
          actions.setContent(currentContent);
        }
      }
    }, [actions, state.content, editorRef]);

    // Handle attachments change
    const handleAttachmentsChange = useCallback(
      (newAttachments: EmailAttachment[]) => {
        actions.clearAttachments();
        actions.addAttachments(newAttachments);
      },
      [actions],
    );

    // Handle recipient selection change
    const handleRecipientSelectionChange = useCallback(
      (recipientState: RecipientSelectionState, _selectedContacts?: RecipientContact[]) => {
        try {
          // Update the compose state with recipient information
          actions.updateRecipientState(recipientState);

          // Update selected groups if they exist (unified group architecture)
          if (recipientState.selectedGroups) {
            actions.updateSelectedGroups(recipientState.selectedGroups);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update recipients';
          setComponentState((prev) => ({
            ...prev,
            errors: { ...prev.errors, contacts: errorMessage },
          }));
          showNotification(errorMessage, 'error');
        }
      },
      [actions, showNotification],
    );

    // Close notification
    const handleNotificationClose = useCallback(() => {
      hideNotification();
    }, [hideNotification]);

    // Keyboard shortcuts with proper cleanup
    useEffect(() => {
      if (!state.config.enableKeyboardShortcuts) return;

      const abortController = new AbortController();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (abortController.signal.aborted) return;

        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 's':
              event.preventDefault();
              syncEditorContent();
              actions.saveDraft();
              break;
            case 'Enter':
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                syncEditorContent();
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
    }, [actions, state.config.enableKeyboardShortcuts, syncEditorContent]);

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
            <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
              <Typography variant="body2">
                You are currently offline. Some features may not work properly.
              </Typography>
              {componentState.isOnline && (
                <Button
                  size="small"
                  startIcon={<OnlineIcon />}
                  onClick={() => window.location.reload()}
                >
                  Reconnected - Refresh
                </Button>
              )}
            </Stack>
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
            {componentState.errors.templates && `Templates: ${componentState.errors.templates}. `}
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
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: !isMobile && dialogState.sidebarOpen ? '2fr 1fr' : '1fr',
                lg: !isMobile && dialogState.sidebarOpen ? '3fr 1fr' : '1fr',
              },
            }}
          >
            {/* Main Compose Area */}
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
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      File Attachments
                    </Typography>

                    <ErrorBoundary
                      fallback={
                        <Alert severity="error" sx={{ mt: 2 }}>
                          File upload component failed to load. Please refresh the page to try
                          again.
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

            {/* Sidebar */}
            {!isMobile && dialogState.sidebarOpen && (
              <Box sx={{ height: '100%', borderLeft: 1, borderColor: 'divider' }}>
                <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                  <ComposeSidebar
                    state={state}
                    actions={actions}
                    accountId={accountId}
                    showTemplates={true}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Actions Bar */}
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 2,
            backgroundColor: 'background.paper',
            transform:
              isMobile && componentState.actionsCollapsed ? 'translateY(100%)' : 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <ComposeActions
            onScheduleClick={handleScheduleOpen}
            showAdvancedActions={!isMobile}
            compact={isMobile}
            onBeforeSend={syncEditorContent}
            onBeforeSave={syncEditorContent}
            editorRef={editorRef}
          />
        </Box>

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <Drawer
            anchor="right"
            open={dialogState.sidebarOpen}
            onClose={handleSidebarToggle}
            PaperProps={{ sx: { width: '90%', maxWidth: 400 } }}
          >
            <Box sx={{ p: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Email Options</Typography>
                <IconButton onClick={handleSidebarToggle}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <ComposeSidebar
                state={state}
                actions={actions}
                accountId={accountId}
                showTemplates={true}
                compact={true}
              />
            </Box>
          </Drawer>
        )}

        {/* Floating Action Buttons */}
        {isMobile && (
          <Box sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}>
            <Stack spacing={1}>
              <Fab size="small" color="primary" onClick={handleSidebarToggle}>
                <MenuIcon />
              </Fab>

              {componentState.actionsCollapsed && (
                <Fab
                  size="small"
                  color="secondary"
                  onClick={() =>
                    setComponentState((prev) => ({ ...prev, actionsCollapsed: false }))
                  }
                >
                  <ExpandIcon />
                </Fab>
              )}
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
            open={dialogState.advancedRecipientDialogOpen}
            onClose={handleAdvancedRecipientClose}
            onApply={handleRecipientSelectionChange}
            accountId={accountId}
            seasonId={seasonId}
            loading={loading}
            error={componentState.errors.teams || componentState.errors.roles}
            onRetry={handleRetry}
            initialSelectedGroups={state.recipientState?.selectedGroups}
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

        {/* Notifications */}
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={handleNotificationClose}
            severity={notification?.severity}
            variant="filled"
          >
            {notification?.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo optimization
    return (
      prevProps.accountId === nextProps.accountId &&
      prevProps.loading === nextProps.loading &&
      prevProps.error === nextProps.error
    );
  },
);

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
  const editorRef = useRef<{
    getCurrentContent: () => string;
    getTextContent: () => string;
    insertText: (text: string) => void;
  } | null>(null);

  // Provider callback handlers for notifications
  const handleProviderSendComplete = useCallback(
    (emailId: string) => {
      if (onSendComplete) {
        onSendComplete(emailId);
      }
    },
    [onSendComplete],
  );

  const handleProviderDraftSaved = useCallback((_draftId: string) => {
    // Draft saved - could add notification here if needed
  }, []);

  const handleProviderError = useCallback((error: Error) => {
    console.error('Compose error:', error);
  }, []);
  return (
    <EmailComposeProvider
      accountId={accountId}
      seasonId={seasonId}
      initialData={initialData}
      onSendComplete={handleProviderSendComplete}
      onDraftSaved={handleProviderDraftSaved}
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
