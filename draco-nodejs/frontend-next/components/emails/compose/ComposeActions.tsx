'use client';

import React, { useState } from 'react';
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

  const handleSend = async () => {
    try {
      if (onBeforeSend) {
        onBeforeSend();
      }

      const currentContent = editorRef?.current?.getSanitizedContent?.() || '';
      if (!currentContent || !currentContent.trim()) {
        setShowEmptyContentWarning(true);
        return;
      }
      const success = await actions.sendEmail();
      if (success) {
      }
    } catch (error) {
      console.warn('Unexpected error in handleSend:', error);
    }
  };

  const handleConfirmEmptySend = async () => {
    setShowEmptyContentWarning(false);
    if (onBeforeSend) {
      onBeforeSend();
    }
    const success = await actions.sendEmail();
    if (success) {
    }
  };

  const handleSchedule = () => {
    if (onScheduleClick) {
      onScheduleClick();
    }
  };

  const handleSendMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSendMenuAnchor(event.currentTarget);
  };

  const handleSendMenuClose = () => {
    setSendMenuAnchor(null);
  };

  const validation = validateComposeData(state, state.config);
  const canSend = validation.isValid && !state.isSending && !state.isLoading;
  const schedulingEnabled = state.config.allowScheduling !== false;

  const recipientCount = state.recipientState?.totalRecipients || 0;

  return (
    <Box>
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

      <Stack
        direction={compact ? 'column' : 'row'}
        spacing={2}
        alignItems={compact ? 'stretch' : 'center'}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1}>
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
            {schedulingEnabled && (
              <Button
                size={compact ? 'small' : 'medium'}
                onClick={handleSendMenuOpen}
                disabled={!canSend}
              >
                <ArrowDownIcon />
              </Button>
            )}
          </ButtonGroup>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" />
      </Stack>

      {schedulingEnabled && (
        <Menu
          anchorEl={sendMenuAnchor}
          open={Boolean(sendMenuAnchor)}
          onClose={handleSendMenuClose}
        >
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
      )}

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

export const ComposeActions = ComposeActionsComponent;
