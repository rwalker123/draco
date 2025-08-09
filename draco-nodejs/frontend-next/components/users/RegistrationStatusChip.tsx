'use client';

import React from 'react';
import { Tooltip } from '@mui/material';
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
    <Tooltip title={isRegistered ? 'Registered' : 'Not registered'} placement="top" arrow>
      {isRegistered ? (
        <CheckCircle color="success" fontSize={size === 'small' ? 'small' : 'medium'} />
      ) : (
        <PersonOutline color="action" fontSize={size === 'small' ? 'small' : 'medium'} />
      )}
    </Tooltip>
  );
};

export default RegistrationStatusChip;
