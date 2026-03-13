'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationSnackbar from '../../common/NotificationSnackbar';
import { useAuth } from '../../../context/AuthContext';
import type {
  WorkoutSummaryType,
  WorkoutRegistrationType,
  UpsertWorkoutRegistrationType,
} from '@draco/shared-schemas';
import { EditIconButton, DeleteIconButton } from '../../common/ActionIconButtons';
import {
  listWorkoutRegistrations,
  createWorkoutRegistration,
  updateWorkoutRegistration,
  deleteWorkoutRegistration,
} from '../../../services/workoutService';
import { WorkoutRegistrationForm } from '../WorkoutRegistrationForm';
import ConfirmDeleteDialog from '../../social/ConfirmDeleteDialog';
import { formatPhoneNumber } from '../../../utils/phoneNumber';

interface WorkoutDetailsDialogProps {
  accountId: string;
  workout: WorkoutSummaryType | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onRegistrationsChange?: (params: { workoutId: string; registrationCount: number }) => void;
  initialAction?: 'createRegistration';
}

export const WorkoutDetailsDialog: React.FC<WorkoutDetailsDialogProps> = ({
  accountId,
  workout,
  open,
  onClose,
  onSuccess,
  onError,
  onRegistrationsChange,
  initialAction,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState<WorkoutRegistrationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [managerFilter, setManagerFilter] = useState<boolean | null>(null);
  const { notification, showNotification, hideNotification } = useNotifications();
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<WorkoutRegistrationType | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<WorkoutRegistrationType | null>(
    null,
  );
  const [pendingInitialAction, setPendingInitialAction] = useState<'createRegistration' | null>(
    null,
  );

  const workoutId = workout?.id ?? null;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const applySuccessMessage = (message: string) => {
    showNotification(message, 'success');
    onSuccess?.(message);
  };

  const applyErrorMessage = (message: string) => {
    showNotification(message, 'error');
    onError?.(message);
  };

  useEffect(() => {
    if (!open) {
      setRegistrations([]);
      setSearchTerm('');
      setManagerFilter(null);
      hideNotification();
      setPendingInitialAction(null);
      return;
    }

    if (!workoutId) {
      return;
    }

    setPendingInitialAction(initialAction ?? null);

    const controller = new AbortController();

    const loadRegistrations = async () => {
      try {
        setLoading(true);
        hideNotification();
        const data = await listWorkoutRegistrations(
          accountId,
          workoutId,
          token || undefined,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setRegistrations(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error loading workout registrations:', error);
        showNotification('Failed to load registrations', 'error');
        onErrorRef.current?.('Failed to load registrations');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadRegistrations();

    return () => {
      controller.abort();
    };
  }, [open, accountId, workoutId, token, initialAction, showNotification, hideNotification]);

  useEffect(() => {
    if (open && pendingInitialAction === 'createRegistration') {
      setEditingRegistration(null);
      setRegistrationDialogOpen(true);
      setPendingInitialAction(null);
    }
  }, [open, pendingInitialAction]);

  const filteredRegistrations = registrations.filter((registration) => {
    const matchesSearch =
      !searchTerm ||
      registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.positions?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesManager = managerFilter === null || registration.isManager === managerFilter;

    return matchesSearch && matchesManager;
  });

  const handleCreateRegistration = () => {
    setEditingRegistration(null);
    setRegistrationDialogOpen(true);
  };

  const handleEditRegistration = (registration: WorkoutRegistrationType) => {
    setEditingRegistration(registration);
    setRegistrationDialogOpen(true);
  };

  const handleCloseRegistrationDialog = () => {
    setRegistrationDialogOpen(false);
    setEditingRegistration(null);
  };

  const handleSaveRegistration = async (data: UpsertWorkoutRegistrationType) => {
    if (!workoutId) {
      return;
    }

    try {
      setRegistrationSaving(true);
      hideNotification();

      if (editingRegistration) {
        const updatedRegistration = await updateWorkoutRegistration(
          accountId,
          workoutId,
          editingRegistration.id,
          data,
          token || undefined,
        );

        setRegistrations((prev) =>
          prev.map((registration) =>
            registration.id === updatedRegistration.id ? updatedRegistration : registration,
          ),
        );
        applySuccessMessage('Registration updated successfully');
      } else {
        const newRegistration = await createWorkoutRegistration(
          accountId,
          workoutId,
          data,
          token || undefined,
        );

        setRegistrations((prev) => [...prev, newRegistration]);
        applySuccessMessage('Registration created successfully');
      }

      onRegistrationsChange?.({
        workoutId,
        registrationCount: editingRegistration ? registrations.length : registrations.length + 1,
      });
      handleCloseRegistrationDialog();
    } catch (error) {
      console.error('Error saving registration:', error);
      applyErrorMessage('Failed to save registration');
    } finally {
      setRegistrationSaving(false);
    }
  };

  const handleDeleteRegistration = (registration: WorkoutRegistrationType) => {
    setRegistrationToDelete(registration);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRegistration = async () => {
    if (!workoutId || !registrationToDelete) {
      return;
    }

    try {
      await deleteWorkoutRegistration(
        accountId,
        workoutId,
        registrationToDelete.id,
        token || undefined,
      );
      setRegistrations((prev) =>
        prev.filter((registration) => registration.id !== registrationToDelete.id),
      );
      applySuccessMessage('Registration deleted successfully');
      onRegistrationsChange?.({
        workoutId,
        registrationCount: Math.max(0, registrations.length - 1),
      });
    } catch (error) {
      console.error('Error deleting registration:', error);
      applyErrorMessage('Failed to delete registration');
    } finally {
      setDeleteDialogOpen(false);
      setRegistrationToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRegistrationToDelete(null);
  };

  const renderRegistrationList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      );
    }

    if (filteredRegistrations.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          No registrations found.
        </Typography>
      );
    }

    return (
      <List dense>
        {filteredRegistrations.map((registration) => (
          <ListItem
            key={registration.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              '&:hover': { backgroundColor: 'action.hover' },
            }}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <EditIconButton
                  tooltipTitle="Edit registration"
                  onClick={() => handleEditRegistration(registration)}
                />
                <DeleteIconButton
                  tooltipTitle="Delete registration"
                  onClick={() => handleDeleteRegistration(registration)}
                />
              </Box>
            }
          >
            <ListItemText
              disableTypography
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {registration.name}
                  </Typography>
                  {registration.isManager ? <Chip label="Manager" size="small" /> : null}
                  {registration.positions ? (
                    <Chip label={registration.positions} size="small" variant="outlined" />
                  ) : null}
                </Box>
              }
              secondary={
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {registration.email ? (
                    <Typography variant="caption" color="text.secondary">
                      {registration.email}
                    </Typography>
                  ) : null}
                  {registration.phone1 ? (
                    <Typography variant="caption" color="text.secondary">
                      {formatPhoneNumber(registration.phone1)}
                    </Typography>
                  ) : null}
                  {registration.whereHeard ? (
                    <Chip label={registration.whereHeard} size="small" variant="outlined" />
                  ) : null}
                </Stack>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{workout?.workoutDesc ?? 'Workout Details'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {workout ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {new Date(workout.workoutDate).toLocaleString()}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={workout.field?.name || 'TBD'}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`${workout.registrationCount ?? registrations.length} Registrations`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Box>
          ) : null}

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              size="small"
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <Select
                value={managerFilter === null ? 'all' : managerFilter ? 'manager' : 'player'}
                onChange={(event) => {
                  const value = event.target.value;
                  setManagerFilter(value === 'all' ? null : value === 'manager');
                }}
              >
                <MenuItem value="all">All Registrants</MenuItem>
                <MenuItem value="manager">Managers Only</MenuItem>
                <MenuItem value="player">Players Only</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredRegistrations.length} of {registrations.length} registrations
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleCreateRegistration} sx={{ minWidth: 180 }}>
              Add Registration
            </Button>
          </Stack>

          {renderRegistrationList()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <NotificationSnackbar notification={notification} onClose={hideNotification} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        title="Delete Registration"
        message="Are you sure you want to delete this registration? This action cannot be undone."
        onConfirm={confirmDeleteRegistration}
        onClose={handleCloseDeleteDialog}
        confirmButtonProps={{ disabled: !registrationToDelete }}
        dialogProps={{ maxWidth: 'sm', fullWidth: true }}
      />

      <Dialog
        open={registrationDialogOpen}
        onClose={handleCloseRegistrationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRegistration ? 'Edit Registration' : 'Add Registration'}</DialogTitle>
        <DialogContent>
          <WorkoutRegistrationForm
            accountId={accountId}
            workoutId={workoutId ?? ''}
            registration={editingRegistration}
            actionLayout="dialog"
            onSubmit={handleSaveRegistration}
            onCancel={handleCloseRegistrationDialog}
            isLoading={registrationSaving}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
