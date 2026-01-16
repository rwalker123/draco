'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import { ContactDetailsType } from '@draco/shared-schemas';

interface FirstYearCellProps {
  contactDetails?: ContactDetailsType;
  compact?: boolean;
}

const FirstYearCell: React.FC<FirstYearCellProps> = ({ contactDetails, compact = true }) => {
  if (!contactDetails?.firstYear) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography component="span" sx={{ fontSize: '0.75em' }}>
        ⚾
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: compact ? '0.8rem' : '0.875rem',
          lineHeight: 1.2,
        }}
      >
        {contactDetails.firstYear}
      </Typography>
    </Box>
  );
};

export default FirstYearCell;
