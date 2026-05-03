'use client';

import React, { useState } from 'react';
import { Checkbox, FormControlLabel, TextField } from '@mui/material';
import type {
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerSeasonExclusionUpsertSchema } from '@draco/shared-schemas';
import { BaseSchedulerDialog } from './BaseSchedulerDialog';

interface SchedulerSeasonExclusionDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  initialExclusion?: SchedulerSeasonExclusion;
  onClose: () => void;
  onSubmit: (input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerSeasonExclusionDialog: React.FC<SchedulerSeasonExclusionDialogProps> = ({
  open,
  mode,
  seasonId,
  initialExclusion,
  onClose,
  onSubmit,
  loading,
}) => {
  const [startTime, setStartTime] = useState(initialExclusion?.startTime ?? '');
  const [endTime, setEndTime] = useState(initialExclusion?.endTime ?? '');
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [enabled, setEnabled] = useState(initialExclusion?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Season Exclusion' : 'Edit Season Exclusion';

  const handleSubmit = async () => {
    setError(null);
    try {
      const trimmedNote = note.trim();
      const payload: SchedulerSeasonExclusionUpsert = SchedulerSeasonExclusionUpsertSchema.parse({
        seasonId,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
        enabled,
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid season exclusion';
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
        label="Start (UTC ISO)"
        size="small"
        value={startTime}
        onChange={(event) => setStartTime(event.target.value)}
        placeholder="2026-04-05T13:00:00Z"
        helperText="Use ISO datetime (UTC)."
      />
      <TextField
        label="End (UTC ISO)"
        size="small"
        value={endTime}
        onChange={(event) => setEndTime(event.target.value)}
        placeholder="2026-04-05T15:00:00Z"
        helperText="Use ISO datetime (UTC)."
      />
      <TextField
        label="Note (optional)"
        size="small"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        inputProps={{ maxLength: 255 }}
      />
      <FormControlLabel
        control={
          <Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        }
        label="Enabled"
      />
    </BaseSchedulerDialog>
  );
};
