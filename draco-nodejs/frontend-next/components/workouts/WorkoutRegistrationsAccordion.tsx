import React, { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Container,
  Paper,
  Alert,
  Divider,
  TextField,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  WorkoutSummaryType,
  WorkoutRegistrationType,
  UpsertWorkoutRegistrationType,
} from '@draco/shared-schemas';
import {
  listWorkouts,
  listWorkoutRegistrations,
  createWorkoutRegistration,
  updateWorkoutRegistration,
  deleteWorkoutRegistration,
  deleteWorkout,
} from '../../services/workoutService';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { WorkoutRegistrationForm } from './WorkoutRegistrationForm';
import { formatPhoneNumber } from '../../utils/phoneNumber';
import { UI_TIMEOUTS } from '../../constants/timeoutConstants';

interface WorkoutRegistrationsAccordionProps {
  accountId: string;
}

export const WorkoutRegistrationsAccordion: React.FC<WorkoutRegistrationsAccordionProps> = ({
  accountId,
}) => {
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSummaryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<WorkoutSummaryType | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<string | false>(false);
  const [loadedRegistrations, setLoadedRegistrations] = useState<Set<string>>(new Set());
  const [registrations, setRegistrations] = useState<Record<string, WorkoutRegistrationType[]>>({});
  const [loadingRegistrations, setLoadingRegistrations] = useState<Record<string, boolean>>({});

  // Registration management state
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<WorkoutRegistrationType | null>(
    null,
  );
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string>('');
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [deleteRegistrationDialogOpen, setDeleteRegistrationDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<{
    workoutId: string;
    registrationId: string;
  } | null>(null);

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<Record<string, string>>({});
  const [filterManager, setFilterManager] = useState<Record<string, boolean | null>>({});

  const router = useRouter();

  // Helper function to filter registrations
  const getFilteredRegistrations = (workoutId: string): WorkoutRegistrationType[] => {
    const workoutRegistrations = registrations[workoutId] || [];
    const search = searchTerm[workoutId] || '';
    const managerFilter = filterManager[workoutId];

    return workoutRegistrations.filter((registration) => {
      // Search filter
      const matchesSearch =
        !search ||
        registration.name.toLowerCase().includes(search.toLowerCase()) ||
        registration.email?.toLowerCase().includes(search.toLowerCase()) ||
        registration.positions?.toLowerCase().includes(search.toLowerCase());

      // Manager filter - null means "All Registrants"
      const matchesManager = managerFilter === null || registration.isManager === managerFilter;

      return matchesSearch && matchesManager;
    });
  };

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listWorkouts(accountId, true, token || undefined); // Include registration counts
      // Sort by workout date, most recent first
      const sortedWorkouts = data.sort(
        (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime(),
      );
      setWorkouts(sortedWorkouts);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, [accountId, token]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Initialize filter states for workouts
  useEffect(() => {
    if (workouts.length > 0) {
      const initialFilterState: Record<string, boolean | null> = {};
      const initialSearchState: Record<string, string> = {};

      workouts.forEach((workout) => {
        initialFilterState[workout.id] = null; // null = "All Registrants"
        initialSearchState[workout.id] = '';
      });

      setFilterManager(initialFilterState);
      setSearchTerm(initialSearchState);
    }
  }, [workouts]);

  const handleCreateWorkout = () => {
    router.push(`/account/${accountId}/workouts/new`);
  };

  const handleAccordionChange =
    (workoutId: string) => async (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedWorkout(isExpanded ? workoutId : false);

      if (isExpanded) {
        // Always fetch registrations if not already loaded, or reload if needed
        if (!loadedRegistrations.has(workoutId)) {
          try {
            setLoadingRegistrations((prev) => ({ ...prev, [workoutId]: true }));

            if (!token) {
              setError('Authentication required to view registrations');
              return;
            }

            const registrationsData = await listWorkoutRegistrations(accountId, workoutId, token);

            setRegistrations((prev) => ({ ...prev, [workoutId]: registrationsData }));
            setLoadedRegistrations((prev) => new Set([...prev, workoutId]));
          } catch (err) {
            console.error('Error fetching registrations:', err);
            setError(
              `Failed to load registrations: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
          } finally {
            setLoadingRegistrations((prev) => ({ ...prev, [workoutId]: false }));
          }
        }

        // Initialize filter state for this workout if not already set
        if (filterManager[workoutId] === undefined) {
          setFilterManager((prev) => ({ ...prev, [workoutId]: null })); // null = "All Registrants"
        }
        if (searchTerm[workoutId] === undefined) {
          setSearchTerm((prev) => ({ ...prev, [workoutId]: '' }));
        }
      }
    };

  const handleAddRegistration = (workout: WorkoutSummaryType) => {
    setCurrentWorkoutId(workout.id);
    setEditingRegistration(null);
    setRegistrationDialogOpen(true);
  };

  const handleEditRegistration = (workoutId: string, registration: WorkoutRegistrationType) => {
    setCurrentWorkoutId(workoutId);
    setEditingRegistration(registration);
    setRegistrationDialogOpen(true);
  };

  const handleDeleteRegistration = async (workoutId: string, registrationId: string) => {
    try {
      await deleteWorkoutRegistration(accountId, workoutId, registrationId, token || undefined);

      // Update local state
      setRegistrations((prev) => ({
        ...prev,
        [workoutId]: prev[workoutId]?.filter((r) => r.id !== registrationId) || [],
      }));

      // Update workout registration count
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, registrationCount: (w.registrationCount || 0) - 1 } : w,
        ),
      );

      setSuccessMessage('Registration deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setOperationError(
        `Failed to delete registration: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      setTimeout(() => setOperationError(null), 3000);
    }
  };

  const handleSaveRegistration = async (data: UpsertWorkoutRegistrationType) => {
    try {
      setSavingRegistration(true);
      setOperationError(null);
      setSuccessMessage(null);

      if (editingRegistration) {
        // Update existing registration
        const updatedRegistration = await updateWorkoutRegistration(
          accountId,
          currentWorkoutId,
          editingRegistration.id,
          data,
          token || undefined,
        );

        // Update local state
        setRegistrations((prev) => ({
          ...prev,
          [currentWorkoutId]: prev[currentWorkoutId].map((reg) =>
            reg.id === editingRegistration.id ? updatedRegistration : reg,
          ),
        }));

        setSuccessMessage('Registration updated successfully');
      } else {
        // Create new registration
        const newRegistration = await createWorkoutRegistration(
          accountId,
          currentWorkoutId,
          data,
          token || undefined,
        );

        // Update local state
        setRegistrations((prev) => ({
          ...prev,
          [currentWorkoutId]: [...(prev[currentWorkoutId] || []), newRegistration],
        }));

        // Update workout registration count
        setWorkouts((prev) =>
          prev.map((workout) =>
            workout.id === currentWorkoutId
              ? { ...workout, registrationCount: (workout.registrationCount || 0) + 1 }
              : workout,
          ),
        );

        setSuccessMessage('Registration created successfully');
      }

      setRegistrationDialogOpen(false);

      // Clear success message after configured timeout
      setTimeout(() => setSuccessMessage(null), UI_TIMEOUTS.SUCCESS_MESSAGE_TIMEOUT_MS);
    } catch (err) {
      console.error('Error saving registration:', err);
      setOperationError(err instanceof Error ? err.message : 'Failed to save registration');

      // Clear error message after configured timeout
      setTimeout(() => setOperationError(null), UI_TIMEOUTS.ERROR_MESSAGE_TIMEOUT_MS);
    } finally {
      setSavingRegistration(false);
    }
  };

  const confirmDelete = async () => {
    if (!workoutToDelete) return;

    try {
      await deleteWorkout(accountId, workoutToDelete.id, token || undefined);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutToDelete.id));
      setDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    } catch (err) {
      console.error('Error deleting workout:', err);
      setError('Failed to delete workout');
    }
  };

  const confirmDeleteRegistration = async () => {
    if (!registrationToDelete) return;

    try {
      await deleteWorkoutRegistration(
        accountId,
        registrationToDelete.workoutId,
        registrationToDelete.registrationId,
        token || undefined,
      );

      // Update local state
      setRegistrations((prev) => ({
        ...prev,
        [registrationToDelete.workoutId]: prev[registrationToDelete.workoutId].filter(
          (reg) => reg.id !== registrationToDelete.registrationId,
        ),
      }));

      // Update workout registration count
      setWorkouts((prev) =>
        prev.map((workout) =>
          workout.id === registrationToDelete.workoutId
            ? { ...workout, registrationCount: Math.max(0, (workout.registrationCount || 0) - 1) }
            : workout,
        ),
      );

      setDeleteRegistrationDialogOpen(false);
      setRegistrationToDelete(null);
    } catch (err) {
      console.error('Error deleting registration:', err);
      setError('Failed to delete registration');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading workouts...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {operationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOperationError(null)}>
          {operationError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Workouts Accordion */}
      {loading ? (
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workouts...
          </Typography>
        </Container>
      ) : workouts.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {workouts.map((workout) => (
            <Accordion
              key={workout.id}
              expanded={expandedWorkout === workout.id}
              onChange={handleAccordionChange(workout.id)}
              sx={{
                '&:before': { display: 'none' },
                boxShadow: 2,
                borderRadius: 2,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: expandedWorkout === workout.id ? '8px 8px 0 0' : '8px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    pr: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: '200px' }}>
                      {workout.workoutDesc}
                    </Typography>
                    <Chip
                      label={new Date(workout.workoutDate).toLocaleDateString()}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={workout.field?.name || 'TBD'}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                    <Badge
                      badgeContent={workout.registrationCount || 0}
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      <PeopleIcon />
                    </Badge>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails
                sx={{ backgroundColor: 'background.default', borderRadius: '0 0 8px 8px' }}
              >
                <Box sx={{ p: 2 }}>
                  {/* Workout Actions */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push(`/account/${accountId}/workouts/${workout.id}`)}
                      startIcon={<VisibilityIcon />}
                    >
                      Preview Workout
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        router.push(`/account/${accountId}/workouts/${workout.id}/edit`)
                      }
                      startIcon={<EditIcon />}
                    >
                      Edit Workout
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setWorkoutToDelete(workout);
                        setDeleteDialogOpen(true);
                      }}
                      startIcon={<DeleteIcon />}
                    >
                      Delete Workout
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddRegistration(workout)}
                      size="small"
                    >
                      Add Registration
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Registrations List */}
                  {expandedWorkout === workout.id && (
                    <Box sx={{ mt: 2 }}>
                      {/* Search and Filter Controls */}
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          gap: 2,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          size="small"
                          placeholder="Search registrations..."
                          value={searchTerm[workout.id] || ''}
                          onChange={(e) =>
                            setSearchTerm((prev) => ({ ...prev, [workout.id]: e.target.value }))
                          }
                          sx={{ minWidth: 200 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={
                              filterManager[workout.id] === null
                                ? 'all'
                                : filterManager[workout.id]
                                  ? 'manager'
                                  : 'player'
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilterManager((prev) => ({
                                ...prev,
                                [workout.id]: value === 'all' ? null : value === 'manager',
                              }));
                            }}
                          >
                            <MenuItem value="all">All Registrants</MenuItem>
                            <MenuItem value="manager">Managers Only</MenuItem>
                            <MenuItem value="player">Players Only</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary">
                          Showing {getFilteredRegistrations(workout.id).length} of{' '}
                          {registrations[workout.id]?.length || 0} registrations
                        </Typography>
                      </Box>

                      {loadingRegistrations[workout.id] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : getFilteredRegistrations(workout.id).length > 0 ? (
                        <List dense>
                          {getFilteredRegistrations(workout.id).map((registration) => (
                            <ListItem
                              key={registration.id}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                },
                              }}
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditRegistration(workout.id, registration)}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteRegistration(workout.id, registration.id)
                                    }
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                      {registration.name}
                                    </Typography>
                                    {registration.isManager && (
                                      <Chip label="Manager" size="small" color="primary" />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <span
                                    style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}
                                  >
                                    {registration.email && `${registration.email} • `}
                                    {registration.phone1 &&
                                      `${formatPhoneNumber(registration.phone1)} • `}
                                    {registration.positions || 'No positions specified'}
                                  </span>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 3 }}
                        >
                          No registrations found
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No workouts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first workout to get started.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateWorkout}>
            Create Workout
          </Button>
        </Paper>
      )}

      {/* Delete Workout Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Workout"
        message={`Are you sure you want to delete the workout "${workoutToDelete?.workoutDesc}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonColor="error"
      />

      {/* Delete Registration Dialog */}
      <ConfirmationDialog
        open={deleteRegistrationDialogOpen}
        onClose={() => setDeleteRegistrationDialogOpen(false)}
        onConfirm={confirmDeleteRegistration}
        title="Delete Registration"
        message="Are you sure you want to delete this registration? This action cannot be undone."
        confirmText="Delete"
        confirmButtonColor="error"
      />

      {/* Registration Form Dialog */}
      <Dialog
        open={registrationDialogOpen}
        onClose={() => setRegistrationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRegistration ? 'Edit Registration' : 'Add New Registration'}
        </DialogTitle>
        <DialogContent>
          <WorkoutRegistrationForm
            accountId={accountId}
            workoutId={currentWorkoutId}
            registration={editingRegistration}
            onSubmit={handleSaveRegistration}
            onCancel={() => setRegistrationDialogOpen(false)}
            isLoading={savingRegistration}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );

  return (
    <Container maxWidth="xl">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {operationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOperationError(null)}>
          {operationError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Workouts Accordion */}
      {loading ? (
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workouts...
          </Typography>
        </Container>
      ) : workouts.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {workouts.map((workout) => (
            <Accordion
              key={workout.id}
              expanded={expandedWorkout === workout.id}
              onChange={handleAccordionChange(workout.id)}
              sx={{
                '&:before': { display: 'none' },
                boxShadow: 2,
                borderRadius: 2,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: expandedWorkout === workout.id ? '8px 8px 0 0' : '8px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    pr: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: '200px' }}>
                      {workout.workoutDesc}
                    </Typography>
                    <Chip
                      label={new Date(workout.workoutDate).toLocaleDateString()}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={workout.field?.name || 'TBD'}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                    <Badge
                      badgeContent={workout.registrationCount || 0}
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      <PeopleIcon />
                    </Badge>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails
                sx={{ backgroundColor: 'background.default', borderRadius: '0 0 8px 8px' }}
              >
                <Box sx={{ p: 2 }}>
                  {/* Workout Actions */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push(`/account/${accountId}/workouts/${workout.id}`)}
                      startIcon={<VisibilityIcon />}
                    >
                      Preview Workout
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        router.push(`/account/${accountId}/workouts/${workout.id}/edit`)
                      }
                      startIcon={<EditIcon />}
                    >
                      Edit Workout
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setWorkoutToDelete(workout);
                        setDeleteDialogOpen(true);
                      }}
                      startIcon={<DeleteIcon />}
                    >
                      Delete Workout
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddRegistration(workout)}
                      size="small"
                    >
                      Add Registration
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Registrations List */}
                  {expandedWorkout === workout.id && (
                    <Box sx={{ mt: 2 }}>
                      {/* Search and Filter Controls */}
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          gap: 2,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          size="small"
                          placeholder="Search registrations..."
                          value={searchTerm[workout.id] || ''}
                          onChange={(e) =>
                            setSearchTerm((prev) => ({ ...prev, [workout.id]: e.target.value }))
                          }
                          sx={{ minWidth: 200 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={
                              filterManager[workout.id] === null
                                ? 'all'
                                : filterManager[workout.id]
                                  ? 'manager'
                                  : 'player'
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilterManager((prev) => ({
                                ...prev,
                                [workout.id]: value === 'all' ? null : value === 'manager',
                              }));
                            }}
                          >
                            <MenuItem value="all">All Registrants</MenuItem>
                            <MenuItem value="manager">Managers Only</MenuItem>
                            <MenuItem value="player">Players Only</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary">
                          Showing {getFilteredRegistrations(workout.id).length} of{' '}
                          {registrations[workout.id]?.length || 0} registrations
                        </Typography>
                      </Box>

                      {loadingRegistrations[workout.id] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : getFilteredRegistrations(workout.id).length > 0 ? (
                        <List dense>
                          {getFilteredRegistrations(workout.id).map((registration) => (
                            <ListItem
                              key={registration.id}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                },
                              }}
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditRegistration(workout.id, registration)}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteRegistration(workout.id, registration.id)
                                    }
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                      {registration.name}
                                    </Typography>
                                    {registration.isManager && (
                                      <Chip label="Manager" size="small" color="primary" />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {registration.email && `${registration.email} • `}
                                      {registration.phone1 &&
                                        `${formatPhoneNumber(registration.phone1)} • `}
                                      {registration.positions || 'No positions specified'}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 3 }}
                        >
                          No registrations found
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No workouts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get started by creating your first workout.
          </Typography>
          <Button variant="contained" onClick={handleCreateWorkout} startIcon={<AddIcon />}>
            Create Workout
          </Button>
        </Paper>
      )}

      {/* Registration Dialog */}
      {registrationDialogOpen && (
        <Dialog
          open={registrationDialogOpen}
          onClose={() => setRegistrationDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingRegistration ? 'Edit Registration' : 'Add Registration'}
          </DialogTitle>
          <DialogContent>
            <WorkoutRegistrationForm
              accountId={accountId}
              workoutId={currentWorkoutId}
              registration={editingRegistration}
              onSubmit={handleSaveRegistration}
              onCancel={() => setRegistrationDialogOpen(false)}
              isLoading={savingRegistration}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Workout Confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone and will also delete all associated registrations."
        confirmText="Delete"
        confirmButtonColor="error"
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setWorkoutToDelete(null);
        }}
      />

      {/* Delete Registration Confirmation */}
      <ConfirmationDialog
        open={deleteRegistrationDialogOpen}
        title="Delete Registration"
        message="Are you sure you want to delete this registration? This action cannot be undone."
        confirmText="Delete"
        confirmButtonColor="error"
        onConfirm={confirmDeleteRegistration}
        onClose={() => {
          setDeleteRegistrationDialogOpen(false);
          setRegistrationToDelete(null);
        }}
      />
    </Container>
  );
};
