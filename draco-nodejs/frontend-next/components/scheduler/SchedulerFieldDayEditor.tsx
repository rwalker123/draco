'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DAYS } from '../../utils/daysOfWeekUtils';
import type { DraftClosedDate, DraftDayMap } from './SchedulerFieldsConfig';
import { applyQuickSetToDays } from './SchedulerFieldsConfig';

interface SchedulerFieldDayEditorProps {
  draftDays: DraftDayMap;
  draftGameLength: string;
  draftBuffer: string;
  draftClosedDates: DraftClosedDate[];
  saving: boolean;
  onDraftDaysChange: (next: DraftDayMap) => void;
  onDraftGameLengthChange: (value: string) => void;
  onDraftBufferChange: (value: string) => void;
  onDraftClosedDatesChange: (next: DraftClosedDate[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '21:00';

export const SchedulerFieldDayEditor: React.FC<SchedulerFieldDayEditorProps> = ({
  draftDays,
  draftGameLength,
  draftBuffer,
  draftClosedDates,
  saving,
  onDraftDaysChange,
  onDraftGameLengthChange,
  onDraftBufferChange,
  onDraftClosedDatesChange,
  onSave,
  onCancel,
}) => {
  const [quickStart, setQuickStart] = useState(DEFAULT_START);
  const [quickEnd, setQuickEnd] = useState(DEFAULT_END);

  const handleDayToggle = (bit: number, checked: boolean) => {
    const next = new Map(draftDays);
    const existing = next.get(bit) ?? { open: false, start: DEFAULT_START, end: DEFAULT_END };
    next.set(bit, { ...existing, open: checked });
    onDraftDaysChange(next);
  };

  const handleDayTime = (bit: number, field: 'start' | 'end', value: string) => {
    const next = new Map(draftDays);
    const existing = next.get(bit) ?? { open: true, start: DEFAULT_START, end: DEFAULT_END };
    next.set(bit, { ...existing, [field]: value });
    onDraftDaysChange(next);
  };

  const applyQuickSet = (bits: number[]) => {
    onDraftDaysChange(applyQuickSetToDays(draftDays, bits, quickStart, quickEnd));
  };

  const handleAddClosedDate = () => {
    const key = `new-${Date.now()}`;
    onDraftClosedDatesChange([...draftClosedDates, { key, date: '', note: '' }]);
  };

  const handleRemoveClosedDate = (key: string) => {
    onDraftClosedDatesChange(draftClosedDates.filter((cd) => cd.key !== key));
  };

  const handleClosedDateChange = (key: string, field: 'date' | 'note', value: string) => {
    onDraftClosedDatesChange(
      draftClosedDates.map((cd) => (cd.key === key ? { ...cd, [field]: value } : cd)),
    );
  };

  const weekdayBits = DAYS.filter((d) => d.bit <= 4).map((d) => d.bit);
  const weekendBits = DAYS.filter((d) => d.bit >= 5).map((d) => d.bit);
  const allBits = DAYS.map((d) => d.bit);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Quick Set
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
          <TextField
            label="Start"
            type="time"
            size="small"
            value={quickStart}
            onChange={(e) => setQuickStart(e.target.value)}
            slotProps={{ htmlInput: { step: 60 } }}
            sx={{ width: 130 }}
          />
          <TextField
            label="End"
            type="time"
            size="small"
            value={quickEnd}
            onChange={(e) => setQuickEnd(e.target.value)}
            slotProps={{ htmlInput: { step: 60 } }}
            sx={{ width: 130 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={() => applyQuickSet(weekdayBits)}>
            Weekdays
          </Button>
          <Button size="small" variant="outlined" onClick={() => applyQuickSet(weekendBits)}>
            Weekends
          </Button>
          <Button size="small" variant="outlined" onClick={() => applyQuickSet(allBits)}>
            All Days
          </Button>
        </Box>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Open Hours
        </Typography>
        <Stack spacing={1}>
          {DAYS.map((day) => {
            const entry = draftDays.get(day.bit) ?? {
              open: false,
              start: DEFAULT_START,
              end: DEFAULT_END,
            };
            return (
              <Box
                key={day.bit}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entry.open}
                      size="small"
                      onChange={(e) => handleDayToggle(day.bit, e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ width: 32 }}>
                      {day.label}
                    </Typography>
                  }
                  sx={{ mr: 0, minWidth: 80 }}
                />
                <TextField
                  type="time"
                  size="small"
                  value={entry.start}
                  disabled={!entry.open}
                  onChange={(e) => handleDayTime(day.bit, 'start', e.target.value)}
                  slotProps={{ htmlInput: { step: 60 } }}
                  sx={{ width: 120 }}
                />
                <Typography variant="body2">–</Typography>
                <TextField
                  type="time"
                  size="small"
                  value={entry.end}
                  disabled={!entry.open}
                  onChange={(e) => handleDayTime(day.bit, 'end', e.target.value)}
                  slotProps={{ htmlInput: { step: 60 } }}
                  sx={{ width: 120 }}
                />
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Game Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Game Length (min)"
            type="number"
            size="small"
            value={draftGameLength}
            onChange={(e) => onDraftGameLengthChange(e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: 1440, step: 1 } }}
            helperText="Leave blank for default"
            sx={{ width: 180 }}
          />
          <TextField
            label="Buffer (min)"
            type="number"
            size="small"
            value={draftBuffer}
            onChange={(e) => onDraftBufferChange(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 1440, step: 1 } }}
            sx={{ width: 180 }}
          />
        </Box>
      </Box>

      <Divider />

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Closed Dates</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddClosedDate}>
            Add Date
          </Button>
        </Box>
        {draftClosedDates.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No closed dates configured.
          </Typography>
        )}
        <Stack spacing={1}>
          {draftClosedDates.map((cd) => (
            <Box
              key={cd.key}
              sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <TextField
                type="date"
                size="small"
                value={cd.date}
                onChange={(e) => handleClosedDateChange(cd.key, 'date', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
              <TextField
                label="Note (optional)"
                size="small"
                value={cd.note}
                onChange={(e) => handleClosedDateChange(cd.key, 'note', e.target.value)}
                slotProps={{ htmlInput: { maxLength: 255 } }}
                sx={{ flex: 1, minWidth: 140 }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveClosedDate(cd.key)}
                aria-label="Remove closed date"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Save
        </Button>
      </Box>
    </Stack>
  );
};
