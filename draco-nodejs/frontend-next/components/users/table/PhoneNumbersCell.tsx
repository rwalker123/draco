'use client';

import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import { ContactDetails } from '../../../types/users';

interface PhoneNumbersCellProps {
  contactDetails?: ContactDetails;
  compact?: boolean;
}

/**
 * PhoneNumbersCell Component
 * Displays phone numbers in a compact table cell format
 */
const PhoneNumbersCell: React.FC<PhoneNumbersCellProps> = ({ contactDetails, compact = true }) => {
  if (!contactDetails) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  const phones = [
    { label: 'Home', value: contactDetails.phone1, icon: '🏠' },
    { label: 'Cell', value: contactDetails.phone2, icon: '📱' },
    { label: 'Work', value: contactDetails.phone3, icon: '💼' },
  ].filter((phone) => phone.value && phone.value.trim() !== '');

  if (phones.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  if (compact && phones.length === 1) {
    // Single phone number - show on one line
    return (
      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <span>{phones[0].icon}</span>
          {phones[0].value}
        </Box>
      </Typography>
    );
  }

  return (
    <Stack spacing={0.25}>
      {phones.map((phone, index) => (
        <Typography
          key={index}
          variant="body2"
          sx={{
            fontSize: compact ? '0.8rem' : '0.875rem',
            lineHeight: 1.2,
          }}
        >
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <span style={{ fontSize: '0.75em' }}>{phone.icon}</span>
            <span>{phone.value}</span>
          </Box>
        </Typography>
      ))}
    </Stack>
  );
};

export default PhoneNumbersCell;
