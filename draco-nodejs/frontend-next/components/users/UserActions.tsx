'use client';

import React from 'react';
import { Stack } from '@mui/material';
import { UserActionsProps } from '../../types/users';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';

/**
 * UserActions Component
 * Action buttons for user operations (Edit and Delete)
 */
const UserActions: React.FC<UserActionsProps> = ({
  user,
  canManageUsers,
  onEditContact,
  onDeleteContact,
}) => {
  if (!canManageUsers) {
    return null;
  }

  const handleEditContact = () => {
    if (onEditContact) {
      onEditContact(user);
    }
  };

  const handleDeleteContact = () => {
    if (onDeleteContact) {
      onDeleteContact(user);
    }
  };

  return (
    <Stack direction="row" spacing={0.5}>
      {onEditContact && (
        <EditIconButton
          tooltipTitle="Edit Contact"
          onClick={handleEditContact}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        />
      )}

      {onDeleteContact && (
        <DeleteIconButton
          tooltipTitle="Delete Contact"
          onClick={handleDeleteContact}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.04)',
            },
          }}
        />
      )}
    </Stack>
  );
};

export default UserActions;
