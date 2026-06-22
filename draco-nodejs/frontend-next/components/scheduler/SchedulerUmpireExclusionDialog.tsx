'use client';

import React, { useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import type {
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerUmpireExclusionUpsertSchema } from '@draco/shared-schemas';
import { BaseSchedulerDialog } from './BaseSchedulerDialog';
import { dateInputToIso, isoToDateInput } from '../../utils/schedulerBlackoutDate';

type UmpireOption = { id: string; name: string };

interface SchedulerUmpireExclusionDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  timeZone: string;
  umpires: UmpireOption[];
  initialExclusion?: SchedulerUmpireExclusion;
  onClose: () => void;
  onSubmit: (input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerUmpireExclusionDialog: React.FC<SchedulerUmpireExclusionDialogProps> = ({
  open,
  mode,
  seasonId,
  timeZone,
  umpires,
  initialExclusion,
  onClose,
  onSubmit,
  loading,
}) => {
  const [umpireId, setUmpireId] = useState(initialExclusion?.umpireId ?? umpires[0]?.id ?? '');
  const [startDate, setStartDate] = useState(() =>
    isoToDateInput(initialExclusion?.startTime, timeZone),
  );
  const [endDate, setEndDate] = useState(() => isoToDateInput(initialExclusion?.endTime, timeZone));
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Umpire Blackout Date' : 'Edit Umpire Blackout Date';

  const handleSubmit = async () => {
    setError(null);
    try {
      if (!umpireId) {
        setError('Select an umpire.');
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
      const payload: SchedulerUmpireExclusionUpsert = SchedulerUmpireExclusionUpsertSchema.parse({
        seasonId,
        umpireId,
        startTime: dateInputToIso(startDate, timeZone, 'start'),
        endTime: dateInputToIso(effectiveEnd, timeZone, 'end'),
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
        enabled: true,
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid umpire blackout date';
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
        <InputLabel id="scheduler-umpire-exclusion-umpire">Umpire</InputLabel>
        <Select
          labelId="scheduler-umpire-exclusion-umpire"
          label="Umpire"
          value={umpireId}
          onChange={(event) => setUmpireId(String(event.target.value))}
        >
          {umpires.map((umpire) => (
            <MenuItem key={umpire.id} value={umpire.id}>
              {umpire.name}
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
