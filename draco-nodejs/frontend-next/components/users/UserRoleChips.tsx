'use client';

import React from 'react';
import { Stack, Chip } from '@mui/material';
import { UserRoleChipsProps } from '../../types/users';

/**
 * UserRoleChips Component
 * Displays user roles as chips with removal functionality
 */
const UserRoleChips: React.FC<UserRoleChipsProps> = ({
  roles,
  canManageUsers,
  onRemoveRole,
  getRoleDisplayName,
}) => {
  if (!roles || roles.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {roles.map((role) => (
        <Chip
          key={role.id}
          label={getRoleDisplayName(role)}
          size="small"
          color="primary"
          variant="outlined"
          onDelete={canManageUsers ? () => onRemoveRole(role) : undefined}
        />
      ))}
    </Stack>
  );
};

export default UserRoleChips;
