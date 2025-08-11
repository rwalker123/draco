'use client';

import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Draft as DraftIcon,
  MoreVert as MoreVertIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';

interface ComposeActionsProps {
  onScheduleClick?: () => void;
  onPreviewClick?: () => void;
  onDeleteDraft?: () => void;
  showAdvancedActions?: boolean;
  compact?: boolean;
}

/**
 * ComposeActions - Send, save, schedule, and other action buttons
 */
export const ComposeActions: React.FC<ComposeActionsProps> = ({
  onScheduleClick,
  onPreviewClick,
  onDeleteDraft,
  showAdvancedActions = true,
  compact = false,
}) => {
  const { state, actions } = useEmailCompose();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);

  // Handle send email
  const handleSend = useCallback(async () => {
    const success = await actions.sendEmail();
    if (success) {
      // Email sent successfully - any additional UI feedback would be handled by parent
    }
  }, [actions]);

  // Handle save draft
  const handleSaveDraft = useCallback(async () => {
    await actions.saveDraft();
  }, [actions]);

  // Handle schedule
  const handleSchedule = useCallback(() => {
    if (onScheduleClick) {
      onScheduleClick();
    }
  }, [onScheduleClick]);

  // Handle preview
  const handlePreview = useCallback(() => {
    if (onPreviewClick) {
      onPreviewClick();
    }
  }, [onPreviewClick]);

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
    if (window.confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
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

  // Determine if send is disabled
  const validation = actions.validateCompose();
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
              <Chip
                label="Unsaved"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          {/* Advanced Actions */}
          {showAdvancedActions && (
            <>
              {!compact && (
                <Button
                  startIcon={<PreviewIcon />}
                  variant="text"
                  onClick={handlePreview}
                  size="small"
                >
                  Preview
                </Button>
              )}
              
              <Tooltip title="More actions">
                <IconButton
                  onClick={handleMoreMenuOpen}
                  size="small"
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </Stack>

      {/* Send Options Menu */}
      <Menu
        anchorEl={sendMenuAnchor}
        open={Boolean(sendMenuAnchor)}
        onClose={handleSendMenuClose}
      >
        <MenuItem onClick={() => { handleSend(); handleSendMenuClose(); }}>
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
        
        <MenuItem onClick={() => { handleSchedule(); handleSendMenuClose(); }}>
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
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
      >
        {compact && (
          <MenuItem onClick={() => { handlePreview(); handleMoreMenuClose(); }}>
            <ListItemIcon>
              <PreviewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Preview Email</ListItemText>
          </MenuItem>
        )}
        
        {compact && <Divider />}
        
        <MenuItem onClick={() => { handleReset(); handleMoreMenuClose(); }}>
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

      {/* Validation Summary */}
      {!validation.isValid && validation.errors.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="error">
            Please fix {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''} before sending
          </Typography>
        </Box>
      )}
    </Box>
  );
};