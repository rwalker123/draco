'use client';

import React, { useState } from 'react';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { FieldScheduleConfigUpsertType } from '@draco/shared-schemas';
import {
  buildClosedDatesPayload,
  dateToIsoDate,
  isoDateToDate,
  type DraftClosedDate,
} from './schedulerFieldConfigHelpers';

interface SchedulerFieldClosedDatesPopoverProps {
  initialClosedDates: DraftClosedDate[];
  saving: boolean;
  onSave: (closedDates: FieldScheduleConfigUpsertType['closedDates']) => void;
  onCancel: () => void;
}

let keyCounter = 0;

export const SchedulerFieldClosedDatesPopover: React.FC<SchedulerFieldClosedDatesPopoverProps> = ({
  initialClosedDates,
  saving,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<DraftClosedDate[]>(() =>
    initialClosedDates.map((cd) => ({ ...cd })),
  );

  const handleAdd = () => {
    keyCounter += 1;
    setDraft([...draft, { key: `new-${keyCounter}`, date: '', endDate: '', note: '' }]);
  };

  const handleRemove = (key: string) => {
    setDraft(draft.filter((cd) => cd.key !== key));
  };

  const handleStartChange = (key: string, value: Date | null) => {
    const iso = dateToIsoDate(value);
    setDraft(
      draft.map((cd) => {
        if (cd.key !== key) return cd;
        // Keep the end on/after the new start.
        const endDate = cd.endDate && cd.endDate < iso ? '' : cd.endDate;
        return { ...cd, date: iso, endDate };
      }),
    );
  };

  const handleEndChange = (key: string, value: Date | null) => {
    const iso = dateToIsoDate(value);
    setDraft(draft.map((cd) => (cd.key === key ? { ...cd, endDate: iso } : cd)));
  };

  const handleNoteChange = (key: string, value: string) => {
    setDraft(draft.map((cd) => (cd.key === key ? { ...cd, note: value } : cd)));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2, width: 480 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Blackout Dates</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Date
          </Button>
        </Box>

        {draft.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No blackout dates configured.
          </Typography>
        )}

        <Stack spacing={2} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
          {draft.map((cd) => {
            const start = isoDateToDate(cd.date);
            return (
              <Stack key={cd.key} spacing={1}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <DatePicker
                    label="Start"
                    value={start}
                    onChange={(value) => handleStartChange(cd.key, value)}
                    slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                  />
                  <Typography variant="body2">–</Typography>
                  <DatePicker
                    label="End (optional)"
                    value={isoDateToDate(cd.endDate)}
                    minDate={start ?? undefined}
                    onChange={(value) => handleEndChange(cd.key, value)}
                    slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(cd.key)}
                    aria-label="Remove closed date"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  label="Note"
                  size="small"
                  value={cd.note}
                  onChange={(e) => handleNoteChange(cd.key, e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 255 } }}
                  fullWidth
                />
              </Stack>
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
            onClick={() => onSave(buildClosedDatesPayload(draft))}
          >
            Save
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
