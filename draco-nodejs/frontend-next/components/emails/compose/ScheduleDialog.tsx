'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Today as TodayIcon,
  Event as EventIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { validateComposeData } from '../../../types/emails/compose';

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule?: (date: Date) => void;
}

type ScheduleOption = 'later_today' | 'tomorrow' | 'next_week' | 'custom';

/**
 * ScheduleDialog - Modal for setting email scheduling options
 */
export const ScheduleDialog: React.FC<ScheduleDialogProps> = ({ open, onClose, onSchedule }) => {
  const { state, actions } = useEmailCompose();

  // Real-time validation for contextual error display
  const validation = useMemo(() => validateComposeData(state, state.config), [state]);

  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('custom');
  const [customDate, setCustomDate] = useState<Date | null>(
    state.scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  );
  const [error, setError] = useState<string | null>(null);

  // Quick schedule options
  const getQuickScheduleDate = useCallback(
    (option: ScheduleOption): Date => {
      const now = new Date();

      switch (option) {
        case 'later_today':
          // 6 PM today, or 2 hours from now if after 6 PM
          const laterToday = new Date(now);
          laterToday.setHours(18, 0, 0, 0);
          if (laterToday <= now) {
            return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
          }
          return laterToday;

        case 'tomorrow':
          // 9 AM tomorrow
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          return tomorrow;

        case 'next_week':
          // 9 AM next Monday
          const nextWeek = new Date(now);
          const daysUntilMonday = (8 - nextWeek.getDay()) % 7 || 7;
          nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
          nextWeek.setHours(9, 0, 0, 0);
          return nextWeek;

        default:
          return customDate || new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
    },
    [customDate],
  );

  // Handle schedule option change
  const handleScheduleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newOption = event.target.value as ScheduleOption;
      setScheduleOption(newOption);
      setError(null);

      if (newOption !== 'custom') {
        setCustomDate(getQuickScheduleDate(newOption));
      }
    },
    [getQuickScheduleDate],
  );

  // Handle custom date change
  const handleCustomDateChange = useCallback((newDate: Date | null) => {
    setCustomDate(newDate);
    setError(null);
  }, []);

  // Validate selected date
  const validateScheduleDate = useCallback((date: Date | null): string | null => {
    if (!date) {
      return 'Please select a valid date and time';
    }

    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    if (date <= minScheduleTime) {
      return 'Scheduled time must be at least 5 minutes from now';
    }

    // Don't allow scheduling more than 1 year in advance
    const maxScheduleTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (date > maxScheduleTime) {
      return 'Cannot schedule more than 1 year in advance';
    }

    return null;
  }, []);

  // Handle confirm scheduling
  const handleConfirm = useCallback(() => {
    const selectedDate =
      scheduleOption === 'custom' ? customDate : getQuickScheduleDate(scheduleOption);
    const validationError = validateScheduleDate(selectedDate);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (selectedDate) {
      actions.setScheduled(true, selectedDate);

      if (onSchedule) {
        onSchedule(selectedDate);
      }

      onClose();
    }
  }, [
    scheduleOption,
    customDate,
    getQuickScheduleDate,
    validateScheduleDate,
    actions,
    onSchedule,
    onClose,
  ]);

  // Handle cancel scheduling
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle remove scheduling
  const handleRemoveSchedule = useCallback(() => {
    actions.clearSchedule();
    onClose();
  }, [actions, onClose]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Get current scheduled date for display
  const currentSelectedDate =
    scheduleOption === 'custom' ? customDate : getQuickScheduleDate(scheduleOption);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { minHeight: 400 },
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <ScheduleIcon />
            <Typography variant="h6">Schedule Email</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Current Schedule Status */}
            {state.isScheduled && state.scheduledDate && (
              <Alert severity="info">
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2">Currently scheduled for:</Typography>
                  <Chip
                    icon={<EventIcon />}
                    label={formatDate(state.scheduledDate)}
                    size="small"
                    color="primary"
                  />
                </Stack>
              </Alert>
            )}

            {/* Schedule Options */}
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="subtitle1" fontWeight="medium">
                  When would you like to send this email?
                </Typography>
              </FormLabel>
              <RadioGroup value={scheduleOption} onChange={handleScheduleOptionChange}>
                <FormControlLabel
                  value="later_today"
                  control={<Radio />}
                  label={
                    <Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TodayIcon fontSize="small" />
                        <Typography>Later Today</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                        {formatDate(getQuickScheduleDate('later_today'))}
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  value="tomorrow"
                  control={<Radio />}
                  label={
                    <Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon fontSize="small" />
                        <Typography>Tomorrow Morning</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                        {formatDate(getQuickScheduleDate('tomorrow'))}
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  value="next_week"
                  control={<Radio />}
                  label={
                    <Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon fontSize="small" />
                        <Typography>Next Week</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                        {formatDate(getQuickScheduleDate('next_week'))}
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Choose Custom Date & Time"
                />
              </RadioGroup>
            </FormControl>

            {/* Custom Date Picker */}
            {scheduleOption === 'custom' && (
              <Box sx={{ pl: 4 }}>
                <DateTimePicker
                  label="Select Date and Time"
                  value={customDate}
                  onChange={handleCustomDateChange}
                  minDateTime={new Date(Date.now() + 5 * 60 * 1000)} // 5 minutes from now
                  maxDateTime={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
                  sx={{ width: '100%' }}
                />
              </Box>
            )}

            {/* Preview of Selected Time */}
            {currentSelectedDate && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email will be sent:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(currentSelectedDate)}
                </Typography>
              </Box>
            )}

            {/* Error Display */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* Schedule validation errors from compose state */}
            {validation.errors
              .filter((error) => error.field === 'schedule')
              .map((error, index) => (
                <Alert key={`schedule-error-${index}`} severity="error" variant="outlined">
                  {error.message}
                </Alert>
              ))}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>

          {state.isScheduled && (
            <Button onClick={handleRemoveSchedule} color="error" variant="outlined">
              Remove Schedule
            </Button>
          )}

          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!!error || !currentSelectedDate}
          >
            Schedule Email
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
