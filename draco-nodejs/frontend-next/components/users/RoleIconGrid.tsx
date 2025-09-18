'use client';

import React from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import RoleIcon from './RoleIcon';
import { ContactRoleType } from '@draco/shared-schemas';

interface RoleIconGridProps {
  roles: ContactRoleType[];
  canManageUsers?: boolean;
  onRemoveRole?: (role: ContactRoleType) => void;
  maxVisible?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  compact?: boolean;
}

/**
 * RoleIconGrid Component
 * Displays roles in a compact grid layout with optional overflow handling
 */
const RoleIconGrid: React.FC<RoleIconGridProps> = ({
  roles,
  canManageUsers = false,
  onRemoveRole,
  maxVisible = 5,
  size = 'small',
  showCount = false,
  compact = false,
}) => {
  if (!roles || roles.length === 0) {
    return null;
  }

  const visibleRoles = roles.slice(0, maxVisible);
  const hiddenCount = roles.length - maxVisible;

  const handleRoleClick = (role: ContactRoleType) => {
    if (canManageUsers && onRemoveRole) {
      onRemoveRole(role);
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Stack direction="row" spacing={0.25}>
          {visibleRoles.map((role) => (
            <RoleIcon
              key={role.id}
              role={role}
              size={size}
              showTooltip={true}
              onClick={handleRoleClick}
              disabled={!canManageUsers}
            />
          ))}
        </Stack>

        {hiddenCount > 0 && (
          <Tooltip title={`${hiddenCount} more role${hiddenCount > 1 ? 's' : ''}`}>
            <Box
              sx={{
                width: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
                height: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
                borderRadius: '50%',
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '14px',
                color: 'grey.600',
                fontWeight: 'bold',
                transition: 'all 0.2s ease-in-out',
                cursor: 'help',
                '&:hover': {
                  backgroundColor: 'grey.300',
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            >
              +{hiddenCount}
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {visibleRoles.map((role) => (
          <RoleIcon
            key={role.id}
            role={role}
            size={size}
            showTooltip={true}
            onClick={handleRoleClick}
            disabled={!canManageUsers}
          />
        ))}

        {hiddenCount > 0 && (
          <Tooltip title={`${hiddenCount} more role${hiddenCount > 1 ? 's' : ''}`}>
            <Box
              sx={{
                width: size === 'small' ? 20 : size === 'medium' ? 24 : 32,
                height: size === 'small' ? 20 : size === 'medium' ? 24 : 32,
                borderRadius: '50%',
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '14px',
                color: 'grey.600',
                fontWeight: 'bold',
                cursor: 'help',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'grey.300',
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            >
              +{hiddenCount}
            </Box>
          </Tooltip>
        )}
      </Stack>

      {showCount && roles.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {roles.length} role{roles.length > 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default RoleIconGrid;
