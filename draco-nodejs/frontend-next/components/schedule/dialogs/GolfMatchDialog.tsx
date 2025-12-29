'use client';

import React, { useCallback, useMemo, useState } from 'react';
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

const golfMatchSchema = z
  .object({
    leagueSeasonId: z.string().min(1, 'League is required'),
    matchDate: z.date({ message: 'Match date is required' }),
    matchTime: z.date({ message: 'Match time is required' }),
    team1Id: z.string().min(1, 'Team 1 is required'),
    team2Id: z.string().min(1, 'Team 2 is required'),
    courseId: z.string().nullable().optional(),
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

const GolfMatchDialog: React.FC<GameDialogProps> = ({
  open,
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
  const { createMatch, updateMatch, loading } = useGolfMatchOperations({ accountId, timeZone });

  const defaultValues: GolfMatchFormValues = useMemo(() => {
    if (mode === 'edit' && selectedGame) {
      return {
        leagueSeasonId: selectedGame.league.id,
        matchDate: new Date(selectedGame.gameDate),
        matchTime: new Date(selectedGame.gameDate),
        team1Id: selectedGame.homeTeamId,
        team2Id: selectedGame.visitorTeamId,
        courseId: selectedGame.fieldId ?? null,
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
    formState: { errors },
    reset,
  } = methods;

  const selectedLeagueSeasonId = watch('leagueSeasonId');
  const leagueTeams = useMemo(() => {
    if (!selectedLeagueSeasonId) return [];
    return leagueTeamsCache.get(selectedLeagueSeasonId) ?? [];
  }, [selectedLeagueSeasonId, leagueTeamsCache]);

  const handleClose = useCallback(() => {
    setError(null);
    reset();
    onClose();
  }, [onClose, reset]);

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

          reset({
            leagueSeasonId: preservedLeague,
            matchDate: preservedDate,
            matchTime: preservedTime,
            team1Id: '',
            team2Id: '',
            courseId: preservedCourse,
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

  const dialogTitle = mode === 'create' ? 'Create Match' : 'Edit Match';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
              <Button color="error" onClick={onDelete} sx={{ mr: 'auto' }}>
                Delete
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
  );
};

export default GolfMatchDialog;
