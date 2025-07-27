'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { UserActionsProps } from '../../types/users';

/**
 * UserActions Component
 * Action buttons for user operations
 */
const UserActions: React.FC<UserActionsProps> = ({ user, canManageUsers, onAssignRole }) => {
  if (!canManageUsers) {
    return null;
  }

  return (
    <Tooltip title="Assign Role">
      <IconButton size="small" onClick={() => onAssignRole(user)} color="primary">
        <SecurityIcon />
      </IconButton>
    </Tooltip>
  );
};

export default UserActions;
