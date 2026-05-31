'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

interface SchedulerFieldValuePopoverProps {
  title: string;
  label: string;
  initialValue: string;
  helperText?: string;
  min: number;
  saving: boolean;
  onSave: (rawValue: string) => void;
  onCancel: () => void;
}

export const SchedulerFieldValuePopover: React.FC<SchedulerFieldValuePopoverProps> = ({
  title,
  label,
  initialValue,
  helperText,
  min,
  saving,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);

  return (
    <Box sx={{ p: 2, width: 220 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <TextField
        label={label}
        type="number"
        size="small"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        helperText={helperText}
        slotProps={{ htmlInput: { min, max: 1440, step: 1 } }}
        fullWidth
        autoFocus
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button size="small" color="inherit" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="small" variant="contained" disabled={saving} onClick={() => onSave(value)}>
          Save
        </Button>
      </Box>
    </Box>
  );
};
