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
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { useAuth } from '../../../context/AuthContext';
import { SelectedRecipientsPreview } from '../recipients/SelectedRecipientsPreview';

interface ComposeHeaderProps {
  showFromField?: boolean;
  showRecipientCount?: boolean;
  showValidationErrors?: boolean;
  compact?: boolean;
  onRecipientSelectionClick?: () => void;
  hasAnyRecipientData?: boolean;
  loading?: boolean;
}

/**
 * ComposeHeader - Subject line, sender info, and compose metadata
 */
const ComposeHeaderComponent: React.FC<ComposeHeaderProps> = ({
  showFromField = true,
  showRecipientCount = true,
  showValidationErrors = true,
  compact = false,
  onRecipientSelectionClick,
  hasAnyRecipientData = true,
  loading = false,
}) => {
  const { state, actions } = useEmailCompose();
  const { user } = useAuth();

  // Handle subject change
  const handleSubjectChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      actions.setSubject(event.target.value);
    },
    [actions],
  );

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
                {user?.email}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Recipient Selection */}
        {showRecipientCount && (
          <Box>
            <Stack spacing={2}>
              {/* Select Recipients Button and Preview */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* Select Recipients Button */}
                  <Box sx={{ minWidth: 'fit-content' }}>
                    <Button
                      variant="outlined"
                      onClick={onRecipientSelectionClick}
                      disabled={!hasAnyRecipientData && !loading}
                      startIcon={loading ? <CircularProgress size={16} /> : <SettingsIcon />}
                      sx={{
                        py: 1,
                        px: 2,
                        fontWeight: 'medium',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                        },
                      }}
                    >
                      {loading ? 'Loading...' : 'Select Recipients'}
                    </Button>
                  </Box>

                  {/* Selected Recipients Preview */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <SelectedRecipientsPreview
                      maxVisibleChips={compact ? 4 : 8}
                      showCounts={true}
                      showValidationWarnings={true}
                      compact={compact}
                    />
                  </Box>
                </Stack>
              </Box>

              {recipientError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {recipientError.message}
                </Alert>
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

        {/* Schedule Indicator */}
        {state.isScheduled && state.scheduledDate && (
          <>
            <Divider />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                icon={<ScheduleIcon />}
                label={`Scheduled: ${formatScheduledDate(state.scheduledDate)}`}
                color="warning"
                variant="outlined"
                size="small"
                onDelete={handleClearSchedule}
                deleteIcon={
                  <Tooltip title="Remove schedule">
                    <CloseIcon />
                  </Tooltip>
                }
              />
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
      </Stack>
    </Paper>
  );
};

export const ComposeHeader = React.memo(ComposeHeaderComponent);
ComposeHeader.displayName = 'ComposeHeader';
