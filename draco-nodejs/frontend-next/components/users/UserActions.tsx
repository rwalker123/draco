'use client';

import React from 'react';
import { IconButton, Tooltip, Stack } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { UserActionsProps } from '../../types/users';

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
        <Tooltip title="Edit Contact">
          <IconButton
            size="small"
            onClick={handleEditContact}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {onDeleteContact && (
        <Tooltip title="Delete Contact">
          <IconButton
            size="small"
            onClick={handleDeleteContact}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'error.main',
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default UserActions;
