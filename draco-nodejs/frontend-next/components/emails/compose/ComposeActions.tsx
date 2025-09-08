'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Stack,
  Typography,
  Tooltip,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Edit as DraftIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { validateComposeData } from '../../../types/emails/compose';

interface ComposeActionsProps {
  onScheduleClick?: () => void;
  onDeleteDraft?: () => void;
  showAdvancedActions?: boolean;
  compact?: boolean;
  onBeforeSend?: () => void;
  onBeforeSave?: () => void;
}

/**
 * ComposeActions - Send, save, schedule, and other action buttons
 */
const ComposeActionsComponent: React.FC<ComposeActionsProps> = ({
  onScheduleClick,
  onDeleteDraft,
  showAdvancedActions = true,
  compact = false,
  onBeforeSend,
  onBeforeSave,
}) => {
  const { state, actions } = useEmailCompose();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);
  const [showEmptyContentWarning, setShowEmptyContentWarning] = useState(false);

  // Handle send email
  const handleSend = useCallback(async () => {
    // Check for empty content and show warning dialog
    if (!state.content || !state.content.trim()) {
      setShowEmptyContentWarning(true);
      return;
    }

    try {
      // Sync editor content before sending
      if (onBeforeSend) {
        onBeforeSend();
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
  }, [actions, state.content, onBeforeSend]);

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

  // Handle save draft
  const handleSaveDraft = useCallback(async () => {
    // Sync editor content before saving
    if (onBeforeSave) {
      onBeforeSave();
    }
    await actions.saveDraft();
  }, [actions, onBeforeSave]);

  // Handle schedule
  const handleSchedule = useCallback(() => {
    if (onScheduleClick) {
      onScheduleClick();
    }
  }, [onScheduleClick]);

  // Handle delete draft
  const handleDeleteDraft = useCallback(() => {
    actions.clearDraft();
    if (onDeleteDraft) {
      onDeleteDraft();
    }
    setMoreMenuAnchor(null);
  }, [actions, onDeleteDraft]);

  // Handle reset/clear
  const handleReset = useCallback(() => {
    if (
      window.confirm('Are you sure you want to clear all content? This action cannot be undone.')
    ) {
      actions.reset();
    }
    setMoreMenuAnchor(null);
  }, [actions]);

  // Menu handlers
  const handleMoreMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  }, []);

  const handleMoreMenuClose = useCallback(() => {
    setMoreMenuAnchor(null);
  }, []);

  const handleSendMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSendMenuAnchor(event.currentTarget);
  }, []);

  const handleSendMenuClose = useCallback(() => {
    setSendMenuAnchor(null);
  }, []);

  // Determine if send is disabled (pure validation to avoid dispatch in render)
  const validation = useMemo(() => validateComposeData(state, state.config), [state]);
  const canSend = validation.isValid && !state.isSending && !state.isLoading;
  const canSave = !state.isSending && !state.isLoading;

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

          {/* Save Draft */}
          <Button
            startIcon={<SaveIcon />}
            variant="outlined"
            onClick={handleSaveDraft}
            disabled={!canSave}
            size={compact ? 'small' : 'medium'}
          >
            {state.isDraft ? 'Update Draft' : 'Save Draft'}
          </Button>

          {/* Schedule Button */}
          {!state.isScheduled && (
            <Button
              startIcon={<ScheduleIcon />}
              variant="outlined"
              onClick={handleSchedule}
              disabled={!canSend}
              size={compact ? 'small' : 'medium'}
            >
              Schedule
            </Button>
          )}
        </Stack>

        {/* Secondary Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Status Indicators */}
          <Stack direction="row" spacing={1}>
            {state.isDraft && (
              <Chip
                icon={<DraftIcon />}
                label="Draft"
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}

            {state.hasUnsavedChanges && (
              <Chip label="Unsaved" size="small" color="warning" variant="outlined" />
            )}
          </Stack>

          {/* Advanced Actions */}
          {showAdvancedActions && (
            <>
              <Tooltip title="More actions">
                <IconButton onClick={handleMoreMenuOpen} size="small">
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
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

      {/* More Actions Menu */}
      <Menu anchorEl={moreMenuAnchor} open={Boolean(moreMenuAnchor)} onClose={handleMoreMenuClose}>
        <MenuItem
          onClick={() => {
            handleReset();
            handleMoreMenuClose();
          }}
        >
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear All</ListItemText>
        </MenuItem>

        {state.isDraft && (
          <MenuItem onClick={handleDeleteDraft}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Draft</ListItemText>
          </MenuItem>
        )}
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
