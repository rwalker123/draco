'use client';

import React, { useState } from 'react';
import { Tooltip, Box, IconButton } from '@mui/material';
import { CheckCircle, PersonOutline, Close as CloseIcon } from '@mui/icons-material';

interface RegistrationStatusChipProps {
  userId?: string | undefined;
  contactId?: string;
  size?: 'small' | 'medium';
  canManage?: boolean;
  onRevoke?: (contactId: string) => void;
}

/**
 * RegistrationStatusChip Component
 * Displays whether a contact is registered (has userId) or not
 */
const RegistrationStatusChip: React.FC<RegistrationStatusChipProps> = ({
  userId,
  contactId,
  size = 'small',
  canManage = false,
  onRevoke,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isRegistered = !!userId;

  const icon = isRegistered ? (
    <CheckCircle color="success" fontSize={size === 'small' ? 'small' : 'medium'} />
  ) : (
    <PersonOutline color="action" fontSize={size === 'small' ? 'small' : 'medium'} />
  );

  return (
    <Box
      sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip title={isRegistered ? 'Registered' : 'Not registered'} placement="top" arrow>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</Box>
      </Tooltip>

      {isRegistered && canManage && onRevoke && contactId && isHovered && (
        <Tooltip title="Remove registration">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRevoke(contactId);
            }}
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: 'background.paper',
              color: 'error.main',
              boxShadow: 2,
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white',
              },
              padding: '2px',
              width: size === 'small' ? 20 : 24,
              height: size === 'small' ? 20 : 24,
            }}
          >
            <CloseIcon
              fontSize={size === 'small' ? 'inherit' : 'small'}
              sx={{ fontSize: size === 'small' ? 12 : 16 }}
            />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default RegistrationStatusChip;
