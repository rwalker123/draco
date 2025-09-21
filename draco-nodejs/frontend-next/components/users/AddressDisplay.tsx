'use client';

import React from 'react';
import { Stack, Typography } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import { ContactDetailsType } from '@draco/shared-schemas';
import { formatAddress } from '../../utils/contactUtils';

interface AddressDisplayProps {
  contactDetails: ContactDetailsType;
  compact?: boolean;
}

/**
 * AddressDisplay Component
 * Displays formatted address information
 */
const AddressDisplay: React.FC<AddressDisplayProps> = ({ contactDetails, compact = false }) => {
  const address = formatAddress(contactDetails);

  if (!address) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No address
      </Typography>
    );
  }

  if (compact) {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <LocationIcon color="action" fontSize="small" />
        <Typography variant="body2" noWrap>
          {address}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <LocationIcon color="action" fontSize="small" />
        <Typography variant="body2" fontWeight="bold">
          Address:
        </Typography>
      </Stack>

      <Stack spacing={0.5} sx={{ pl: 3 }}>
        {contactDetails.streetAddress && (
          <Typography variant="body2">{contactDetails.streetAddress}</Typography>
        )}

        {(contactDetails.city || contactDetails.state || contactDetails.zip) && (
          <Typography variant="body2">
            {[contactDetails.city, contactDetails.state, contactDetails.zip]
              .filter(Boolean)
              .join(', ')}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default AddressDisplay;
