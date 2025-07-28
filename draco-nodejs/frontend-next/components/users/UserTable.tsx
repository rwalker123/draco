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
  Button,
  Stack,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { UserTableProps } from '../../types/users';
import UserCard from './UserCard';

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
              <TableCell>Email</TableCell>
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

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Page {page} • {users.length} users
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeft />}
            onClick={onPrevPage}
            disabled={!hasPrev}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            endIcon={<ChevronRight />}
            onClick={onNextPage}
            disabled={!hasNext}
          >
            Next
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default UserTable;
