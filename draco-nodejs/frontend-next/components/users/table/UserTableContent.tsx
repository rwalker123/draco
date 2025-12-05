'use client';

import React, { memo } from 'react';
import { Table, TableBody, TableContainer, TableHead, TableRow, TableCell } from '@mui/material';
import { ContactRoleType, ContactType } from '@draco/shared-schemas';
import UserCard from '../UserCard';
import UserEmptyState from '../UserEmptyState';

interface UserTableContentProps {
  users: ContactType[];
  canManageUsers: boolean;
  onAssignRole: (user: ContactType) => Promise<void>;
  onRemoveRole: (user: ContactType, role: ContactRoleType) => Promise<void>;
  onEditContact: (contact: ContactType) => Promise<void>;
  onDeleteContact?: (contact: ContactType) => Promise<void>;
  onDeleteContactPhoto: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
  onAutoRegister?: (contact: ContactType) => void;
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
  onDeleteContact,
  onDeleteContactPhoto,
  onRevokeRegistration,
  onAutoRegister,
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
              <TableCell>Email</TableCell>
              <TableCell>Registration Status</TableCell>
              <TableCell>Phone Numbers</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <UserEmptyState
              searchTerm={searchTerm}
              hasFilters={hasFilters}
              wrapper="table-row"
              colSpan={8}
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
            <TableCell>Email</TableCell>
            <TableCell>Registration Status</TableCell>
            <TableCell>Phone Numbers</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Date of Birth</TableCell>
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
              onDeleteContact={onDeleteContact}
              onDeleteContactPhoto={onDeleteContactPhoto}
              onRevokeRegistration={onRevokeRegistration}
              onAutoRegister={onAutoRegister}
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
