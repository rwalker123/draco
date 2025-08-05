'use client';

import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
} from '@mui/material';
import { UserTableProps } from '../../types/users';
import UserCard from './UserCard';
import UserEmptyState from './UserEmptyState';
import StreamPaginationControl from '../pagination/StreamPaginationControl';

/**
 * UserTable Component
 * Main user list table with pagination and user management
 */
const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onAssignRole,
  onRemoveRole,
  canManageUsers,
  page,
  rowsPerPage: _rowsPerPage,
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
  onRowsPerPageChange: _onRowsPerPageChange,
  getRoleDisplayName,
  searchTerm,
  hasFilters = false,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
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
            {users.length === 0 ? (
              <UserEmptyState
                searchTerm={searchTerm}
                hasFilters={hasFilters}
                wrapper="table-row"
                colSpan={4}
                showIcon={false} // Don't show icon in table row for space reasons
              />
            ) : (
              users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  canManageUsers={canManageUsers}
                  onAssignRole={onAssignRole}
                  onRemoveRole={onRemoveRole}
                  getRoleDisplayName={getRoleDisplayName}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <StreamPaginationControl
        page={page}
        rowsPerPage={_rowsPerPage}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        onRowsPerPageChange={(rowsPerPage: number) => {
          if (_onRowsPerPageChange) {
            // Create a mock event to satisfy the existing API
            const mockEvent = {
              target: { value: rowsPerPage.toString() },
            } as React.ChangeEvent<HTMLInputElement>;
            _onRowsPerPageChange(mockEvent);
          }
        }}
        itemLabel="Users"
        currentItems={users.length}
      />
    </Paper>
  );
};

export default UserTable;
