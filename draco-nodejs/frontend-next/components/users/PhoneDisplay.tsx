'use client';

import React from 'react';
import { Stack, Typography, Chip } from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';
import { ContactDetailsType } from '@draco/shared-schemas';
import { getPhoneNumbers } from '../../utils/contactUtils';

interface PhoneDisplayProps {
  contactDetails: ContactDetailsType;
  compact?: boolean;
}

/**
 * PhoneDisplay Component
 * Displays formatted phone numbers with type indicators
 */
const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ contactDetails, compact = false }) => {
  const phones = getPhoneNumbers(contactDetails);

  if (phones.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No phone numbers
      </Typography>
    );
  }

  if (compact) {
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {phones.map((phone, index) => (
          <Chip
            key={index}
            icon={<PhoneIcon />}
            label={`${phone.type}: ${phone.number}`}
            size="small"
            variant="outlined"
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {phones.map((phone, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={1}>
          <PhoneIcon color="action" fontSize="small" />
          <Typography variant="body2">
            <strong>{phone.type}:</strong> {phone.number}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

export default PhoneDisplay;
