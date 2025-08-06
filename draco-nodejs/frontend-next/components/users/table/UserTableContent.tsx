'use client';

import React, { memo } from 'react';
import { Table, TableBody, TableContainer, TableHead, TableRow, TableCell } from '@mui/material';
import { User, UserRole, Contact } from '../../../types/users';
import UserCard from '../UserCard';
import UserEmptyState from '../UserEmptyState';

interface UserTableContentProps {
  users: User[];
  canManageUsers: boolean;
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole: (user: User, role: UserRole) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContactPhoto: (contactId: string) => Promise<void>;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  searchTerm?: string;
  hasFilters?: boolean;
}

const UserTableContent: React.FC<UserTableContentProps> = ({
  users,
  canManageUsers,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContactPhoto,
  getRoleDisplayName,
  searchTerm,
  hasFilters = false,
}) => {
  if (users.length === 0) {
    return (
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Information</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <UserEmptyState
              searchTerm={searchTerm}
              hasFilters={hasFilters}
              wrapper="table-row"
              colSpan={4}
              showIcon={false}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Contact Information</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              canManageUsers={canManageUsers}
              onAssignRole={onAssignRole}
              onRemoveRole={onRemoveRole}
              onEditContact={onEditContact}
              onDeleteContactPhoto={onDeleteContactPhoto}
              getRoleDisplayName={getRoleDisplayName}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(UserTableContent, (prevProps, nextProps) => {
  // Only re-render if users array reference changes or essential props change
  return (
    prevProps.users === nextProps.users &&
    prevProps.canManageUsers === nextProps.canManageUsers &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.hasFilters === nextProps.hasFilters
  );
});
