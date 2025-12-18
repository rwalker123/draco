'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import type {
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
} from '@draco/shared-schemas';
import { SchedulerFieldExclusionDateUpsertSchema } from '@draco/shared-schemas';

type FieldOption = { id: string; name: string };

interface SchedulerFieldExclusionDateDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  fields: FieldOption[];
  initialExclusion?: SchedulerFieldExclusionDate;
  onClose: () => void;
  onSubmit: (input: SchedulerFieldExclusionDateUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerFieldExclusionDateDialog: React.FC<
  SchedulerFieldExclusionDateDialogProps
> = ({ open, mode, seasonId, fields, initialExclusion, onClose, onSubmit, loading }) => {
  const [fieldId, setFieldId] = useState(initialExclusion?.fieldId ?? fields[0]?.id ?? '');
  const [date, setDate] = useState(initialExclusion?.date ?? '');
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [enabled, setEnabled] = useState(initialExclusion?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Field Exclusion Date' : 'Edit Field Exclusion Date';

  const handleSubmit = async () => {
    setError(null);
    try {
      const trimmedNote = note.trim();
      const payload: SchedulerFieldExclusionDateUpsert =
        SchedulerFieldExclusionDateUpsertSchema.parse({
          seasonId,
          fieldId,
          date,
          note: trimmedNote.length > 0 ? trimmedNote : undefined,
          enabled,
        });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid exclusion date';
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
            <InputLabel id="scheduler-exclusion-field">Field</InputLabel>
            <Select
              labelId="scheduler-exclusion-field"
              label="Field"
              value={fieldId}
              onChange={(event) => setFieldId(String(event.target.value))}
            >
              {fields.map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  {field.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Date"
            type="date"
            size="small"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
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
