'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { getWorkout } from '../../services/workoutService';
import { WorkoutType } from '@draco/shared-schemas';
import { WorkoutRegistrationForm } from './WorkoutRegistrationForm';
import { Event } from '@mui/icons-material';
import { listAccountFields } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { FieldDetailsCard, type FieldDetails } from '../fields/FieldDetailsCard';
import ButtonBase from '@mui/material/ButtonBase';

interface WorkoutDisplayProps {
  accountId: string;
  workoutId: string;
  token?: string;
  showRegistrationButton?: boolean;
  compact?: boolean;
  onWorkoutLoaded?: (workout: WorkoutType) => void;
}

export const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({
  accountId,
  workoutId,
  token,
  showRegistrationButton = true,
  compact = false,
  onWorkoutLoaded,
}) => {
  const [workout, setWorkout] = useState<WorkoutType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [fields, setFields] = useState<Record<string, FieldDetails>>({});
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const apiClient = useApiClient();

  const fetchWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkout(accountId, workoutId, token);
      setWorkout(data);
      onWorkoutLoaded?.(data);
    } catch (error) {
      console.error('Failed to fetch workout:', error);
      setError('Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [accountId, workoutId, token, onWorkoutLoaded]);

  const fetchFields = useCallback(async () => {
    try {
      const result = await listAccountFields({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load fields');
      const mappedFields: Record<string, FieldDetails> = {};

      data.fields.forEach((field) => {
        if (!field.id) {
          return;
        }

        mappedFields[field.id] = {
          id: field.id,
          name: field.name ?? field.shortName ?? null,
          shortName: field.shortName ?? null,
          address: field.address ?? null,
          city: field.city ?? null,
          state: field.state ?? null,
          zip: field.zip ?? null,
          rainoutNumber: field.rainoutNumber ?? null,
          comment: field.comment ?? null,
          directions: field.directions ?? null,
          latitude: (field.latitude as string | number | null | undefined) ?? null,
          longitude: (field.longitude as string | number | null | undefined) ?? null,
        };
      });

      setFields(mappedFields);
    } catch (err) {
      console.error('Error fetching fields:', err);
      // Don't set error for fields - it's not critical
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    fetchWorkout();
    fetchFields();
  }, [fetchWorkout, fetchFields]);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return { formattedDate, formattedTime };
  }, []);

  const getFieldDetails = useCallback(
    (fieldId: string | null | undefined): FieldDetails | null => {
      if (!fieldId) {
        return workout?.field ?? null;
      }

      return fields[fieldId] ?? workout?.field ?? null;
    },
    [fields, workout?.field],
  );

  const getFieldName = useCallback(
    (fieldId: string | null | undefined) => {
      const details = getFieldDetails(fieldId);
      return details?.name ?? details?.shortName ?? 'TBD';
    },
    [getFieldDetails],
  );

  const handleOpenFieldDialog = useCallback(
    (fieldId: string | null | undefined) => {
      if (!fieldId && !workout?.field?.id) {
        return;
      }

      const targetId = fieldId ?? workout?.field?.id ?? null;
      if (!targetId) {
        return;
      }

      setSelectedFieldId(targetId);
      setFieldDialogOpen(true);
    },
    [workout?.field?.id],
  );

  const handleCloseFieldDialog = useCallback(() => {
    setFieldDialogOpen(false);
  }, []);

  const selectedFieldDetails = useMemo(() => {
    if (!fieldDialogOpen) {
      return null;
    }
    return getFieldDetails(selectedFieldId ?? workout?.field?.id ?? null);
  }, [fieldDialogOpen, getFieldDetails, selectedFieldId, workout?.field?.id]);

  const handleAddToCalendar = () => {
    if (!workout) return;

    // Create calendar event data
    const eventTitle = workout.workoutDesc;
    const eventStart = new Date(workout.workoutDate);
    const eventEnd = new Date(workout.workoutDate); // Assuming it's a single-day event
    const eventLocation = getFieldName(workout.field?.id || null);
    const eventDescription = workout.comments || '';
    const eventUrl = `/account/${accountId}/workouts`;

    // Format dates for iCal format
    const formatDateForICal = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    };

    // Create iCal content
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Draco//Workout Calendar//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDateForICal(eventStart)}`,
      `DTEND:${formatDateForICal(eventEnd)}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${eventDescription}`,
      `LOCATION:${eventLocation}`,
      `URL:${window.location.origin}${eventUrl}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Create and download the .ics file
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading workout...
        </Typography>
      </Box>
    );
  }

  if (error || !workout) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error || 'Workout not found'}
      </Alert>
    );
  }

  return (
    <>
      <Paper sx={{ p: compact ? 2 : 4 }}>
        {/* Title and Calendar Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            mb: 3,
            gap: 2,
          }}
        >
          <Typography
            variant={compact ? 'h5' : 'h4'}
            component="h2"
            sx={{
              color: 'primary.main',
              fontWeight: 'bold',
              textAlign: 'center',
              pb: 2,
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {workout.workoutDesc}
          </Typography>
          <Tooltip title="Add to Calendar">
            <IconButton
              color="primary"
              sx={{
                mt: 0,
                alignSelf: 'flex-start',
              }}
              onClick={handleAddToCalendar}
            >
              <Event />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Date & Field Information */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 3,
            justifyContent: 'center',
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Date & Time
            </Typography>
            {(() => {
              const { formattedDate, formattedTime } = formatDateTime(workout.workoutDate);
              return (
                <>
                  <Typography variant="body1">{formattedDate}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formattedTime}
                  </Typography>
                </>
              );
            })()}
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Field
            </Typography>
            <ButtonBase
              onClick={() => handleOpenFieldDialog(workout.field?.id ?? null)}
              sx={{
                display: 'inline-flex',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: 'primary.main',
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              {getFieldName(workout.field?.id ?? null)}
            </ButtonBase>
          </Box>
        </Box>

        {/* Workout Description */}
        {workout.comments && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                '& .editor-text-bold': { fontWeight: 'bold' },
                '& .editor-text-italic': { fontStyle: 'italic' },
                '& .editor-text-underline': { textDecoration: 'underline' },
                '& .editor-list-ul': { listStyleType: 'disc', margin: 0, paddingLeft: '20px' },
                '& .editor-list-ol': {
                  listStyleType: 'decimal',
                  margin: 0,
                  paddingLeft: '20px',
                },
                '& .editor-list-item': { margin: '4px 0' },
                '& .editor-heading-h1': {
                  fontSize: '2em',
                  fontWeight: 'bold',
                  margin: '16px 0 8px 0',
                },
                '& .editor-heading-h2': {
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                  margin: '14px 0 6px 0',
                },
                '& .editor-heading-h3': {
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  margin: '12px 0 6px 0',
                },
                '& .editor-heading-h4': {
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  margin: '10px 0 4px 0',
                },
                '& .editor-heading-h5': {
                  fontSize: '1em',
                  fontWeight: 'bold',
                  margin: '8px 0 4px 0',
                },
                '& .editor-heading-h6': {
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  margin: '8px 0 4px 0',
                },
              }}
              dangerouslySetInnerHTML={{ __html: workout.comments }}
            />
          </Box>
        )}

        {/* Registration Button */}
        {showRegistrationButton && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" onClick={() => setRegistrationOpen(true)}>
              Register for Workout
            </Button>
          </Box>
        )}
      </Paper>

      {/* Registration Dialog */}
      {workout && showRegistrationButton && (
        <Dialog
          open={registrationOpen}
          onClose={() => setRegistrationOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Register for Workout</DialogTitle>
          <DialogContent>
            <WorkoutRegistrationForm
              accountId={accountId}
              workoutId={workout.id}
              onSubmit={async (_data) => {
                try {
                  // This will be implemented when we add the createRegistration service call
                  console.log('Registration data:', _data);
                  setRegistrationOpen(false);
                } catch (error) {
                  console.error('Failed to register:', error);
                }
              }}
              onCancel={() => setRegistrationOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <FieldDetailsDialog
        open={fieldDialogOpen}
        onClose={handleCloseFieldDialog}
        field={selectedFieldDetails}
      />
    </>
  );
};

const FieldDetailsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  field: FieldDetails | null;
}> = ({ open, onClose, field }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: 0 }}>
        <FieldDetailsCard
          field={field}
          placeholderTitle={field?.name ?? 'Field details unavailable'}
          placeholderDescription="Field information is not available for this workout."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
