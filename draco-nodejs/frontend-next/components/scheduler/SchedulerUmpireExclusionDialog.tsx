'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type {
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerUmpireExclusionUpsertSchema } from '@draco/shared-schemas';

type UmpireOption = { id: string; name: string };

interface SchedulerUmpireExclusionDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
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
  umpires,
  initialExclusion,
  onClose,
  onSubmit,
  loading,
}) => {
  const [umpireId, setUmpireId] = useState(initialExclusion?.umpireId ?? umpires[0]?.id ?? '');
  const [startTime, setStartTime] = useState(initialExclusion?.startTime ?? '');
  const [endTime, setEndTime] = useState(initialExclusion?.endTime ?? '');
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [enabled, setEnabled] = useState(initialExclusion?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Umpire Exclusion' : 'Edit Umpire Exclusion';

  const handleSubmit = async () => {
    setError(null);
    try {
      const trimmedNote = note.trim();
      const payload: SchedulerUmpireExclusionUpsert = SchedulerUmpireExclusionUpsertSchema.parse({
        seasonId,
        umpireId,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
        enabled,
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid umpire exclusion';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
