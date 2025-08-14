'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getWorkout } from '../../services/workoutService';
import { Workout } from '../../types/workouts';
import { WorkoutRegistrationForm } from './WorkoutRegistrationForm';
import { Home, NavigateNext, Event } from '@mui/icons-material';
import AccountPageHeader from '../AccountPageHeader';

export const WorkoutDetails: React.FC = () => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);
  const { accountId, workoutId } = useParams();
  const { token } = useAuth();
  const router = useRouter();

  const fetchWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkout(accountId as string, workoutId as string, token || undefined);
      setWorkout(data);
    } catch (error) {
      console.error('Failed to fetch workout:', error);
      setError('Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [accountId, workoutId, token]);

  const fetchFields = useCallback(async () => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/fields`);
      const data = await response.json();
      setFields(data.data.fields);
    } catch (err) {
      console.error('Error fetching fields:', err);
      // Don't set error for fields - it's not critical
    }
  }, [accountId]);

  useEffect(() => {
    fetchWorkout();
    fetchFields();
  }, [fetchWorkout, fetchFields]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFieldName = (fieldId: string | null) => {
    if (!fieldId) return 'TBD';
    const field = fields.find((f) => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId as string}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Preview Workout
            </Typography>
          </Box>
        </AccountPageHeader>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workout preview...
          </Typography>
        </Container>
      </main>
    );
  }

  if (error || !workout) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId as string}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Preview Workout
            </Typography>
          </Box>
        </AccountPageHeader>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error || 'Workout not found'}</Alert>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId as string}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Preview Workout
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
            <Link
              component="button"
              variant="body2"
              color="inherit"
              onClick={() => router.push(`/account/${accountId}/workouts`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Home fontSize="small" />
              Workouts
            </Link>
            <Typography variant="body2" color="text.primary">
              Preview
            </Typography>
          </Breadcrumbs>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {workout && (
          <Paper sx={{ p: 4 }}>
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
                variant="h4"
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
                    mt: 0, // Remove top margin to align with top of text
                    alignSelf: 'flex-start',
                  }}
                  onClick={() => {
                    if (workout) {
                      // Create calendar event data
                      const eventTitle = workout.workoutDesc;
                      const eventStart = new Date(workout.workoutDate);
                      const eventEnd = new Date(workout.workoutDate); // Assuming it's a single-day event
                      const eventLocation = getFieldName(workout.fieldId || null);
                      const eventDescription = workout.comments || '';
                      const eventUrl = `/account/${accountId}/workouts/${workout.id}`;

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
                    }
                  }}
                >
                  <Event />
                </IconButton>
              </Tooltip>
            </Box>

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
                <Typography variant="body1">{formatDate(workout.workoutDate)}</Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Field
                </Typography>
                <Typography variant="body1">{getFieldName(workout.fieldId || null)}</Typography>
              </Box>
            </Box>

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

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" size="large" onClick={() => setRegistrationOpen(true)}>
                Register for Workout
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Registration Dialog */}
      {workout && (
        <Dialog
          open={registrationOpen}
          onClose={() => setRegistrationOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Register for Workout</DialogTitle>
          <DialogContent>
            <WorkoutRegistrationForm
              accountId={accountId as string}
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
    </main>
  );
};
