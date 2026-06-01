'use client';

import React, { useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { FieldScheduleConfigUpsertType } from '@draco/shared-schemas';
import { DAYS } from '../../utils/daysOfWeekUtils';
import {
  applyQuickSetToDays,
  buildOpenHoursPayload,
  dateToHhmm,
  DEFAULT_OPEN_END,
  DEFAULT_OPEN_START,
  hhmmToDate,
  type DraftDayMap,
} from './schedulerFieldConfigHelpers';

interface SchedulerFieldOpenHoursPopoverProps {
  initialDays: DraftDayMap;
  saving: boolean;
  onSave: (openHours: FieldScheduleConfigUpsertType['openHours']) => void;
  onCancel: () => void;
}

const timeFieldSlotProps = { textField: { size: 'small' as const, sx: { width: 140 } } };

export const SchedulerFieldOpenHoursPopover: React.FC<SchedulerFieldOpenHoursPopoverProps> = ({
  initialDays,
  saving,
  onSave,
  onCancel,
}) => {
  const [draftDays, setDraftDays] = useState<DraftDayMap>(() => new Map(initialDays));
  const [quickStart, setQuickStart] = useState(DEFAULT_OPEN_START);
  const [quickEnd, setQuickEnd] = useState(DEFAULT_OPEN_END);

  const handleDayToggle = (bit: number, checked: boolean) => {
    const next = new Map(draftDays);
    const existing = next.get(bit) ?? {
      open: false,
      start: DEFAULT_OPEN_START,
      end: DEFAULT_OPEN_END,
    };
    next.set(bit, { ...existing, open: checked });
    setDraftDays(next);
  };

  const handleDayTime = (bit: number, field: 'start' | 'end', value: Date | null) => {
    const hhmm = dateToHhmm(value);
    if (!hhmm) return;
    const next = new Map(draftDays);
    const existing = next.get(bit) ?? {
      open: true,
      start: DEFAULT_OPEN_START,
      end: DEFAULT_OPEN_END,
    };
    next.set(bit, { ...existing, [field]: hhmm });
    setDraftDays(next);
  };

  const applyQuickSet = (bits: number[]) => {
    setDraftDays(applyQuickSetToDays(draftDays, bits, quickStart, quickEnd));
  };

  const weekdayBits = DAYS.filter((d) => d.bit <= 4).map((d) => d.bit);
  const weekendBits = DAYS.filter((d) => d.bit >= 5).map((d) => d.bit);
  const allBits = DAYS.map((d) => d.bit);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2, width: 440 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Open Hours
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <TimePicker
            label="Start"
            value={hhmmToDate(quickStart)}
            onChange={(value) => setQuickStart(dateToHhmm(value) || quickStart)}
            slotProps={timeFieldSlotProps}
          />
          <TimePicker
            label="End"
            value={hhmmToDate(quickEnd)}
            onChange={(value) => setQuickEnd(dateToHhmm(value) || quickEnd)}
            slotProps={timeFieldSlotProps}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
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

        <Stack spacing={1}>
          {DAYS.map((day) => {
            const entry = draftDays.get(day.bit) ?? {
              open: false,
              start: DEFAULT_OPEN_START,
              end: DEFAULT_OPEN_END,
            };
            return (
              <Box key={day.bit} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  sx={{ mr: 0, minWidth: 72 }}
                />
                <TimePicker
                  value={hhmmToDate(entry.start)}
                  disabled={!entry.open}
                  onChange={(value) => handleDayTime(day.bit, 'start', value)}
                  slotProps={timeFieldSlotProps}
                />
                <Typography variant="body2">–</Typography>
                <TimePicker
                  value={hhmmToDate(entry.end)}
                  disabled={!entry.open}
                  onChange={(value) => handleDayTime(day.bit, 'end', value)}
                  slotProps={timeFieldSlotProps}
                />
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button size="small" color="inherit" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={saving}
            onClick={() => onSave(buildOpenHoursPayload(draftDays))}
          >
            Save
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
