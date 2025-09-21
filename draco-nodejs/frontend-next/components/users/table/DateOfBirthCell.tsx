'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import { ContactDetailsType } from '@draco/shared-schemas';
import { formatDateOfBirth } from '../../../utils/dateUtils';

interface DateOfBirthCellProps {
  contactDetails?: ContactDetailsType;
  compact?: boolean;
}

/**
 * DateOfBirthCell Component
 * Displays date of birth in a compact table cell format
 */
const DateOfBirthCell: React.FC<DateOfBirthCellProps> = ({ contactDetails, compact = true }) => {
  if (!contactDetails?.dateOfBirth) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  const formattedDate = formatDateOfBirth(contactDetails.dateOfBirth);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography component="span" sx={{ fontSize: '0.75em' }}>
        🎂
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: compact ? '0.8rem' : '0.875rem',
          lineHeight: 1.2,
        }}
      >
        {formattedDate}
      </Typography>
    </Box>
  );
};

export default DateOfBirthCell;
