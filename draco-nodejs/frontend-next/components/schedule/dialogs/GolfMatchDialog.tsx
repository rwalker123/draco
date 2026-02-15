'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Stack,
  FormHelperText,
  TextField,
} from '@mui/material';
import { Controller, FormProvider, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { GameDialogProps } from '../types/sportAdapter';
import { useGolfMatchOperations } from '../hooks/useGolfMatchOperations';
import { listGolfCourseTees } from '@draco/shared-api-client';
import { GameStatus } from '@/types/schedule';
import type { GolfCourseTee } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import MoveToSeasonDialog from './MoveToSeasonDialog';

const golfMatchSchema = z
  .object({
    leagueSeasonId: z.string().min(1, 'League is required'),
    matchDate: z.date({ message: 'Match date is required' }),
    matchTime: z.date({ message: 'Match time is required' }),
    team1Id: z.string().min(1, 'Team 1 is required'),
    team2Id: z.string().min(1, 'Team 2 is required'),
    courseId: z.string().nullable().optional(),
    teeId: z.string().nullable().optional(),
    comment: z.string().max(255, 'Comment must be 255 characters or fewer').default(''),
    matchType: z.number().int().min(0).max(2).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.team1Id === data.team2Id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['team1Id'],
        message: 'Teams must be different',
      });
    }
  });

type GolfMatchFormValues = z.infer<typeof golfMatchSchema>;

