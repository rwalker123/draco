'use client';

import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
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
import { DAYS, maskToSelectedBits, selectedBitsToMask } from '../../utils/daysOfWeekUtils';
import { BaseSchedulerDialog } from './BaseSchedulerDialog';

type FieldOption = { id: string; name: string };

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
  const initialSelectedDays = initialRule
    ? new Set<number>(maskToSelectedBits(initialRule.daysOfWeekMask))
    : new Set<number>([0]);

  const [fieldId, setFieldId] = useState(initialRule?.fieldId ?? fields[0]?.id ?? '');
  const [startDate, setStartDate] = useState(initialRule?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialRule?.endDate ?? '');
  const [startTimeLocal, setStartTimeLocal] = useState(initialRule?.startTimeLocal ?? '09:00');
  const [endTimeLocal, setEndTimeLocal] = useState(initialRule?.endTimeLocal ?? '17:00');
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

    if (selectedDays.size === 0) {
      setError('Select at least one day of the week.');
      return;
    }

    try {
      const trimmedStartDate = startDate.trim();
      const trimmedEndDate = endDate.trim();
      const payload: SchedulerFieldAvailabilityRuleUpsert =
        SchedulerFieldAvailabilityRuleUpsertSchema.parse({
          seasonId,
          fieldId,
          startDate: trimmedStartDate.length > 0 ? trimmedStartDate : undefined,
          endDate: trimmedEndDate.length > 0 ? trimmedEndDate : undefined,
          daysOfWeekMask: selectedBitsToMask(Array.from(selectedDays)),
          startTimeLocal: normalizeTime(startTimeLocal),
          endTimeLocal: normalizeTime(endTimeLocal),
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
    </BaseSchedulerDialog>
  );
};
