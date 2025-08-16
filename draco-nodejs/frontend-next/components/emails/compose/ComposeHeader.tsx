'use client';

import React, { useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Description as TemplateIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { useAuth } from '../../../context/AuthContext';
import { useAccount } from '../../../context/AccountContext';

interface ComposeHeaderProps {
  showFromField?: boolean;
  showRecipientCount?: boolean;
  showValidationErrors?: boolean;
  compact?: boolean;
}

/**
 * ComposeHeader - Subject line, sender info, and compose metadata
 */
const ComposeHeaderComponent: React.FC<ComposeHeaderProps> = ({
  showFromField = true,
  showRecipientCount = true,
  showValidationErrors = true,
  compact = false,
}) => {
  const { state, actions } = useEmailCompose();
  const { user } = useAuth();
  const { currentAccount } = useAccount();

  // Handle subject change
  const handleSubjectChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      actions.setSubject(event.target.value);
    },
    [actions],
  );

  // Clear template
  const handleClearTemplate = useCallback(() => {
    actions.clearTemplate();
  }, [actions]);

  // Clear schedule
  const handleClearSchedule = useCallback(() => {
    actions.clearSchedule();
  }, [actions]);

  // Get validation errors for header fields
  const subjectError = state.errors.find((e) => e.field === 'subject');
  const recipientError = state.errors.find((e) => e.field === 'recipients');

  // Format sender display
  const senderDisplay = user
    ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username
    : 'Unknown Sender';

  // Format account display
  const accountDisplay = currentAccount?.name || 'Unknown Account';

  // Format recipient count
  const recipientCount = state.recipientState?.totalRecipients || 0;

  // Format scheduled date
  const formatScheduledDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <Paper variant="outlined" sx={{ p: compact ? 2 : 3, mb: 2 }}>
      <Stack spacing={compact ? 2 : 3}>
        {/* Sender Information */}
        {showFromField && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                From
              </Typography>
            </Stack>
            <Box sx={{ pl: compact ? 2 : 4 }}>
              <Typography variant="body1" fontWeight="medium">
                {senderDisplay}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email && `${user.email} • `}
                {accountDisplay}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Recipient Count */}
        {showRecipientCount && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                To:
              </Typography>
              <Chip
                size="small"
                label={`${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`}
                color={recipientCount === 0 ? 'error' : 'primary'}
                variant={recipientCount === 0 ? 'outlined' : 'filled'}
              />
              {recipientError && (
                <Tooltip title={recipientError.message}>
                  <InfoIcon color="error" fontSize="small" />
                </Tooltip>
              )}
            </Stack>
          </Box>
        )}

        {/* Subject Line */}
        <Box>
          <TextField
            fullWidth
            label="Subject"
            placeholder="Enter email subject..."
            value={state.subject}
            onChange={handleSubjectChange}
            error={!!subjectError}
            helperText={subjectError?.message}
            disabled={state.isSending}
            size={compact ? 'small' : 'medium'}
            InputProps={{
              sx: {
                fontSize: compact ? '0.875rem' : '1rem',
                fontWeight: state.subject ? 500 : 'normal',
              },
            }}
          />
        </Box>

        {/* Template and Schedule Indicators */}
        {(state.selectedTemplate || state.isScheduled) && (
          <>
            <Divider />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {/* Template Indicator */}
              {state.selectedTemplate && (
                <Chip
                  icon={<TemplateIcon />}
                  label={`Template: ${state.selectedTemplate.name}`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                  onDelete={handleClearTemplate}
                  deleteIcon={
                    <Tooltip title="Remove template">
                      <ClearIcon />
                    </Tooltip>
                  }
                />
              )}

              {/* Schedule Indicator */}
              {state.isScheduled && state.scheduledDate && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`Scheduled: ${formatScheduledDate(state.scheduledDate)}`}
                  color="warning"
                  variant="outlined"
                  size="small"
                  onDelete={handleClearSchedule}
                  deleteIcon={
                    <Tooltip title="Remove schedule">
                      <ClearIcon />
                    </Tooltip>
                  }
                />
              )}
            </Stack>
          </>
        )}

        {/* Validation Errors */}
        {showValidationErrors && state.errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Stack spacing={0.5}>
              {state.errors
                .filter((error) => ['subject', 'recipients', 'general'].includes(error.field))
                .map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error.message}
                  </Typography>
                ))}
            </Stack>
          </Alert>
        )}

        {/* Draft Status */}
        {state.isDraft && state.lastSaved && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Draft saved{' '}
              {new Intl.DateTimeFormat('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(state.lastSaved)}
            </Typography>
          </Box>
        )}

        {/* Unsaved Changes Indicator */}
        {state.hasUnsavedChanges && !state.isSending && (
          <Box>
            <Typography variant="caption" color="warning.main">
              You have unsaved changes
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export const ComposeHeader = React.memo(ComposeHeaderComponent);
ComposeHeader.displayName = 'ComposeHeader';
