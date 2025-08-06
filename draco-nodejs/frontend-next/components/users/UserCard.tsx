'use client';

import React from 'react';
import { TableCell, TableRow, Stack, Typography } from '@mui/material';
import { UserCardProps } from '../../types/users';
import UserRoleChips from './UserRoleChips';
import UserActions from './UserActions';
import ContactInfoExpanded from './ContactInfoExpanded';
import UserAvatar from './UserAvatar';
import { getFormattedName } from '../../utils/contactUtils';

/**
 * UserCard Component
 * Individual user row display with roles and actions
 */
const UserCard: React.FC<UserCardProps> = ({
  user,
  canManageUsers,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContactPhoto,
  getRoleDisplayName,
}) => {
  return (
    <TableRow key={user.id} hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <UserAvatar
            user={user}
            size={32}
            onClick={
              onEditContact
                ? () => {
                    // Convert User to Contact for the edit dialog
                    const contact = {
                      id: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      userId: user.userId,
                      photoUrl: user.photoUrl,
                      contactDetails: user.contactDetails,
                      contactroles: user.roles?.map((role) => ({
                        id: role.id,
                        roleId: role.roleId,
                        roleName: role.roleName,
                        roleData: role.roleData,
                        contextName: role.contextName,
                      })),
                    };
                    onEditContact(contact);
                  }
                : undefined
            }
            showHoverEffects={canManageUsers}
            enablePhotoActions={canManageUsers}
            onPhotoDelete={onDeleteContactPhoto}
          />
          <Typography variant="subtitle2" fontWeight="bold">
            {getFormattedName(user.firstName, user.lastName, user.contactDetails?.middlename)}
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
