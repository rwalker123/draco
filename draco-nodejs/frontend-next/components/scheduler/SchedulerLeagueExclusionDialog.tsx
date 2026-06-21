'use client';

import React, { useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import type {
  SchedulerLeagueExclusion,
  SchedulerLeagueExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerLeagueExclusionUpsertSchema } from '@draco/shared-schemas';
import { BaseSchedulerDialog } from './BaseSchedulerDialog';
import { dateInputToIso, isoToDateInput } from '../../utils/schedulerBlackoutDate';

type LeagueOption = { id: string; name: string };

interface SchedulerLeagueExclusionDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  timeZone: string;
  leagues: LeagueOption[];
  initialExclusion?: SchedulerLeagueExclusion;
  onClose: () => void;
  onSubmit: (input: SchedulerLeagueExclusionUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerLeagueExclusionDialog: React.FC<SchedulerLeagueExclusionDialogProps> = ({
  open,
  mode,
  seasonId,
  timeZone,
  leagues,
  initialExclusion,
  onClose,
  onSubmit,
  loading,
}) => {
  const [leagueSeasonId, setLeagueSeasonId] = useState(
    initialExclusion?.leagueSeasonId ?? leagues[0]?.id ?? '',
  );
  const [startDate, setStartDate] = useState(() =>
    isoToDateInput(initialExclusion?.startTime, timeZone),
  );
  const [endDate, setEndDate] = useState(() => isoToDateInput(initialExclusion?.endTime, timeZone));
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add League Blackout Date' : 'Edit League Blackout Date';

  const handleSubmit = async () => {
    setError(null);
    try {
      if (!leagueSeasonId) {
        setError('Select a league.');
        return;
      }
      if (!startDate) {
        setError('Select a start date.');
        return;
      }
      const effectiveEnd = endDate || startDate;
      if (effectiveEnd < startDate) {
        setError('End date must be on or after the start date.');
        return;
      }

      const trimmedNote = note.trim();
      const payload: SchedulerLeagueExclusionUpsert = SchedulerLeagueExclusionUpsertSchema.parse({
        seasonId,
        leagueSeasonId,
        startTime: dateInputToIso(startDate, timeZone, 'start'),
        endTime: dateInputToIso(effectiveEnd, timeZone, 'end'),
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
        enabled: true,
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid league blackout date';
      setError(message);
    }
  };

  return (
    <BaseSchedulerDialog
      open={open}
      title={title}
      mode={mode}
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
      apiError={error}
    >
      <FormControl fullWidth size="small">
        <InputLabel id="scheduler-league-exclusion-league">League</InputLabel>
        <Select
          labelId="scheduler-league-exclusion-league"
          label="League"
          value={leagueSeasonId}
          onChange={(event) => setLeagueSeasonId(String(event.target.value))}
        >
          {leagues.map((league) => (
            <MenuItem key={league.id} value={league.id}>
              {league.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Start date"
        type="date"
        size="small"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="End date"
        type="date"
        size="small"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        InputLabelProps={{ shrink: true }}
        helperText="Leave blank for a single day."
      />
      <TextField
        label="Note (optional)"
        size="small"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        inputProps={{ maxLength: 255 }}
      />
    </BaseSchedulerDialog>
  );
};
