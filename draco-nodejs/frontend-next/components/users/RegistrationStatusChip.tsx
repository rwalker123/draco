'use client';

import React from 'react';
import { Chip } from '@mui/material';
import { CheckCircle, PersonOutline } from '@mui/icons-material';

interface RegistrationStatusChipProps {
  userId: string | null;
  size?: 'small' | 'medium';
}

/**
 * RegistrationStatusChip Component
 * Displays whether a contact is registered (has userId) or not
 */
const RegistrationStatusChip: React.FC<RegistrationStatusChipProps> = ({
  userId,
  size = 'small',
}) => {
  const isRegistered = !!userId;

  return (
    <Chip
      icon={isRegistered ? <CheckCircle /> : <PersonOutline />}
      label={isRegistered ? 'Registered' : 'Not Registered'}
      color={isRegistered ? 'success' : 'default'}
      variant={isRegistered ? 'filled' : 'outlined'}
      size={size}
      sx={{
        fontWeight: isRegistered ? 'medium' : 'normal',
        minWidth: 120,
      }}
    />
  );
};

export default RegistrationStatusChip;
