'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Backdrop,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
// Using Box/Stack layout only; avoid Grid2 to match project conventions
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Preview as PreviewIcon,
  KeyboardArrowDown as ExpandIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CloudOff as OfflineIcon,
  Wifi as OnlineIcon,
} from '@mui/icons-material';

import { EmailComposeProvider, useEmailCompose } from './EmailComposeProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { ComposePageSkeleton } from '../../common/SkeletonLoaders';
import { ComposeHeader } from './ComposeHeader';
import { ComposeActions } from './ComposeActions';
import ComposeSidebar from './ComposeSidebar';
import { ScheduleDialog } from './ScheduleDialog';
import AdvancedRecipientDialog from '../recipients/AdvancedRecipientDialog';
import { AttachmentUploader } from '../attachments/AttachmentUploader';
import { FileUploadComponent } from '../attachments/FileUploadComponent';
import RichTextEditor from '../../email/RichTextEditor';

import {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionState,
} from '../../../types/emails/recipients';
import { EmailAttachment } from '../../../types/emails/attachments';
import { EmailComposeRequest } from '../../../types/emails/email';
import { processTemplate } from '../../../types/emails/compose';

interface EmailComposePageProps {
  accountId: string;
  seasonId?: string;
  initialData?: Partial<EmailComposeRequest>;
  contacts: RecipientContact[];
  teamGroups?: TeamGroup[];
  roleGroups?: RoleGroup[];
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
  templates: string | null;
  network: string | null;
}

interface DialogState {
  sidebarOpen: boolean;
  scheduleDialogOpen: boolean;
  previewDialogOpen: boolean;
  advancedRecipientDialogOpen: boolean;
}

interface ComponentState {
  errors: ComponentErrorState;
  isOnline: boolean;
  retryCount: number;
  useEnhancedUpload: boolean;
  actionsCollapsed: boolean;
}

/**
 * Internal compose page component (wrapped with providers)
 */
const EmailComposePageInternal: React.FC<
  Omit<EmailComposePageProps, 'initialData' | 'onSendComplete' | 'onCancel'> & {
    onSendComplete?: (emailId: string) => void;
  }
