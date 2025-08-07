'use client';

import React from 'react';
import { Stack, IconButton, Tooltip, Badge } from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { UserRoleChipsProps } from '../../types/users';
import RoleIcon from './RoleIcon';

/**
 * UserRoleChips Component
 * Displays user roles as icons with removal functionality and assign role button
 */
const UserRoleChips: React.FC<UserRoleChipsProps> = ({
  roles,
  canManageUsers,
  onRemoveRole,
  onAssignRole,
  user,
  getRoleDisplayName: _getRoleDisplayName, // Prefixed with underscore to indicate unused
}) => {
  const handleAssignRole = async () => {
    if (onAssignRole) {
      await onAssignRole(user);
    }
  };

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
      {roles && roles.length > 0 && (
        <>
          {roles.map((role) => (
            <RoleIcon
              key={role.id}
              role={role}
              size="small"
              showTooltip={true}
              onClick={canManageUsers ? () => onRemoveRole(role) : undefined}
              disabled={!canManageUsers}
            />
          ))}
        </>
      )}

      {canManageUsers && onAssignRole && (
        <Tooltip title="Assign Role">
          <IconButton
            size="small"
            onClick={handleAssignRole}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <Badge
              badgeContent={roles?.length || 0}
              color="primary"
              max={99}
              showZero={false}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  minWidth: '16px',
                  height: '16px',
                },
              }}
            >
              <PersonAddIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default UserRoleChips;
