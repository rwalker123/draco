'use client';

import React, { useState } from 'react';
import { TextField } from '@mui/material';
import type {
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerSeasonExclusionUpsertSchema } from '@draco/shared-schemas';
import { BaseSchedulerDialog } from './BaseSchedulerDialog';
import { dateInputToIso, isoToDateInput } from '../../utils/schedulerBlackoutDate';

interface SchedulerSeasonExclusionDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  timeZone: string;
  initialExclusion?: SchedulerSeasonExclusion;
  onClose: () => void;
  onSubmit: (input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerSeasonExclusionDialog: React.FC<SchedulerSeasonExclusionDialogProps> = ({
  open,
  mode,
  seasonId,
  timeZone,
  initialExclusion,
  onClose,
  onSubmit,
  loading,
}) => {
  const [startDate, setStartDate] = useState(() =>
    isoToDateInput(initialExclusion?.startTime, timeZone),
  );
  const [endDate, setEndDate] = useState(() => isoToDateInput(initialExclusion?.endTime, timeZone));
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Blackout Date' : 'Edit Blackout Date';

  const handleSubmit = async () => {
    setError(null);
    try {
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
      const payload: SchedulerSeasonExclusionUpsert = SchedulerSeasonExclusionUpsertSchema.parse({
        seasonId,
        startTime: dateInputToIso(startDate, timeZone, 'start'),
        endTime: dateInputToIso(effectiveEnd, timeZone, 'end'),
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
        enabled: true,
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid blackout date';
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
