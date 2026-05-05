'use client';

import React, { useState } from 'react';
import { Tooltip, Box, IconButton, Typography } from '@mui/material';
import { CheckCircle, PersonOutline, Close as CloseIcon } from '@mui/icons-material';

interface RegistrationStatusChipProps {
  userId?: string | undefined;
  contactId?: string;
  size?: 'small' | 'medium';
  canManage?: boolean;
  onRevoke?: (contactId: string) => void;
  onRequestRegister?: () => void;
  loginEmail?: string;
  contactEmail?: string;
}

/**
 * RegistrationStatusChip Component
 * Displays whether a contact is registered (has userId) or not.
 * When the contact's login email differs from its account email, the
 * check is rendered in `warning` (amber) color and the tooltip surfaces
 * both addresses so admins can spot the mismatch.
 */
const RegistrationStatusChip: React.FC<RegistrationStatusChipProps> = ({
  userId,
  contactId,
  size = 'small',
  canManage = false,
  onRevoke,
  onRequestRegister,
  loginEmail,
  contactEmail,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isRegistered = !!userId;
  const hasMismatch = isRegistered && Boolean(loginEmail);
  const iconFontSize = size === 'small' ? 'small' : 'medium';

  const icon = isRegistered ? (
    <CheckCircle color={hasMismatch ? 'warning' : 'success'} fontSize={iconFontSize} />
  ) : (
    <PersonOutline color={onRequestRegister ? 'primary' : 'action'} fontSize={iconFontSize} />
  );

  let tooltipTitle: React.ReactNode;
  if (!isRegistered) {
    tooltipTitle = onRequestRegister ? 'Click to auto register' : 'Not registered';
  } else if (hasMismatch) {
    tooltipTitle = (
      <Box>
        <Typography variant="caption" component="div" sx={{ fontWeight: 600 }}>
          Registered
        </Typography>
        <Typography variant="caption" component="div">
          Login: {loginEmail}
        </Typography>
        {contactEmail && (
          <Typography variant="caption" component="div">
            Account email: {contactEmail}
          </Typography>
        )}
      </Box>
    );
  } else {
    tooltipTitle = 'Registered';
  }

  return (
    <Box
      sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            cursor: !isRegistered && onRequestRegister ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (!isRegistered && onRequestRegister) {
              onRequestRegister();
            }
          }}
        >
          {icon}
        </Box>
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
