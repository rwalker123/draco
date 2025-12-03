'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { validateComposeData } from '../../../types/emails/compose';
import type { RichTextEditorHandle } from '../../email/RichTextEditor';

interface ComposeActionsProps {
  onScheduleClick?: () => void;
  compact?: boolean;
  onBeforeSend?: () => void;
  editorRef?: React.RefObject<RichTextEditorHandle | null>;
}

/**
 * ComposeActions - Send, schedule, and other action buttons
 */
const ComposeActionsComponent: React.FC<ComposeActionsProps> = ({
  onScheduleClick,
  compact = false,
  onBeforeSend,
  editorRef,
}) => {
  const { state, actions } = useEmailCompose();
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);
  const [showEmptyContentWarning, setShowEmptyContentWarning] = useState(false);

  // Handle send email
  const handleSend = useCallback(async () => {
    try {
      // Sync editor content before validation to avoid race condition
      if (onBeforeSend) {
        onBeforeSend();
      }

      // Check for empty content directly from editor to avoid React state batching race condition
      const currentContent = editorRef?.current?.getSanitizedContent?.() || '';
      if (!currentContent || !currentContent.trim()) {
        setShowEmptyContentWarning(true);
        return;
      }
      const success = await actions.sendEmail();
      if (success) {
        // Email sent successfully - any additional UI feedback would be handled by parent
      }
      // Error cases are handled by EmailComposeProvider through state management
    } catch (error) {
      // Catch any unexpected errors that might bubble up
      // The EmailComposeProvider should handle all email sending errors through state
      console.warn('Unexpected error in handleSend:', error);
    }
  }, [actions, onBeforeSend, editorRef]);

  // Handle confirmed send with empty content
  const handleConfirmEmptySend = useCallback(async () => {
    setShowEmptyContentWarning(false);
    // Sync editor content before sending
    if (onBeforeSend) {
      onBeforeSend();
    }
    const success = await actions.sendEmail();
    if (success) {
      // Email sent successfully - any additional UI feedback would be handled by parent
    }
  }, [actions, onBeforeSend]);

  // Handle schedule
  const handleSchedule = useCallback(() => {
    if (onScheduleClick) {
      onScheduleClick();
    }
  }, [onScheduleClick]);

  const handleSendMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSendMenuAnchor(event.currentTarget);
  }, []);

  const handleSendMenuClose = useCallback(() => {
    setSendMenuAnchor(null);
  }, []);

  // Determine if send is disabled (pure validation to avoid dispatch in render)
  const validation = useMemo(() => validateComposeData(state, state.config), [state]);
  const canSend = validation.isValid && !state.isSending && !state.isLoading;

  // Get recipient count
  const recipientCount = state.recipientState?.totalRecipients || 0;

  return (
    <Box>
      {/* Send Progress */}
      {state.isSending && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant={state.sendProgress !== undefined ? 'determinate' : 'indeterminate'}
            value={state.sendProgress}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {state.sendProgress !== undefined
              ? `Sending... ${Math.round(state.sendProgress)}%`
              : 'Preparing to send...'}
          </Typography>
        </Box>
      )}

      {/* Main Actions */}
      <Stack
        direction={compact ? 'column' : 'row'}
        spacing={2}
        alignItems={compact ? 'stretch' : 'center'}
        justifyContent="space-between"
      >
        {/* Primary Send Actions */}
        <Stack direction="row" spacing={1}>
          {/* Send Button with Dropdown */}
          <ButtonGroup variant="contained" disabled={!canSend}>
            <Button
              startIcon={<SendIcon />}
              onClick={handleSend}
              disabled={!canSend}
              size={compact ? 'small' : 'medium'}
            >
              {state.isScheduled ? 'Schedule' : 'Send'}
              {recipientCount > 0 && ` (${recipientCount})`}
            </Button>
            <Button
              size={compact ? 'small' : 'medium'}
              onClick={handleSendMenuOpen}
              disabled={!canSend}
            >
              <ArrowDownIcon />
            </Button>
          </ButtonGroup>
        </Stack>

        {/* Secondary Actions */}
        <Stack direction="row" spacing={1} alignItems="center" />
      </Stack>

      {/* Send Options Menu */}
      <Menu anchorEl={sendMenuAnchor} open={Boolean(sendMenuAnchor)} onClose={handleSendMenuClose}>
        <MenuItem
          onClick={() => {
            handleSend();
            handleSendMenuClose();
          }}
        >
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Send Now
            <Typography variant="caption" display="block" color="text.secondary">
              Send immediately to {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
            </Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleSchedule();
            handleSendMenuClose();
          }}
        >
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Schedule for Later
            <Typography variant="caption" display="block" color="text.secondary">
              Choose a specific date and time
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* General Validation Errors - Field-specific errors are shown next to their controls */}
      {!validation.isValid && validation.errors.some((error) => error.field === 'general') && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {validation.errors
            .filter((error) => error.field === 'general')
            .map((error, index) => (
              <Alert
                key={`${error.field}-${index}`}
                severity="error"
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5,
                  '& .MuiAlert-message': {
                    fontSize: '0.75rem',
                  },
                }}
              >
                {error.message}
              </Alert>
            ))}
        </Stack>
      )}

      {/* Empty Content Warning Dialog */}
      <Dialog
        open={showEmptyContentWarning}
        onClose={() => setShowEmptyContentWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Email Without Content?</DialogTitle>
        <DialogContent>
          <Typography>
            This email doesn&apos;t have any content in the body. Are you sure you want to send it?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmptyContentWarning(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmEmptySend} variant="contained" color="primary">
            Send Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export const ComposeActions = React.memo(ComposeActionsComponent);
ComposeActions.displayName = 'ComposeActions';