> = React.memo(
  function EmailComposePageInternal({
    accountId,
    seasonId,
    contacts,
    teamGroups = [],
    roleGroups = [],
    loading = false,
    error = null,
    onRetry,
  }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const { state, actions } = useEmailCompose();

    // Consolidated state management
    const maxRetries = 3;

    const [dialogState, setDialogState] = useState<DialogState>({
      sidebarOpen: !isMobile,
      scheduleDialogOpen: false,
      previewDialogOpen: false,
      advancedRecipientDialogOpen: false,
    });

    const [componentState, setComponentState] = useState<ComponentState>({
      errors: {
        contacts: null,
        teams: null,
        roles: null,
        templates: null,
        network: null,
      },
      isOnline: navigator.onLine,
      retryCount: 0,
      useEnhancedUpload: true,
      actionsCollapsed: false,
    });

    // Use centralized notification management
    const { notification, showNotification, hideNotification } = useNotifications();

    // Data availability checks
    const hasContacts = useMemo(() => Array.isArray(contacts) && contacts.length > 0, [contacts]);
    const hasTeamGroups = useMemo(
      () => Array.isArray(teamGroups) && teamGroups.length > 0,
      [teamGroups],
    );
    const hasRoleGroups = useMemo(
      () => Array.isArray(roleGroups) && roleGroups.length > 0,
      [roleGroups],
    );
    const hasAnyRecipientData = hasContacts || hasTeamGroups || hasRoleGroups;

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

    // Handle preview
    const handlePreviewOpen = useCallback(() => {
      setDialogState((prev) => ({ ...prev, previewDialogOpen: true }));
    }, []);

    const handlePreviewClose = useCallback(() => {
      setDialogState((prev) => ({ ...prev, previewDialogOpen: false }));
    }, []);

    // Handle advanced recipient dialog
    const handleAdvancedRecipientOpen = useCallback(() => {
      if (!hasAnyRecipientData && !loading) {
        showNotification('No recipient data available. Please try refreshing the page.', 'warning');
        return;
      }
      setDialogState((prev) => ({ ...prev, advancedRecipientDialogOpen: true }));
    }, [hasAnyRecipientData, loading, showNotification]);

    const handleAdvancedRecipientClose = useCallback(() => {
      setDialogState((prev) => ({ ...prev, advancedRecipientDialogOpen: false }));
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

    // Toggle enhanced upload mode (for testing/fallback)
    const toggleUploadMode = useCallback(() => {
      setComponentState((prev) => {
        const newMode = !prev.useEnhancedUpload;
        showNotification(`Switched to ${newMode ? 'enhanced' : 'basic'} upload mode`, 'info');
        return { ...prev, useEnhancedUpload: newMode };
      });
    }, [showNotification]);

    // Handle content change
    const handleContentChange = useCallback(
      (content: string) => {
        actions.setContent(content);
      },
      [actions],
    );

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

          showNotification(`${recipientState.totalRecipients} recipients selected`, 'info');
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
              actions.saveDraft();
              break;
            case 'Enter':
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
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
    }, [actions, state.config.enableKeyboardShortcuts]);

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

    // Render preview content - memoized for performance
    const renderPreviewContent = useMemo(() => {
      const processedSubject =
        state.selectedTemplate && Object.keys(state.templateVariables).length > 0
          ? processTemplate(state.subject, state.templateVariables)
          : state.subject;

      const processedContent =
        state.selectedTemplate && Object.keys(state.templateVariables).length > 0
          ? processTemplate(state.content, state.templateVariables)
          : state.content;

      return (
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Subject:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {processedSubject || '(No subject)'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Recipients:
            </Typography>
            <Typography variant="body2">
              {state.recipientState?.totalRecipients || 0} recipient
              {state.recipientState?.totalRecipients !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Content:
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              <RichTextEditor
                initialValue={processedContent || '<p><em>No content</em></p>'}
                disabled={true}
                minHeight={200}
                placeholder=""
              />
            </Box>
          </Box>

          {state.attachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Attachments:
              </Typography>
              <Stack spacing={0.5}>
                {state.attachments.map((att) => (
                  <Typography key={att.id} variant="body2">
                    📎 {att.name} ({(att.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      );
    }, [
      state.subject,
      state.content,
      state.selectedTemplate,
      state.templateVariables,
      state.recipientState?.totalRecipients,
      state.attachments,
    ]);

    // Show full-page loading if no data and loading
    if (loading && !hasAnyRecipientData) {
      return (
        <Box sx={{ height: '100vh' }}>
          <ComposePageSkeleton showSidebar={!isMobile} />
          <Backdrop open sx={{ zIndex: theme.zIndex.drawer + 1, color: '#fff' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress color="inherit" size={60} />
              <Typography variant="h6">Loading email composer...</Typography>
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                Fetching contacts, teams, and settings
              </Typography>
            </Stack>
          </Backdrop>
        </Box>
      );
    }

    // Show error state if major error and no data
    if (error && !hasAnyRecipientData) {
      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Stack spacing={3} alignItems="center" maxWidth={500}>
            <WarningIcon sx={{ fontSize: 80, color: 'error.main' }} />
            <Typography variant="h4" textAlign="center" gutterBottom>
              Failed to Load Email Composer
            </Typography>
            <Alert severity="error" sx={{ width: '100%' }}>
              <AlertTitle>Error Loading Data</AlertTitle>
              {error}
            </Alert>

            <Typography variant="body1" color="text.secondary" textAlign="center">
              We could not load the necessary data for the email composer. This could be due to:
            </Typography>

            <Box component="ul" sx={{ textAlign: 'left' }}>
              <li>Network connectivity issues</li>
              <li>Server temporarily unavailable</li>
              <li>Insufficient permissions</li>
              <li>Account configuration problems</li>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                onClick={() => window.location.reload()}
                variant="outlined"
                startIcon={<RefreshIcon />}
              >
                Refresh Page
              </Button>
              {onRetry && componentState.retryCount < maxRetries && (
                <Button onClick={handleRetry} variant="contained" startIcon={<RefreshIcon />}>
                  Retry ({componentState.retryCount}/{maxRetries})
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            {componentState.errors.contacts && `Contacts: ${componentState.errors.contacts}. `}
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
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ flex: 1, p: isMobile ? 2 : 3 }}>
                <Stack spacing={3} sx={{ height: '100%' }}>
                  {/* Compose Header */}
                  <ComposeHeader
                    showFromField={!isMobile}
                    showRecipientCount={true}
                    showValidationErrors={true}
                    compact={isMobile}
                    onRecipientSelectionClick={handleAdvancedRecipientOpen}
                    hasAnyRecipientData={hasAnyRecipientData}
                    loading={loading}
                  />

                  {/* Data availability warnings - moved from recipient section */}
                  {!hasAnyRecipientData && !loading && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <AlertTitle>No Recipients Available</AlertTitle>
                      No contacts or groups are available for selection. Please check your account
                      setup or try refreshing.
                      <Button onClick={handleRetry} size="small" sx={{ mt: 1 }} variant="outlined">
                        Refresh Data
                      </Button>
                    </Alert>
                  )}

                  {/* Content Editor */}
                  <Box sx={{ flex: 1, minHeight: 300 }}>
                    {/* 
                      Key prop forces React to remount RichTextEditor when template changes.
                      This is necessary because RichTextEditor only reads initialValue on mount,
                      so without this key, template content wouldn't populate when users select templates.
                    */}
                    <RichTextEditor
                      key={state.selectedTemplate?.id || 'no-template'}
                      initialValue={state.content}
                      onChange={handleContentChange}
                      placeholder="Write your email content..."
                      disabled={state.isSending}
                      minHeight={isMobile ? 200 : 300}
                    />
                  </Box>

                  {/* Enhanced File Upload */}
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6">File Attachments</Typography>
                      {!isMobile && (
                        <Button
                          size="small"
                          onClick={toggleUploadMode}
                          variant="text"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {componentState.useEnhancedUpload ? 'Use Basic' : 'Use Enhanced'}
                        </Button>
                      )}
                    </Stack>

                    {componentState.useEnhancedUpload ? (
                      <ErrorBoundary
                        fallback={
                          <AttachmentUploader
                            attachments={state.attachments}
                            onAttachmentsChange={handleAttachmentsChange}
                            disabled={state.isSending}
                            compact={isMobile}
                          />
                        }
                        onError={(error) => {
                          console.error('FileUploadComponent error:', error);
                          showNotification(
                            'File upload component failed, using basic uploader',
                            'warning',
                          );
                        }}
                      >
                        <FileUploadComponent
                          accountId={accountId}
                          onAttachmentsChange={handleAttachmentsChange}
                          showQuota={true}
                          showProgress={true}
                          showPreview={true}
                          compact={isMobile}
                          disabled={state.isSending}
                        />
                      </ErrorBoundary>
                    ) : (
                      <AttachmentUploader
                        attachments={state.attachments}
                        onAttachmentsChange={handleAttachmentsChange}
                        disabled={state.isSending}
                        compact={isMobile}
                      />
                    )}
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
                    onPreviewClick={handlePreviewOpen}
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
            onPreviewClick={handlePreviewOpen}
            showAdvancedActions={!isMobile}
            compact={isMobile}
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
                onPreviewClick={handlePreviewOpen}
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
            teamGroups={hasTeamGroups ? teamGroups : []}
            roleGroups={hasRoleGroups ? roleGroups : []}
            loading={loading}
            error={
              componentState.errors.contacts ||
              componentState.errors.teams ||
              componentState.errors.roles
            }
            onRetry={handleRetry}
            initialSelectedGroups={state.recipientState?.selectedGroups}
          />
        </ErrorBoundary>

        {/* Preview Dialog */}
        <Dialog
          open={dialogState.previewDialogOpen}
          onClose={handlePreviewClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <PreviewIcon />
              <Typography variant="h6">Email Preview</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>{renderPreviewContent}</DialogContent>
          <DialogActions>
            <Button onClick={handlePreviewClose}>Close</Button>
          </DialogActions>
        </Dialog>

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
      prevProps.error === nextProps.error &&
      prevProps.contacts.length === nextProps.contacts.length &&
      prevProps.teamGroups?.length === nextProps.teamGroups?.length &&
      prevProps.roleGroups?.length === nextProps.roleGroups?.length &&
      // Deep comparison for contacts array if lengths are equal
      (prevProps.contacts.length === 0 ||
        prevProps.contacts.every((contact, index) => contact.id === nextProps.contacts[index]?.id))
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
  contacts,
  teamGroups = [],
  roleGroups = [],
  onSendComplete,
  loading = false,
  error = null,
  onRetry,
}) => {
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
      initialData={initialData}
      onSendComplete={handleProviderSendComplete}
      onDraftSaved={handleProviderDraftSaved}
      onError={handleProviderError}
    >
      <EmailComposePageInternal
        accountId={accountId}
        seasonId={seasonId}
        contacts={contacts}
        teamGroups={teamGroups}
        roleGroups={roleGroups}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
    </EmailComposeProvider>
  );
};
