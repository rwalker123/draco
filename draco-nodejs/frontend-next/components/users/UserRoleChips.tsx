'use client';

import React from 'react';
import { Stack } from '@mui/material';
import { UserRoleChipsProps } from '../../types/users';
import RoleIcon from './RoleIcon';

/**
 * UserRoleChips Component
 * Displays user roles as icons with removal functionality
 */
const UserRoleChips: React.FC<UserRoleChipsProps> = ({
  roles,
  canManageUsers,
  onRemoveRole,
  getRoleDisplayName: _getRoleDisplayName, // Prefixed with underscore to indicate unused
}) => {
  if (!roles || roles.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {roles.map((role) => {
        return (
          <RoleIcon
            key={role.id}
            role={role}
            size="small"
            showTooltip={true}
            onClick={canManageUsers ? () => onRemoveRole(role) : undefined}
            disabled={!canManageUsers}
          />
        );
      })}
    </Stack>
  );
};

export default UserRoleChips;