// Wrapper component that handles remounting on key changes
const GolfMatchDialog: React.FC<GameDialogProps> = (props) => {
  if (!props.open) {
    return null;
  }

  if (props.mode === 'edit' && !props.selectedGame) {
    return null;
  }

  // Check if trying to edit a completed match
  if (props.mode === 'edit' && props.selectedGame?.gameStatus === GameStatus.Completed) {
    return (
      <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Edit Match
          </Typography>
        </Box>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This match has been completed and cannot be edited. To make changes, clear the scores
            first from the score entry dialog.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={props.onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Create a key that changes when we need to remount with fresh form state
  const key = [
    props.mode,
    props.selectedGame?.id ?? 'new',
    props.defaultLeagueSeasonId ?? 'none',
    props.defaultGameDate ? props.defaultGameDate.getTime() : 'no-date',
    props.timeZone,
  ].join('-');

  return <GolfMatchDialogInner key={key} {...props} />;
};

const GolfMatchDialogInner: React.FC<GameDialogProps> = ({
  mode,
  accountId,
  timeZone,
  selectedGame,
  leagues,
  locations,
  leagueTeamsCache,
  canEditSchedule,
  defaultLeagueSeasonId,
  defaultGameDate,
  onClose,
  onSuccess,
  onError,
  onDelete,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [keepDialogOpen, setKeepDialogOpen] = useState(false);
  const [availableTees, setAvailableTees] = useState<GolfCourseTee[]>([]);
  const [loadingTees, setLoadingTees] = useState(false);
  const [moveSeasonDialogOpen, setMoveSeasonDialogOpen] = useState(false);
  const { createMatch, updateMatch, changeMatchSeason, loading } = useGolfMatchOperations({
    accountId,
    timeZone,
  });
  const apiClient = useApiClient();

  const defaultValues: GolfMatchFormValues = useMemo(() => {
    if (mode === 'edit' && selectedGame) {
      return {
        leagueSeasonId: selectedGame.league.id,
        matchDate: new Date(selectedGame.gameDate),
        matchTime: new Date(selectedGame.gameDate),
        team1Id: selectedGame.homeTeamId,
        team2Id: selectedGame.visitorTeamId,
        courseId: selectedGame.fieldId ?? null,
        teeId: selectedGame.teeId ?? null,
        comment: selectedGame.comment ?? '',
        matchType: selectedGame.gameType ?? 0,
      };
    }
    const initialLeagueSeasonId = defaultLeagueSeasonId ?? leagues[0]?.id ?? '';
    const initialCourseId = locations.length === 1 ? locations[0].id : null;
    return {
      leagueSeasonId: initialLeagueSeasonId,
      matchDate: defaultGameDate ?? new Date(),
      matchTime: new Date(),
      team1Id: '',
      team2Id: '',
      courseId: initialCourseId,
      teeId: null,
      comment: '',
      matchType: 0,
    };
  }, [mode, selectedGame, defaultLeagueSeasonId, defaultGameDate, leagues, locations]);

  const formResolver = useMemo(
    () =>
      zodResolver(golfMatchSchema) as Resolver<
        GolfMatchFormValues,
        Record<string, never>,
        GolfMatchFormValues
      >,
    [],
  );

  const methods = useForm<GolfMatchFormValues>({
    resolver: formResolver,
    defaultValues,
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = methods;

  const selectedLeagueSeasonId = watch('leagueSeasonId');
  const selectedCourseId = watch('courseId');

  // Track the previous course ID to detect user-initiated changes
  const prevCourseIdRef = useRef<string | null | undefined>(selectedCourseId);

  const leagueTeams = useMemo(() => {
    if (!selectedLeagueSeasonId) return [];
    return leagueTeamsCache.get(selectedLeagueSeasonId) ?? [];
  }, [selectedLeagueSeasonId, leagueTeamsCache]);

  useEffect(() => {
    const fetchTees = async () => {
      if (!selectedCourseId) {
        setAvailableTees([]);
        return;
      }

      setLoadingTees(true);
      try {
        const result = await listGolfCourseTees({
          client: apiClient,
          path: { accountId, courseId: selectedCourseId },
          throwOnError: false,
        });

        if (result.data) {
          setAvailableTees(result.data);
        } else {
          setAvailableTees([]);
        }
      } catch {
        setAvailableTees([]);
      } finally {
        setLoadingTees(false);
      }
    };

    fetchTees();
  }, [selectedCourseId, accountId, apiClient]);

  // Clear tee when course changes (user action only)
  useEffect(() => {
    // If course changed from a previous value (user changed it), clear the tee
    if (prevCourseIdRef.current !== undefined && prevCourseIdRef.current !== selectedCourseId) {
      setValue('teeId', null);
    }
    prevCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId, setValue]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const onSubmit = useCallback(
    async (data: GolfMatchFormValues) => {
      setError(null);

      try {
        const result =
          mode === 'create' ? await createMatch(data) : await updateMatch(selectedGame!.id, data);

        onSuccess?.({ message: result.message, game: result.game });

        if (mode === 'create' && keepDialogOpen) {
          const preservedDate = data.matchDate;
          const preservedTime = data.matchTime;
          const preservedLeague = data.leagueSeasonId;
          const preservedCourse = data.courseId;
          const preservedTee = data.teeId;

          reset({
            leagueSeasonId: preservedLeague,
            matchDate: preservedDate,
            matchTime: preservedTime,
            team1Id: '',
            team2Id: '',
            courseId: preservedCourse,
            teeId: preservedTee,
            comment: '',
            matchType: 0,
          });
          return;
        }

        handleClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save match';
        setError(message);
        onError?.(message);
      }
    },
    [
      mode,
      selectedGame,
      createMatch,
      updateMatch,
      onSuccess,
      onError,
      handleClose,
      keepDialogOpen,
      reset,
    ],
  );

  const handleMoveToSeason = async (seasonId: string) => {
    if (!selectedGame) return;
    const result = await changeMatchSeason(selectedGame.id, seasonId);
    setMoveSeasonDialogOpen(false);
    onSuccess?.({ message: result.message, removed: true });
    handleClose();
  };

  const dialogTitle = mode === 'create' ? 'Create Match' : 'Edit Match';

  return (
    <>
      <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {dialogTitle}
              </Typography>
            </Box>

            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={2}>
                  <Controller
                    name="leagueSeasonId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required error={!!errors.leagueSeasonId}>
                        <InputLabel>League</InputLabel>
                        <Select {...field} label="League" disabled={!canEditSchedule}>
                          {leagues.map((league) => (
                            <MenuItem key={league.id} value={league.id}>
                              {league.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{errors.leagueSeasonId?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Controller
                      name="matchDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Match Date"
                          value={field.value ?? null}
                          onChange={(date) => field.onChange(date ?? null)}
                          disabled={!canEditSchedule}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              error: !!errors.matchDate,
                              helperText: errors.matchDate?.message,
                            },
                          }}
                        />
                      )}
                    />
                    <Controller
                      name="matchTime"
                      control={control}
                      render={({ field }) => (
                        <TimePicker
                          label="Tee Time"
                          value={field.value ?? null}
                          onChange={(time) => field.onChange(time ?? null)}
                          disabled={!canEditSchedule}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              error: !!errors.matchTime,
                              helperText: errors.matchTime?.message,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Controller
                      name="team1Id"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth required error={!!errors.team1Id}>
                          <InputLabel>Team 1</InputLabel>
                          <Select {...field} label="Team 1" disabled={!canEditSchedule}>
                            {leagueTeams.map((team) => (
                              <MenuItem key={team.id} value={team.id}>
                                {team.name}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{errors.team1Id?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                    <Controller
                      name="team2Id"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth required error={!!errors.team2Id}>
                          <InputLabel>Team 2</InputLabel>
                          <Select {...field} label="Team 2" disabled={!canEditSchedule}>
                            {leagueTeams.map((team) => (
                              <MenuItem key={team.id} value={team.id}>
                                {team.name}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{errors.team2Id?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Controller
                      name="courseId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.courseId}>
                          <InputLabel shrink>Course</InputLabel>
                          <Select
                            {...field}
                            label="Course"
                            displayEmpty
                            value={field.value ?? ''}
                            disabled={!canEditSchedule}
                            renderValue={(selected) => {
                              if (!selected) return 'None';
                              const course = locations.find((l) => l.id === selected);
                              return course?.name ?? 'Unknown';
                            }}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {locations.map((location) => (
                              <MenuItem key={location.id} value={location.id}>
                                {location.name}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{errors.courseId?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />

                    <Controller
                      name="teeId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.teeId}>
                          <InputLabel shrink>Tee</InputLabel>
                          <Select
                            {...field}
                            label="Tee"
                            displayEmpty
                            value={field.value ?? ''}
                            disabled={!canEditSchedule || !selectedCourseId || loadingTees}
                            renderValue={(selected) => {
                              if (!selected) return 'None';
                              const tee = availableTees.find((t) => t.id === selected);
                              return tee ? `${tee.teeName} (${tee.teeColor})` : 'Unknown';
                            }}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {availableTees.map((tee) => (
                              <MenuItem key={tee.id} value={tee.id}>
                                {tee.teeName} ({tee.teeColor})
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{errors.teeId?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Controller
                    name="matchType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.matchType}>
                        <InputLabel>Match Type</InputLabel>
                        <Select {...field} label="Match Type" disabled={!canEditSchedule}>
                          <MenuItem value={0}>Regular Season</MenuItem>
                          <MenuItem value={1}>Playoff</MenuItem>
                          <MenuItem value={2}>Practice</MenuItem>
                        </Select>
                        <FormHelperText>{errors.matchType?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="comment"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Comment"
                        multiline
                        rows={2}
                        error={!!errors.comment}
                        helperText={errors.comment?.message}
                        disabled={!canEditSchedule}
                      />
                    )}
                  />
                </Stack>
              </LocalizationProvider>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              {mode === 'edit' && onDelete && canEditSchedule && (
                <Button color="error" onClick={onDelete}>
                  Delete
                </Button>
              )}

              {mode === 'edit' && canEditSchedule && (
                <Button
                  color="info"
                  onClick={() => setMoveSeasonDialogOpen(true)}
                  sx={{ mr: 'auto' }}
                >
                  Move to Season
                </Button>
              )}

              {mode === 'create' && canEditSchedule && (
                <Button
                  onClick={() => setKeepDialogOpen((prev) => !prev)}
                  variant={keepDialogOpen ? 'contained' : 'outlined'}
                  color="secondary"
                  size="small"
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    '&.MuiButton-contained': {
                      backgroundColor: 'secondary.main',
                      color: 'secondary.contrastText',
                      '&:hover': {
                        backgroundColor: 'secondary.dark',
                      },
                    },
                  }}
                >
                  Keep Open
                </Button>
              )}

              <Box sx={{ flex: 1 }} />

              <Button onClick={handleClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !canEditSchedule}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>

      {mode === 'edit' && selectedGame && (
        <MoveToSeasonDialog
          open={moveSeasonDialogOpen}
          accountId={accountId}
          onClose={() => setMoveSeasonDialogOpen(false)}
          onConfirm={handleMoveToSeason}
          loading={loading}
        />
      )}
    </>
  );
};

export default GolfMatchDialog;
