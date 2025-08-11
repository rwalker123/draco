'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
// Using Box/Stack layout only; avoid Grid2 to match project conventions
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Preview as PreviewIcon,
  KeyboardArrowDown as ExpandIcon,
} from '@mui/icons-material';

import { EmailComposeProvider, useEmailCompose } from './EmailComposeProvider';
import { RecipientSelectionProvider } from '../recipients/RecipientSelectionProvider';
import { ComposeHeader } from './ComposeHeader';
import { ComposeActions } from './ComposeActions';
import { ComposeSidebar } from './ComposeSidebar';
import { ScheduleDialog } from './ScheduleDialog';
import { RecipientSelector } from '../recipients/RecipientSelector';
import { AttachmentUploader } from '../attachments/AttachmentUploader';
import RichTextEditor from '../../email/RichTextEditor';

import {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionState,
} from '../../../types/emails/recipients';
import { EmailAttachment } from '../../../types/emails/attachments';
import { EmailComposeRequest } from '../../../types/emails/email';

interface EmailComposePageProps {
  accountId: string;
  initialData?: Partial<EmailComposeRequest>;
  contacts: RecipientContact[];
  teamGroups?: TeamGroup[];
  roleGroups?: RoleGroup[];
  onSendComplete?: (emailId: string) => void;
  onCancel?: () => void;
}

/**
 * Internal compose page component (wrapped with providers)
 */
const EmailComposePageInternal: React.FC<
  Omit<EmailComposePageProps, 'initialData' | 'onSendComplete'> & {
    onSendComplete?: (emailId: string) => void;
  }
> = ({
  accountId,
  contacts,
  teamGroups = [],
  roleGroups = [],
  onSendComplete: _onSendComplete,
  onCancel: _onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { state, actions } = useEmailCompose();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [actionsCollapsed, setActionsCollapsed] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Handle schedule dialog
  const handleScheduleOpen = useCallback(() => {
    setScheduleDialogOpen(true);
  }, []);

  const handleScheduleClose = useCallback(() => {
    setScheduleDialogOpen(false);
  }, []);

  const handleScheduleComplete = useCallback((date: Date) => {
    setNotification({
      message: `Email scheduled for ${new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date)}`,
      severity: 'success',
    });
  }, []);

  // Handle preview
  const handlePreviewOpen = useCallback(() => {
    setPreviewDialogOpen(true);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewDialogOpen(false);
  }, []);

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
  const handleRecipientSelectionChange = useCallback((_recipientState: RecipientSelectionState) => {
    // Update the compose state with recipient information
    // This would be integrated with the RecipientSelectionProvider
  }, []);

  // Close notification
  const handleNotificationClose = useCallback(() => {
    setNotification(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!state.config.enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, state.config.enableKeyboardShortcuts]);

  // Auto-collapse actions on mobile when scrolling
  useEffect(() => {
    if (!isMobile) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setActionsCollapsed(currentScrollY > lastScrollY && currentScrollY > 100);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Render preview content
  const renderPreviewContent = () => {
    const processedSubject =
      state.selectedTemplate && state.templateVariables
        ? // Process template variables in subject
          state.subject
        : state.subject;

    const processedContent =
      state.selectedTemplate && state.templateVariables
        ? // Process template variables in content
          state.content
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
              p: 2,
              maxHeight: 300,
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: processedContent || '<p><em>No content</em></p>' }}
          />
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
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: !isMobile && sidebarOpen ? '2fr 1fr' : '1fr',
              lg: !isMobile && sidebarOpen ? '3fr 1fr' : '1fr',
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
                />

                {/* Recipient Selection */}
                <RecipientSelectionProvider
                  contacts={contacts}
                  teamGroups={teamGroups}
                  roleGroups={roleGroups}
                  onSelectionChange={handleRecipientSelectionChange}
                >
                  <RecipientSelector
                    showSelectedList={!isMobile}
                    compactView={isMobile}
                    showValidation={true}
                  />
                </RecipientSelectionProvider>

                {/* Content Editor */}
                <Box sx={{ flex: 1, minHeight: 300 }}>
                  <RichTextEditor
                    value={state.content}
                    onChange={handleContentChange}
                    placeholder="Write your email content..."
                    disabled={state.isSending}
                    minHeight={isMobile ? 200 : 300}
                  />
                </Box>

                {/* Attachments */}
                <AttachmentUploader
                  attachments={state.attachments}
                  onAttachmentsChange={handleAttachmentsChange}
                  disabled={state.isSending}
                  compact={isMobile}
                />
              </Stack>
            </Box>
          </Box>

          {/* Sidebar */}
          {!isMobile && sidebarOpen && (
            <Box sx={{ height: '100%', borderLeft: 1, borderColor: 'divider' }}>
              <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                <ComposeSidebar
                  accountId={accountId}
                  showTemplates={true}
                  showRecipientSummary={true}
                  showAttachmentSummary={true}
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
          transform: isMobile && actionsCollapsed ? 'translateY(100%)' : 'translateY(0)',
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
          open={sidebarOpen}
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
              accountId={accountId}
              showTemplates={true}
              showRecipientSummary={true}
              showAttachmentSummary={true}
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

            {actionsCollapsed && (
              <Fab size="small" color="secondary" onClick={() => setActionsCollapsed(false)}>
                <ExpandIcon />
              </Fab>
            )}
          </Stack>
        </Box>
      )}

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={handleScheduleClose}
        onSchedule={handleScheduleComplete}
      />

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={handlePreviewClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <PreviewIcon />
            <Typography variant="h6">Email Preview</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>{renderPreviewContent()}</DialogContent>
        <DialogActions>
          <Button onClick={handlePreviewClose}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              handlePreviewClose();
              actions.sendEmail();
            }}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
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
  initialData,
  contacts,
  teamGroups = [],
  roleGroups = [],
  onSendComplete,
  onCancel: _onCancel,
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
        contacts={contacts}
        teamGroups={teamGroups}
        roleGroups={roleGroups}
        onSendComplete={onSendComplete}
        onCancel={_onCancel}
      />
    </EmailComposeProvider>
  );
};
