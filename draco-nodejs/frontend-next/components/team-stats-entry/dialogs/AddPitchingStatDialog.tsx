'use client';

import React, { useMemo, useState } from 'react';
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
import type { GamePitchingStatLineType, TeamStatsPlayerSummaryType } from '@draco/shared-schemas';
import {
  CreateGamePitchingStatSchema,
  GamePitchingStatInputSchema,
  UpdateGamePitchingStatSchema,
  type UpdateGamePitchingStatType,
} from '@draco/shared-schemas';

import type { TeamStatsEntryService } from '../../../services/teamStatsEntryService';
import { defaultCreatePitchingValues, defaultUpdatePitchingValues } from '../constants';
import { buildPlayerLabel } from '../utils';

interface BaseDialogProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  gameId: string | null;
  service: TeamStatsEntryService;
  onSuccess?: (result: { message: string; stat: GamePitchingStatLineType }) => void;
  onError?: (message: string) => void;
}

interface AddPitchingStatDialogProps extends BaseDialogProps {
  open: boolean;
  onClose: () => void;
  availablePlayers: TeamStatsPlayerSummaryType[];
}

const PitchingDialogSchema = GamePitchingStatInputSchema.extend({
  rosterSeasonId: z.string().min(1, 'Pitcher is required'),
});

type PitchingFormValues = z.infer<typeof PitchingDialogSchema>;

type AddPitchingStatDialogContentProps = Omit<AddPitchingStatDialogProps, 'open'>;

const AddPitchingStatDialogContent: React.FC<AddPitchingStatDialogContentProps> = ({
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
  const defaultValues = useMemo(
    () => ({
      ...defaultCreatePitchingValues,
      rosterSeasonId: availablePlayers[0]?.rosterSeasonId ?? '',
    }),
    [availablePlayers],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PitchingFormValues>({
    resolver: zodResolver(PitchingDialogSchema),
    defaultValues: defaultCreatePitchingValues,
    values: defaultValues,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitHandler = handleSubmit(async (values) => {
    if (!gameId) {
      setSubmitError('Select a game before adding pitching statistics.');
      return;
    }

    try {
      setSubmitError(null);
      const payload = CreateGamePitchingStatSchema.parse({
        ...values,
        rosterSeasonId: BigInt(values.rosterSeasonId),
      });

      const created = await service.createGamePitchingStat(
        accountId,
        seasonId,
        teamSeasonId,
        gameId,
        payload,
      );

      onSuccess?.({
        message: 'Pitching stat added successfully.',
        stat: created,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add pitching stat. Please retry.';
      setSubmitError(message);
      onError?.(message);
    }
  });

  return (
    <>
      <DialogTitle>Add Pitching Stat</DialogTitle>
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {availablePlayers.length === 0 ? (
          <Alert severity="info">
            All available players already have a pitching line for this game.
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
                      label="Pitcher"
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
                  { name: 'ipDecimal', label: 'Innings (e.g. 6.1)' },
                  { name: 'w', label: 'Wins' },
                  { name: 'l', label: 'Losses' },
                  { name: 's', label: 'Saves' },
                  { name: 'h', label: 'Hits Allowed' },
                  { name: 'r', label: 'Runs' },
                  { name: 'er', label: 'Earned Runs' },
                  { name: 'd', label: 'Doubles' },
                  { name: 't', label: 'Triples' },
                  { name: 'hr', label: 'Home Runs' },
                  { name: 'so', label: 'Strikeouts' },
                  { name: 'bb', label: 'Walks' },
                  { name: 'bf', label: 'Batters Faced' },
                  { name: 'wp', label: 'Wild Pitches' },
                  { name: 'hbp', label: 'Hit Batters' },
                  { name: 'bk', label: 'Balks' },
                  { name: 'sc', label: 'Sacrifice Outs' },
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
                  inputProps={{ min: 0, step: field.name === 'ipDecimal' ? 0.1 : 1 }}
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
    </>
  );
};

export const AddPitchingStatDialog: React.FC<AddPitchingStatDialogProps> = ({ open, ...rest }) => (
  <Dialog open={open} onClose={rest.onClose} maxWidth="md" fullWidth>
    {open && <AddPitchingStatDialogContent {...rest} />}
  </Dialog>
);

interface EditPitchingStatDialogProps extends BaseDialogProps {
  stat: GamePitchingStatLineType | null;
  onClose: () => void;
}

type EditPitchingStatDialogContentProps = Omit<EditPitchingStatDialogProps, 'stat'> & {
  stat: GamePitchingStatLineType;
};

const EditPitchingStatDialogContent: React.FC<EditPitchingStatDialogContentProps> = ({
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
  const updateValues = useMemo(
    () => ({
      ipDecimal: stat.ipDecimal,
      w: stat.w,
      l: stat.l,
      s: stat.s,
      h: stat.h,
      r: stat.r,
      er: stat.er,
      d: stat.d,
      t: stat.t,
      hr: stat.hr,
      so: stat.so,
      bb: stat.bb,
      bf: stat.bf,
      wp: stat.wp,
      hbp: stat.hbp,
      bk: stat.bk,
      sc: stat.sc,
    }),
    [stat],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateGamePitchingStatType>({
    resolver: zodResolver(UpdateGamePitchingStatSchema),
    defaultValues: defaultUpdatePitchingValues,
    values: updateValues,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitHandler = handleSubmit(async (values) => {
    if (!gameId || !stat) {
      setSubmitError('Select a game before updating pitching statistics.');
      return;
    }

    try {
      setSubmitError(null);
      const updated = await service.updateGamePitchingStat(
        accountId,
        seasonId,
        teamSeasonId,
        gameId,
        stat.statId,
        values,
      );

      onSuccess?.({
        message: 'Pitching stat updated successfully.',
        stat: updated,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update pitching stat. Please retry.';
      setSubmitError(message);
      onError?.(message);
    }
  });

  return (
    <>
      <DialogTitle>Edit Pitching Stat</DialogTitle>
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

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
                { name: 'ipDecimal', label: 'Innings (e.g. 5.2)' },
                { name: 'w', label: 'Wins' },
                { name: 'l', label: 'Losses' },
                { name: 's', label: 'Saves' },
                { name: 'h', label: 'Hits Allowed' },
                { name: 'r', label: 'Runs' },
                { name: 'er', label: 'Earned Runs' },
                { name: 'd', label: 'Doubles' },
                { name: 't', label: 'Triples' },
                { name: 'hr', label: 'Home Runs' },
                { name: 'so', label: 'Strikeouts' },
                { name: 'bb', label: 'Walks' },
                { name: 'bf', label: 'Batters Faced' },
                { name: 'wp', label: 'Wild Pitches' },
                { name: 'hbp', label: 'Hit Batters' },
                { name: 'bk', label: 'Balks' },
                { name: 'sc', label: 'Sacrifice Outs' },
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
                inputProps={{ min: 0, step: field.name === 'ipDecimal' ? 0.1 : 1 }}
              />
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => void submitHandler()} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </>
  );
};

export const EditPitchingStatDialog: React.FC<EditPitchingStatDialogProps> = ({
  stat,
  ...rest
}) => {
  const open = Boolean(stat);
  return (
    <Dialog open={open} onClose={rest.onClose} maxWidth="md" fullWidth>
      {stat && <EditPitchingStatDialogContent stat={stat} {...rest} />}
    </Dialog>
  );
};
