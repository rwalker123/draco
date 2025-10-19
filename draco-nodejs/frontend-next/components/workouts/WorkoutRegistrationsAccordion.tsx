'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAddAlt1 as PersonAddIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  EmailOutlined as EmailOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import type { WorkoutSummaryType } from '@draco/shared-schemas';
import { deleteWorkout, listWorkouts } from '../../services/workoutService';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { UI_TIMEOUTS } from '../../constants/timeoutConstants';
import { WorkoutDetailsDialog } from './dialogs/WorkoutDetailsDialog';
import { WorkoutEmailDialog } from './dialogs/WorkoutEmailDialog';
import ButtonBase from '@mui/material/ButtonBase';
import { listAccountFields } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { FieldDetailsCard, type FieldDetails } from '../fields/FieldDetailsCard';

interface WorkoutRegistrationsAccordionProps {
  accountId: string;
  onCreateWorkout: () => void;
  onEditWorkout: (workoutId: string) => void;
  onPreviewWorkout: (workoutId: string) => void;
  refreshKey?: number;
}

const formatWorkoutDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const WorkoutRegistrationsAccordion: React.FC<WorkoutRegistrationsAccordionProps> = ({
  accountId,
  onCreateWorkout,
  onEditWorkout,
  onPreviewWorkout,
  refreshKey = 0,
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [workouts, setWorkouts] = useState<WorkoutSummaryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<WorkoutSummaryType | null>(null);
  const [detailsDialogState, setDetailsDialogState] = useState<{
    open: boolean;
    workout: WorkoutSummaryType | null;
    initialAction: 'createRegistration' | null;
  }>({ open: false, workout: null, initialAction: null });
  const [emailDialogState, setEmailDialogState] = useState<{
    open: boolean;
    workout: WorkoutSummaryType | null;
  }>({ open: false, workout: null });
  const [fieldDialogState, setFieldDialogState] = useState<{
    open: boolean;
    fieldId: string | null;
    fallbackField: FieldDetails | null;
  }>({ open: false, fieldId: null, fallbackField: null });
  const [fields, setFields] = useState<Record<string, FieldDetails>>({});

  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), UI_TIMEOUTS.SUCCESS_MESSAGE_TIMEOUT_MS);
  }, []);

  const showErrorMessage = useCallback((message: string) => {
    setOperationError(message);
    window.setTimeout(() => setOperationError(null), UI_TIMEOUTS.ERROR_MESSAGE_TIMEOUT_MS);
  }, []);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listWorkouts(accountId, true, token || undefined);
      const sorted = [...data].sort(
        (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime(),
      );
      setWorkouts(sorted);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, [accountId, token]);

  useEffect(() => {
    void fetchWorkouts();
  }, [fetchWorkouts, refreshKey]);

  const fetchFields = useCallback(async () => {
    try {
      const result = await listAccountFields({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load fields');
      const mapped: Record<string, FieldDetails> = {};

      data.fields.forEach((field) => {
        if (!field.id) {
          return;
        }

        mapped[field.id] = {
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

      setFields(mapped);
    } catch (err) {
      console.error('Error fetching fields:', err);
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    void fetchFields();
  }, [fetchFields]);

  const handleOpenDetails = useCallback(
    (workout: WorkoutSummaryType, initialAction: 'createRegistration' | null = null) => {
      setDetailsDialogState({ open: true, workout, initialAction });
    },
    [],
  );

  const handleCloseDetails = useCallback(() => {
    setDetailsDialogState({ open: false, workout: null, initialAction: null });
  }, []);

  const handleRegistrationsChange = useCallback(
    ({ workoutId, registrationCount }: { workoutId: string; registrationCount: number }) => {
      setWorkouts((prev) =>
        prev.map((workout) =>
          workout.id === workoutId ? { ...workout, registrationCount } : workout,
        ),
      );
      setDetailsDialogState((prev) => {
        if (!prev.workout || prev.workout.id !== workoutId) {
          return prev;
        }

        return {
          ...prev,
          workout: { ...prev.workout, registrationCount },
        };
      });
    },
    [],
  );

  const handlePreviewAction = useCallback(
    (workout: WorkoutSummaryType) => onPreviewWorkout(workout.id),
    [onPreviewWorkout],
  );

  const handleEditAction = useCallback(
    (workout: WorkoutSummaryType) => onEditWorkout(workout.id),
    [onEditWorkout],
  );

  const handleAddRegistrationAction = useCallback(
    (workout: WorkoutSummaryType) => handleOpenDetails(workout, 'createRegistration'),
    [handleOpenDetails],
  );

  const handleDeleteAction = useCallback((workout: WorkoutSummaryType) => {
    setWorkoutToDelete(workout);
    setDeleteDialogOpen(true);
  }, []);

  const handleEmailAction = useCallback((workout: WorkoutSummaryType) => {
    setEmailDialogState({ open: true, workout });
  }, []);

  const handleCloseEmailDialog = useCallback(() => {
    setEmailDialogState({ open: false, workout: null });
  }, []);

  const getFieldDetails = useCallback(
    (workout: WorkoutSummaryType): FieldDetails | null => {
      const fieldId = workout.field?.id ?? null;
      if (fieldId && fields[fieldId]) {
        return fields[fieldId];
      }

      if (workout.field) {
        return {
          id: workout.field.id ?? null,
          name: workout.field.name ?? null,
          shortName: workout.field.shortName ?? null,
          address: workout.field.address ?? null,
          city: workout.field.city ?? null,
          state: workout.field.state ?? null,
          zip: workout.field.zip ?? null,
          rainoutNumber: workout.field.rainoutNumber ?? null,
          comment: workout.field.comment ?? null,
          directions: workout.field.directions ?? null,
          latitude: workout.field.latitude ?? null,
          longitude: workout.field.longitude ?? null,
        };
      }

      return null;
    },
    [fields],
  );

  const getFieldName = useCallback(
    (workout: WorkoutSummaryType) => {
      const details = getFieldDetails(workout);
      return details?.name ?? details?.shortName ?? 'TBD';
    },
    [getFieldDetails],
  );

  const handleFieldDialogOpen = useCallback(
    (workout: WorkoutSummaryType) => {
      const fieldId = workout.field?.id ?? null;
      const fallbackField = getFieldDetails(workout);

      if (!fieldId && !fallbackField) {
        return;
      }

      setFieldDialogState({ open: true, fieldId, fallbackField });
    },
    [getFieldDetails],
  );

  const handleFieldDialogClose = useCallback(() => {
    setFieldDialogState({ open: false, fieldId: null, fallbackField: null });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!workoutToDelete) {
      return;
    }

    try {
      await deleteWorkout(accountId, workoutToDelete.id, token || undefined);
      setWorkouts((prev) => prev.filter((workout) => workout.id !== workoutToDelete.id));
      showSuccessMessage('Workout deleted successfully');
    } catch (err) {
      console.error('Error deleting workout:', err);
      showErrorMessage('Failed to delete workout');
    } finally {
      setDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    }
  }, [accountId, workoutToDelete, token, showSuccessMessage, showErrorMessage]);

  const renderTableContent = useMemo(() => {
    if (loading) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workouts...
          </Typography>
        </Box>
      );
    }

    if (workouts.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No workouts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first workout to get started.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateWorkout}>
            Create Workout
          </Button>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Workout</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Field</TableCell>
              <TableCell align="center">Registrations</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workouts.map((workout) => (
              <TableRow key={workout.id} hover>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {workout.workoutDesc}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {formatWorkoutDate(workout.workoutDate)}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {workout.field?.id || getFieldDetails(workout) ? (
                    <ButtonBase
                      onClick={() => handleFieldDialogOpen(workout)}
                      sx={{
                        display: 'inline-flex',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        color: 'primary.main',
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      {getFieldName(workout)}
                    </ButtonBase>
                  ) : (
                    <Chip label="TBD" size="small" variant="outlined" color="secondary" />
                  )}
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="View registrations">
                    <IconButton size="small" onClick={() => handleOpenDetails(workout)}>
                      <Badge badgeContent={workout.registrationCount || 0} color="primary">
                        <PeopleIcon color="action" fontSize="small" />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Email registrants">
                    <IconButton
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => handleEmailAction(workout)}
                    >
                      <EmailOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Preview workout">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePreviewAction(workout);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit workout">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditAction(workout);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add registration">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddRegistrationAction(workout);
                      }}
                    >
                      <PersonAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete workout">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteAction(workout);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [
    loading,
    workouts,
    onCreateWorkout,
    handlePreviewAction,
    handleEditAction,
    handleAddRegistrationAction,
    handleDeleteAction,
    handleOpenDetails,
    handleEmailAction,
    handleFieldDialogOpen,
    getFieldDetails,
    getFieldName,
  ]);

  return (
    <Container maxWidth="xl">
      {successMessage ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      ) : null}

      {operationError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOperationError(null)}>
          {operationError}
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {renderTableContent}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Workout"
        message={`Are you sure you want to delete the workout "${workoutToDelete?.workoutDesc}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonColor="error"
      />

      <WorkoutDetailsDialog
        accountId={accountId}
        workout={detailsDialogState.workout}
        open={detailsDialogState.open}
        onClose={handleCloseDetails}
        onSuccess={showSuccessMessage}
        onError={showErrorMessage}
        onRegistrationsChange={handleRegistrationsChange}
        initialAction={detailsDialogState.initialAction ?? undefined}
      />

      <WorkoutEmailDialog
        accountId={accountId}
        workout={emailDialogState.workout}
        open={emailDialogState.open}
        onClose={handleCloseEmailDialog}
        onSuccess={showSuccessMessage}
        onError={showErrorMessage}
      />

      <Dialog open={fieldDialogState.open} onClose={handleFieldDialogClose} fullWidth maxWidth="sm">
        <DialogContent sx={{ p: 0 }}>
          <FieldDetailsCard
            field={
              fieldDialogState.fieldId
                ? (fields[fieldDialogState.fieldId] ?? fieldDialogState.fallbackField)
                : fieldDialogState.fallbackField
            }
            placeholderTitle={fieldDialogState.fallbackField?.name ?? 'Field details unavailable'}
            placeholderDescription="Field information is not available for this workout."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleFieldDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
