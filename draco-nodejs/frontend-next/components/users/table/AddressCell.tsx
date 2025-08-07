'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import { ContactDetails } from '../../../types/users';

interface AddressCellProps {
  contactDetails?: ContactDetails;
  compact?: boolean;
}

/**
 * AddressCell Component
 * Displays address information in a compact table cell format
 */
const AddressCell: React.FC<AddressCellProps> = ({ contactDetails, compact = true }) => {
  if (!contactDetails) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  const { streetaddress, city, state, zip } = contactDetails;

  // Check if we have any address components
  const hasAddress = streetaddress || city || state || zip;

  if (!hasAddress) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  // Format address components
  const addressParts = [];

  if (streetaddress) {
    addressParts.push(streetaddress);
  }

  // City, State ZIP on same line
  const cityStateZip = [city, state, zip].filter(Boolean).join(' ');
  if (cityStateZip) {
    addressParts.push(cityStateZip);
  }

  if (addressParts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
      <Typography component="span" sx={{ fontSize: '0.75em', mt: 0.25 }}>
        📍
      </Typography>
      <Box>
        {addressParts.map((part, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{
              fontSize: compact ? '0.8rem' : '0.875rem',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {part}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default AddressCell;
