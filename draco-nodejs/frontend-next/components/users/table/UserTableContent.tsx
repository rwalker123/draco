'use client';

import React, { memo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  Box,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { ContactRoleType, ContactType } from '@draco/shared-schemas';
import UserCard from '../UserCard';
import UserEmptyState from '../UserEmptyState';
import { UserSortState } from '../../../types/userFilters';

type SortableColumn = 'lastname' | 'zip' | 'dateofbirth' | 'firstyear';

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
  sort?: UserSortState;
  onSortChange?: (sort: UserSortState) => void;
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
  sort,
  onSortChange,
}) => {
  const handleSortClick = useCallback(
    (column: SortableColumn) => {
      if (!onSortChange) return;

      const isCurrentSort = sort?.sortBy === column;
      const newDirection = isCurrentSort && sort?.sortDirection === 'asc' ? 'desc' : 'asc';

      onSortChange({
        sortBy: column,
        sortDirection: newDirection,
      });
    },
    [sort, onSortChange],
  );

  const renderSortableHeader = (column: SortableColumn, label: string) => {
    if (!onSortChange) {
      return label;
    }

    const isActive = sort?.sortBy === column;
    const direction = isActive ? sort?.sortDirection : 'asc';

    return (
      <TableSortLabel
        active={isActive}
        direction={direction}
        onClick={() => handleSortClick(column)}
      >
        {label}
        {isActive && (
          <Box component="span" sx={visuallyHidden}>
            {direction === 'desc' ? 'sorted descending' : 'sorted ascending'}
          </Box>
        )}
      </TableSortLabel>
    );
  };

  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        <TableCell>{renderSortableHeader('lastname', 'Name')}</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Registration Status</TableCell>
        <TableCell>Phone Numbers</TableCell>
        <TableCell>{renderSortableHeader('zip', 'Address')}</TableCell>
        <TableCell>{renderSortableHeader('dateofbirth', 'Date of Birth')}</TableCell>
        <TableCell>{renderSortableHeader('firstyear', 'First Year')}</TableCell>
        <TableCell>Roles</TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
  );

  if (users.length === 0) {
    return (
      <TableContainer>
        <Table stickyHeader>
          {renderTableHeader()}
          <TableBody>
            <UserEmptyState
              searchTerm={searchTerm}
              hasFilters={hasFilters}
              wrapper="table-row"
              colSpan={9}
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
        {renderTableHeader()}
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
    prevProps.hasFilters === nextProps.hasFilters &&
    prevProps.sort === nextProps.sort
  );
});
