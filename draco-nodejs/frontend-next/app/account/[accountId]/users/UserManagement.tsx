'use client';

import React from 'react';
import { Stack, Typography, Alert, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import {
  UserSearchBar,
  UserFilterBar,
  UserTable,
  AssignRoleDialog,
  RemoveRoleDialog,
  RoleLegend,
} from '../../../../components/users';

interface UserManagementProps {
  accountId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ accountId }) => {
  // Use custom hook for all state and logic
  const {
    // State
    users,
    roles,
    loading,
    error,
    success,
    page,
    rowsPerPage,
    hasNext,
    hasPrev,
    searchTerm,
    searchLoading,
    onlyWithRoles,

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    selectedUser,
    selectedRole,
    selectedRoleToRemove,
    newUserContactId,
    formLoading,

    // Actions
    handleSearch,
    handleClearSearch,
    handleFilterToggle,
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
    handleAssignRole,
    handleRemoveRole,
    openAssignRoleDialog,
    openRemoveRoleDialog,
    setAssignRoleDialogOpen,
    setRemoveRoleDialogOpen,
    setSelectedRole,
    setNewUserContactId,
    setSearchTerm,
    setError,
    setSuccess,
    getRoleDisplayName,
  } = useUserManagement(accountId);

  // Check if user can manage users (this is handled in the hook)
  const canManageUsers = true; // The hook handles permission checking

  return (
    <main className="min-h-screen bg-background">
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        {canManageUsers && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAssignRoleDialogOpen(true)}
          >
            Assign Role
          </Button>
        )}
      </Stack>

      {/* Error and Success Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage users and their roles for this organization.
      </Typography>

      {/* Role Legend */}
      <RoleLegend variant="compact" />

      {/* Filter Section */}
      <UserFilterBar
        onlyWithRoles={onlyWithRoles}
        onToggle={handleFilterToggle}
        userCount={users.length}
        loading={loading}
      />

      {/* Search Section */}
      <UserSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        onClear={handleClearSearch}
        loading={searchLoading}
      />

      {/* Table Section */}
      <UserTable
        users={users}
        loading={loading}
        onAssignRole={openAssignRoleDialog}
        onRemoveRole={openRemoveRoleDialog}
        canManageUsers={canManageUsers}
        page={page}
        rowsPerPage={rowsPerPage}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        getRoleDisplayName={getRoleDisplayName}
      />

      {/* Dialog Sections */}
      <AssignRoleDialog
        open={assignRoleDialogOpen}
        onClose={() => setAssignRoleDialogOpen(false)}
        onAssign={handleAssignRole}
        selectedRole={selectedRole}
        newUserContactId={newUserContactId}
        roles={roles}
        onUserChange={setNewUserContactId}
        onRoleChange={setSelectedRole}
        loading={formLoading}
      />

      <RemoveRoleDialog
        open={removeRoleDialogOpen}
        onClose={() => setRemoveRoleDialogOpen(false)}
        onRemove={handleRemoveRole}
        selectedUser={selectedUser}
        selectedRoleToRemove={selectedRoleToRemove}
        loading={formLoading}
      />
    </main>
  );
};

export default UserManagement;
