'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

interface SchedulerFieldGameLengthPopoverProps {
  initialMinutes: number | null;
  saving: boolean;
  onSave: (minutes: number | null) => void;
  onCancel: () => void;
}

export const SchedulerFieldGameLengthPopover: React.FC<SchedulerFieldGameLengthPopoverProps> = ({
  initialMinutes,
  saving,
  onSave,
  onCancel,
}) => {
  const [hours, setHours] = useState(
    initialMinutes != null ? String(Math.floor(initialMinutes / 60)) : '',
  );
  const [minutes, setMinutes] = useState(initialMinutes != null ? String(initialMinutes % 60) : '');

  const handleSave = () => {
    const h = Number(hours.trim() || '0');
    const m = Number(minutes.trim() || '0');
    const total = h * 60 + m;
    onSave(total > 0 ? total : null);
  };

  return (
    <Box sx={{ p: 2, width: 280 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Game Length
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          label="Hours"
          type="number"
          size="small"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          slotProps={{ htmlInput: { min: 0, max: 24, step: 1 } }}
          sx={{ width: 100 }}
          autoFocus
        />
        <TextField
          label="Minutes"
          type="number"
          size="small"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          slotProps={{ htmlInput: { min: 0, max: 59, step: 5 } }}
          sx={{ width: 100 }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        Leave blank for the default length.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button size="small" color="inherit" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="small" variant="contained" disabled={saving} onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
};
