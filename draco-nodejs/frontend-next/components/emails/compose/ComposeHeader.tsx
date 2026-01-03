'use client';

import React, { useCallback, useMemo } from 'react';
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
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { useAuth } from '../../../context/AuthContext';
import { SelectedRecipientsPreview } from '../recipients/SelectedRecipientsPreview';
import { validateComposeData } from '../../../types/emails/compose';
import { ContactGroup } from '../../../types/emails/recipients';

interface ComposeHeaderProps {
  showFromField?: boolean;
  showRecipientCount?: boolean;
  showValidationErrors?: boolean;
  compact?: boolean;
  onRecipientSelectionClick?: () => void;
  onCancelClick?: () => void;
  onEditGroup?: (group: ContactGroup) => void;
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
  onCancelClick,
  onEditGroup,
  hasAnyRecipientData = true,
  loading = false,
}) => {
  const { state, actions } = useEmailCompose();
  const { user } = useAuth();

  // Real-time validation for contextual error display
  const validation = useMemo(() => validateComposeData(state, state.config), [state]);

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
  const subjectError = validation.errors.find((e) => e.field === 'subject');
  const recipientError = validation.errors.find((e) => e.field === 'recipients');

  // Format sender display
  const senderDisplay = user
    ? `${user.contact?.firstName || ''} ${user.contact?.lastName || ''}`.trim() || user.userName
    : 'Unknown Sender';

  // Format scheduled date
  const formatScheduledDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 2 : 3,
        mb: 2,
        position: 'relative',
        bgcolor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      {/* Cancel Button */}
      {onCancelClick && (
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<ClearIcon />}
          onClick={onCancelClick}
          disabled={state.isSending}
          sx={{
            position: 'absolute',
            top: compact ? 8 : 12,
            right: compact ? 8 : 12,
            minWidth: 'auto',
            px: compact ? 1.5 : 2,
            borderColor: 'error.main',
            color: 'error.main',
            backgroundColor: 'background.paper',
            '&:hover': {
              borderColor: 'error.main',
              backgroundColor: (theme) =>
                alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
            },
            '&.Mui-disabled': {
              color: 'text.disabled',
              borderColor: 'divider',
              backgroundColor: 'action.hover',
            },
          }}
        >
          {compact ? '' : 'Clear'}
        </Button>
      )}

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
                {user?.contact?.email}
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
                        color: 'primary.main',
                        borderColor: 'primary.main',
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: (theme) =>
                            alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === 'dark' ? 0.12 : 0.08,
                            ),
                        },
                        '&.Mui-disabled': {
                          color: 'text.disabled',
                          borderColor: 'divider',
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      {loading ? 'Loading...' : 'Select Recipients'}
                    </Button>
                  </Box>

                  {/* Selected Recipients Preview */}
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <SelectedRecipientsPreview
                        maxVisibleChips={compact ? 4 : 8}
                        showValidationWarnings={true}
                        compact={compact}
                        onEditGroup={onEditGroup}
                      />
                    </Box>
                    {recipientError && (
                      <Tooltip title={recipientError.message} arrow>
                        <ErrorIcon color="error" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Subject Line */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Subject
            </Typography>
            {subjectError && (
              <Tooltip title={subjectError.message} arrow>
                <ErrorIcon color="error" fontSize="small" />
              </Tooltip>
            )}
          </Box>
          <TextField
            fullWidth
            placeholder="Enter email subject..."
            value={state.subject}
            onChange={handleSubjectChange}
            error={!!subjectError}
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
