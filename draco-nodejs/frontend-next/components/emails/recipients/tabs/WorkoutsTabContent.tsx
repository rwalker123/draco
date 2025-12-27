'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Stack,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  Chip,
  Switch,
} from '@mui/material';
import {
  Person as PersonIcon,
  Groups as GroupsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { WorkoutSummaryType, WorkoutRegistrationType } from '@draco/shared-schemas';

export type WorkoutWithRegistrants = WorkoutSummaryType & {
  registrants: WorkoutRegistrationType[];
};

export interface WorkoutsTabContentProps {
  workouts: WorkoutWithRegistrants[];
  totalRegistrants: number;
  selectedWorkoutIds: Map<string, Set<string>>;
  onToggleAll: (checked: boolean) => void;
  onToggleWorkout: (workoutId: string, checked: boolean) => void;
  onToggleRegistrant: (workoutId: string, registrantId: string, checked: boolean) => void;
  managersOnly: boolean;
  onToggleManagersOnly: (checked: boolean) => void;
  loading: boolean;
  error?: string | null;
}

const WorkoutsTabContent: React.FC<WorkoutsTabContentProps> = ({
  workouts,
  totalRegistrants,
  selectedWorkoutIds,
  onToggleAll,
  onToggleWorkout,
  onToggleRegistrant,
  managersOnly,
  onToggleManagersOnly,
  loading,
  error,
}) => {
  const [rootExpanded, setRootExpanded] = useState(true);
  const [collapsedWorkouts, setCollapsedWorkouts] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((workoutId: string) => {
    setCollapsedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  }, []);

  const selectedCount = useMemo(() => {
    let total = 0;
    selectedWorkoutIds.forEach((ids) => {
      total += ids.size;
    });
    return total;
  }, [selectedWorkoutIds]);

  const allSelected = totalRegistrants > 0 && selectedCount === totalRegistrants;
  const indeterminate = selectedCount > 0 && selectedCount < totalRegistrants;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading workouts...
        </Typography>
      </Box>
    );
  }

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const includeYear = date.getFullYear() !== now.getFullYear();

    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...(includeYear ? { year: 'numeric' } : {}),
    });
  };

  return (
    <Box sx={{ p: 0, overflowY: 'auto', height: '100%' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="h3" color="text.primary">
          Select Workouts & Registrants
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Want to Manage only
          </Typography>
          <Switch
            size="small"
            checked={managersOnly}
            onChange={(event) => onToggleManagersOnly(event.target.checked)}
            inputProps={{ 'aria-label': 'Toggle registrants that would be willing to manager' }}
          />
        </Stack>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.25 }}>
          <IconButton size="small" onClick={() => setRootExpanded((prev) => !prev)}>
            {rootExpanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => onToggleAll(event.target.checked)}
            disabled={totalRegistrants === 0}
            size="small"
            sx={{ p: 0.5 }}
          />
          <GroupsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All displayed workouts
          </Typography>
          <Chip
            label={`${selectedCount}/${totalRegistrants} players`}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>

        {rootExpanded && (
          <>
            {workouts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
                No active workouts with registrants are available.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {workouts.map((workout) => {
                  const selectedIds = selectedWorkoutIds.get(workout.id) ?? new Set<string>();
                  const workoutSelected =
                    selectedIds.size > 0 && selectedIds.size === workout.registrants.length;
                  const workoutIndeterminate =
                    selectedIds.size > 0 && selectedIds.size < workout.registrants.length;
                  const isExpanded = !collapsedWorkouts.has(workout.id);

                  return (
                    <Box key={workout.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 0.5,
                          bgcolor: 'background.default',
                        }}
                      >
                        <IconButton size="small" onClick={() => toggleExpand(workout.id)}>
                          {isExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                        <Checkbox
                          checked={workoutSelected}
                          indeterminate={workoutIndeterminate}
                          onChange={(event) => onToggleWorkout(workout.id, event.target.checked)}
                          size="small"
                        />
                        <GroupsIcon fontSize="small" color="secondary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {workout.workoutDesc}
                        </Typography>
                        <Chip
                          label={`${selectedIds.size}/${workout.registrants.length} players`}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {formatDateTime(workout.workoutDate)}
                        </Typography>
                      </Box>

                      {isExpanded && (
                        <Box sx={{ pl: 9, pr: 2, pb: 1 }}>
                          {workout.registrants.length === 0 ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ pl: 1, py: 0.5 }}
                            >
                              No registrants yet
                            </Typography>
                          ) : (
                            workout.registrants.map((registrant) => (
                              <Box
                                key={registrant.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  py: 0.5,
                                }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={selectedIds.has(registrant.id)}
                                  onChange={(event) =>
                                    onToggleRegistrant(
                                      workout.id,
                                      registrant.id,
                                      event.target.checked,
                                    )
                                  }
                                />
                                <PersonIcon fontSize="small" color="action" />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2">{registrant.name}</Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {registrant.email}
                                  </Typography>
                                </Box>
                              </Box>
                            ))
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default WorkoutsTabContent;
