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
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { UserTableProps } from '../../types/users';
import UserCard from './UserCard';
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
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (users.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No users found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your search criteria or add new users to the organization.
        </Typography>
      </Paper>
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
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                canManageUsers={canManageUsers}
                onAssignRole={onAssignRole}
                onRemoveRole={onRemoveRole}
                getRoleDisplayName={getRoleDisplayName}
              />
            ))}
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
