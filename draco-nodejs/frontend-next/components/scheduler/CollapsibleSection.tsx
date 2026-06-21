'use client';

import React, { useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  headerExtra,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          p: 0,
          color: 'inherit',
        }}
        aria-expanded={open}
      >
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {headerExtra}
      </Box>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};
