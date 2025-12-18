'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type {
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldAvailabilityRule,
} from '@draco/shared-schemas';
import { SchedulerFieldAvailabilityRuleUpsertSchema } from '@draco/shared-schemas';

type FieldOption = { id: string; name: string };

const DAYS: Array<{ label: string; bit: number }> = [
  { label: 'Mon', bit: 0 },
  { label: 'Tue', bit: 1 },
  { label: 'Wed', bit: 2 },
  { label: 'Thu', bit: 3 },
  { label: 'Fri', bit: 4 },
  { label: 'Sat', bit: 5 },
  { label: 'Sun', bit: 6 },
];

const maskToSelectedBits = (mask: number): Set<number> => {
  const selected = new Set<number>();
  for (const day of DAYS) {
    if ((mask & (1 << day.bit)) !== 0) {
      selected.add(day.bit);
    }
  }
  return selected;
};

const selectedBitsToMask = (selected: Set<number>): number => {
  let mask = 0;
  selected.forEach((bit) => {
    mask |= 1 << bit;
  });
  return mask;
};

const normalizeTime = (value: string): string => {
  if (value.length >= 5) {
    return value.slice(0, 5);
  }
  return value;
};

interface SchedulerFieldAvailabilityRuleDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  fields: FieldOption[];
  initialRule?: SchedulerFieldAvailabilityRule;
  onClose: () => void;
  onSubmit: (input: SchedulerFieldAvailabilityRuleUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerFieldAvailabilityRuleDialog: React.FC<
  SchedulerFieldAvailabilityRuleDialogProps
> = ({ open, mode, seasonId, fields, initialRule, onClose, onSubmit, loading }) => {
  const initialSelectedDays = useMemo(() => {
    return initialRule ? maskToSelectedBits(initialRule.daysOfWeekMask) : new Set<number>([0]);
  }, [initialRule]);

  const [fieldId, setFieldId] = useState(initialRule?.fieldId ?? fields[0]?.id ?? '');
  const [startDate, setStartDate] = useState(initialRule?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialRule?.endDate ?? '');
  const [startTimeLocal, setStartTimeLocal] = useState(initialRule?.startTimeLocal ?? '09:00');
  const [endTimeLocal, setEndTimeLocal] = useState(initialRule?.endTimeLocal ?? '17:00');
  const [startIncrementMinutes, setStartIncrementMinutes] = useState<number>(
    initialRule?.startIncrementMinutes ?? 60,
  );
  const [enabled, setEnabled] = useState(initialRule?.enabled ?? true);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(initialSelectedDays);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Field Availability Rule' : 'Edit Field Availability Rule';

  const handleToggleDay = (bit: number) => {
    const next = new Set(selectedDays);
    if (next.has(bit)) {
      next.delete(bit);
    } else {
      next.add(bit);
    }
    setSelectedDays(next);
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      const trimmedStartDate = startDate.trim();
      const trimmedEndDate = endDate.trim();
      const payload: SchedulerFieldAvailabilityRuleUpsert =
        SchedulerFieldAvailabilityRuleUpsertSchema.parse({
          seasonId,
          fieldId,
          startDate: trimmedStartDate.length > 0 ? trimmedStartDate : undefined,
          endDate: trimmedEndDate.length > 0 ? trimmedEndDate : undefined,
          daysOfWeekMask: selectedBitsToMask(selectedDays),
          startTimeLocal: normalizeTime(startTimeLocal),
          endTimeLocal: normalizeTime(endTimeLocal),
          startIncrementMinutes,
          enabled,
        });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid rule';
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
            <InputLabel id="scheduler-rule-field">Field</InputLabel>
            <Select
              labelId="scheduler-rule-field"
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

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Optional"
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Optional"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Start Time (local)"
              type="time"
              size="small"
              value={startTimeLocal}
              onChange={(event) => setStartTimeLocal(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="End Time (local)"
              type="time"
              size="small"
              value={endTimeLocal}
              onChange={(event) => setEndTimeLocal(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="Increment (minutes)"
              type="number"
              size="small"
              value={startIncrementMinutes}
              onChange={(event) => setStartIncrementMinutes(Number(event.target.value))}
              inputProps={{ min: 1, max: 1440 }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Days of Week (Mon=0)
            </Typography>
            <FormGroup row>
              {DAYS.map((day) => (
                <FormControlLabel
                  key={day.bit}
                  control={
                    <Checkbox
                      checked={selectedDays.has(day.bit)}
                      onChange={() => handleToggleDay(day.bit)}
                    />
                  }
                  label={day.label}
                />
              ))}
            </FormGroup>
          </Box>

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
