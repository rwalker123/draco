'use client';

import React from 'react';
import { TableCell, TableRow, Stack, Typography } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { UserCardProps } from '../../types/users';
import UserRoleChips from './UserRoleChips';
import UserActions from './UserActions';
import ContactInfoExpanded from './ContactInfoExpanded';

/**
 * UserCard Component
 * Individual user row display with roles and actions
 */
const UserCard: React.FC<UserCardProps> = ({
  user,
  canManageUsers,
  onAssignRole,
  onRemoveRole,
  getRoleDisplayName,
}) => {
  return (
    <TableRow key={user.id} hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PersonIcon color="action" />
          <Typography variant="subtitle2" fontWeight="bold">
            {user.firstName} {user.lastName}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <ContactInfoExpanded
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          contactDetails={user.contactDetails}
        />
      </TableCell>
      <TableCell>
        <UserRoleChips
          roles={user.roles || []}
          canManageUsers={canManageUsers}
          onRemoveRole={(role) => onRemoveRole(user, role)}
          getRoleDisplayName={getRoleDisplayName}
        />
      </TableCell>
      <TableCell>
        <UserActions user={user} canManageUsers={canManageUsers} onAssignRole={onAssignRole} />
      </TableCell>
    </TableRow>
  );
};

export default UserCard;
