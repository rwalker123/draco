'use client';

import React from 'react';
import { Tooltip, IconButton, Box } from '@mui/material';
import {
  getRoleIcon,
  getRoleTooltipText,
  getRoleColors,
  getRoleAccessibilityLabel,
} from '../../utils/roleIcons';
import { UserRole } from '../../types/users';

interface RoleIconProps {
  role: UserRole;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  onClick?: (role: UserRole) => void;
  disabled?: boolean;
}

/**
 * RoleIcon Component
 * Displays a role as an icon with optional tooltip and click handler
 */
const RoleIcon: React.FC<RoleIconProps> = ({
  role,
  size = 'small',
  showTooltip = true,
  onClick,
  disabled = false,
}) => {
  const IconComponent = getRoleIcon(role.roleId);
  const tooltipText = getRoleTooltipText(role);
  const colors = getRoleColors(role.roleId);
  const accessibilityLabel = getRoleAccessibilityLabel(role);

  if (!IconComponent) {
    // Fallback for unknown roles
    return (
      <Tooltip title={tooltipText || 'Unknown Role'} disableHoverListener={!showTooltip}>
        <Box
          sx={{
            width: size === 'small' ? 20 : size === 'medium' ? 24 : 32,
            height: size === 'small' ? 20 : size === 'medium' ? 24 : 32,
            borderRadius: '50%',
            backgroundColor: 'grey.300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
            color: 'grey.600',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease-in-out',
            '&:hover':
              onClick && !disabled
                ? {
                    backgroundColor: 'grey.400',
                    transform: 'scale(1.1)',
                  }
                : {},
          }}
          onClick={onClick && !disabled ? () => onClick(role) : undefined}
          role="button"
          aria-label={accessibilityLabel}
          tabIndex={onClick && !disabled ? 0 : -1}
        >
          ?
        </Box>
      </Tooltip>
    );
  }

  const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 32;

  if (onClick) {
    return (
      <Tooltip title={tooltipText} disableHoverListener={!showTooltip}>
        <IconButton
          size={size}
          onClick={() => onClick(role)}
          disabled={disabled}
          sx={{
            width: iconSize,
            height: iconSize,
            padding: 0,
            color: colors?.primary || 'primary.main',
            backgroundColor: colors?.background || 'transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: colors?.hover || 'primary.light',
              color: colors?.hover ? 'white' : 'primary.contrastText',
              transform: 'scale(1.1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
            '&:focus': {
              outline: '2px solid',
              outlineColor: colors?.primary || 'primary.main',
              outlineOffset: '2px',
            },
            '&.Mui-disabled': {
              color: 'grey.400',
              backgroundColor: 'transparent',
              transform: 'none',
            },
          }}
          aria-label={accessibilityLabel}
        >
          <IconComponent fontSize={size} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipText} disableHoverListener={!showTooltip}>
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors?.primary || 'primary.main',
          backgroundColor: colors?.background || 'transparent',
          borderRadius: '50%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: colors?.hover || 'primary.light',
            color: colors?.hover ? 'white' : 'primary.contrastText',
            transform: 'scale(1.05)',
          },
        }}
        role="img"
        aria-label={accessibilityLabel}
      >
        <IconComponent fontSize={size} />
      </Box>
    </Tooltip>
  );
};

export default RoleIcon;
