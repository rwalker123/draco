'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { GameBattingStatLineType, TeamStatsPlayerSummaryType } from '@draco/shared-schemas';
import {
  CreateGameBattingStatSchema,
  GameBattingStatInputSchema,
  UpdateGameBattingStatSchema,
  type UpdateGameBattingStatType,
} from '@draco/shared-schemas';

import type { TeamStatsEntryService } from '../../../services/teamStatsEntryService';
import { defaultCreateBattingValues, defaultUpdateBattingValues } from '../constants';
import { buildPlayerLabel } from '../utils';

interface BaseDialogProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  gameId: string | null;
  service: TeamStatsEntryService;
  onSuccess?: (result: { message: string; stat: GameBattingStatLineType }) => void;
  onError?: (message: string) => void;
}

interface AddBattingStatDialogProps extends BaseDialogProps {
  open: boolean;
  onClose: () => void;
  availablePlayers: TeamStatsPlayerSummaryType[];
}

const BattingDialogSchema = GameBattingStatInputSchema.extend({
  rosterSeasonId: z.string().min(1, 'Player is required'),
});

type BattingFormValues = z.infer<typeof BattingDialogSchema>;

export const AddBattingStatDialog: React.FC<AddBattingStatDialogProps> = ({
  open,
  onClose,
  availablePlayers,
  accountId,
  seasonId,
  teamSeasonId,
  gameId,
  service,
  onSuccess,
  onError,
}) => {
  const playerVersion = useMemo(
    () => availablePlayers.map((player) => player.rosterSeasonId).join('|'),
    [availablePlayers],
  );

  const defaultValues = useMemo(
    () => ({
      ...defaultCreateBattingValues,
      rosterSeasonId: availablePlayers[0]?.rosterSeasonId ?? '',
    }),
    [availablePlayers],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BattingFormValues>({
    resolver: zodResolver(BattingDialogSchema),
    defaultValues: defaultCreateBattingValues,
    values: open ? defaultValues : undefined,
  });

  const dialogContextKey = `${open ? 'open' : 'closed'}:${playerVersion}`;
  const [submitErrorState, setSubmitErrorState] = useState<{
    message: string | null;
    contextKey: string;
  }>(() => ({
    message: null,
    contextKey: dialogContextKey,
  }));
  const submitError =
    submitErrorState.contextKey === dialogContextKey ? submitErrorState.message : null;
  const setSubmitError = useCallback(
    (message: string | null) => {
      setSubmitErrorState({ message, contextKey: dialogContextKey });
    },
    [dialogContextKey],
  );

  const submitHandler = handleSubmit(async (values) => {
    if (!gameId) {
      setSubmitError('Select a game before adding batting statistics.');
      return;
    }

    try {
      setSubmitError(null);
      const payload = CreateGameBattingStatSchema.parse({
        ...values,
        rosterSeasonId: BigInt(values.rosterSeasonId),
      });

      const created = await service.createGameBattingStat(
        accountId,
        seasonId,
        teamSeasonId,
        gameId,
        payload,
      );

      onSuccess?.({
        message: 'Batting stat added successfully.',
        stat: created,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add batting stat. Please retry.';
      setSubmitError(message);
      onError?.(message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Batting Stat</DialogTitle>
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {availablePlayers.length === 0 ? (
          <Alert severity="info">
            All available players already have a batting line for this game.
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="rosterSeasonId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={availablePlayers}
                  getOptionLabel={buildPlayerLabel}
                  value={
                    availablePlayers.find((player) => player.rosterSeasonId === field.value) ?? null
                  }
                  onChange={(_event, newValue) => field.onChange(newValue?.rosterSeasonId ?? '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Player"
                      error={Boolean(errors.rosterSeasonId)}
                      helperText={errors.rosterSeasonId?.message}
                    />
                  )}
                />
              )}
            />

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(3, minmax(0, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {(
                [
                  { name: 'ab', label: 'At Bats' },
                  { name: 'h', label: 'Hits' },
                  { name: 'r', label: 'Runs' },
                  { name: 'rbi', label: 'RBI' },
                  { name: 'd', label: 'Doubles' },
                  { name: 't', label: 'Triples' },
                  { name: 'hr', label: 'Home Runs' },
                  { name: 'so', label: 'Strikeouts' },
                  { name: 'bb', label: 'Walks' },
                  { name: 'hbp', label: 'Hit by Pitch' },
                  { name: 'sb', label: 'Stolen Bases' },
                  { name: 'cs', label: 'Caught Stealing' },
                  { name: 'sf', label: 'Sac Fly' },
                  { name: 'sh', label: 'Sac Bunt' },
                  { name: 're', label: 'Reached on Error' },
                  { name: 'intr', label: 'Interference' },
                  { name: 'lob', label: 'Left on Base' },
                ] as const
              ).map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type="number"
                  fullWidth
                  {...register(field.name, { valueAsNumber: true })}
                  error={Boolean((errors as Record<string, unknown>)[field.name])}
                  helperText={(errors as Record<string, { message?: string }>)[field.name]?.message}
                  inputProps={{ min: 0 }}
                />
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => void submitHandler()}
          variant="contained"
          disabled={isSubmitting || availablePlayers.length === 0}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface EditBattingStatDialogProps extends BaseDialogProps {
  stat: GameBattingStatLineType | null;
  onClose: () => void;
}

export const EditBattingStatDialog: React.FC<EditBattingStatDialogProps> = ({
  stat,
  onClose,
  accountId,
  seasonId,
  teamSeasonId,
  gameId,
  service,
  onSuccess,
  onError,
}) => {
  const statKey = useMemo(() => (stat ? JSON.stringify(stat) : 'none'), [stat]);

  const updateValues = useMemo(() => {
    if (!stat) {
      return defaultUpdateBattingValues;
    }

    return {
      ab: stat.ab,
      h: stat.h,
      r: stat.r,
      d: stat.d,
      t: stat.t,
      hr: stat.hr,
      rbi: stat.rbi,
      so: stat.so,
      bb: stat.bb,
      hbp: stat.hbp,
      sb: stat.sb,
      cs: stat.cs,
      sf: stat.sf,
      sh: stat.sh,
      re: stat.re,
      intr: stat.intr,
      lob: stat.lob,
    };
  }, [stat]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateGameBattingStatType>({
    resolver: zodResolver(UpdateGameBattingStatSchema),
    defaultValues: defaultUpdateBattingValues,
    values: stat ? updateValues : undefined,
  });

  const [submitErrorState, setSubmitErrorState] = useState<{
    message: string | null;
    contextKey: string;
  }>(() => ({
    message: null,
    contextKey: statKey,
  }));
  const submitError = submitErrorState.contextKey === statKey ? submitErrorState.message : null;
  const setSubmitError = useCallback(
    (message: string | null) => {
      setSubmitErrorState({ message, contextKey: statKey });
    },
    [statKey],
  );

  const submitHandler = handleSubmit(async (values) => {
    if (!gameId || !stat) {
      setSubmitError('Select a game before updating batting statistics.');
      return;
    }

    try {
      setSubmitError(null);
      const updated = await service.updateGameBattingStat(
        accountId,
        seasonId,
        teamSeasonId,
        gameId,
        stat.statId,
        values,
      );

      onSuccess?.({
        message: 'Batting stat updated successfully.',
        stat: updated,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update batting stat. Please retry.';
      setSubmitError(message);
      onError?.(message);
    }
  });

  return (
    <Dialog open={Boolean(stat)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Batting Stat</DialogTitle>
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        {stat && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(3, minmax(0, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {(
                [
                  { name: 'ab', label: 'At Bats' },
                  { name: 'h', label: 'Hits' },
                  { name: 'r', label: 'Runs' },
                  { name: 'rbi', label: 'RBI' },
                  { name: 'd', label: 'Doubles' },
                  { name: 't', label: 'Triples' },
                  { name: 'hr', label: 'Home Runs' },
                  { name: 'so', label: 'Strikeouts' },
                  { name: 'bb', label: 'Walks' },
                  { name: 'hbp', label: 'Hit by Pitch' },
                  { name: 'sb', label: 'Stolen Bases' },
                  { name: 'cs', label: 'Caught Stealing' },
                  { name: 'sf', label: 'Sac Fly' },
                  { name: 'sh', label: 'Sac Bunt' },
                  { name: 're', label: 'Reached on Error' },
                  { name: 'intr', label: 'Interference' },
                  { name: 'lob', label: 'Left on Base' },
                ] as const
              ).map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type="number"
                  fullWidth
                  {...register(field.name, { valueAsNumber: true })}
                  error={Boolean((errors as Record<string, unknown>)[field.name])}
                  helperText={(errors as Record<string, { message?: string }>)[field.name]?.message}
                  inputProps={{ min: 0 }}
                />
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => void submitHandler()}
          variant="contained"
          disabled={isSubmitting || !stat}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
