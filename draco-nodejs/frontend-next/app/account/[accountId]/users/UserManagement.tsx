'use client';

import React from 'react';
import { Alert, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import {
  UserTableEnhanced,
  AssignRoleDialog,
  RemoveRoleDialog,
} from '../../../../components/users';
import EditContactDialog from '../../../../components/users/EditContactDialog';
import DeleteContactDialog from '../../../../components/users/DeleteContactDialog';
import RoleLegend from '../../../../components/users/RoleLegend';

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
    isInitialLoad,
    error,
    success,
    page,
    rowsPerPage,
    hasNext,
    hasPrev,
    searchTerm,
    searchLoading,

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    editContactDialogOpen,
    deleteContactDialogOpen,
    selectedUser,
    selectedContactForEdit,
    selectedContactForDelete,
    selectedRole,
    selectedRoleToRemove,
    newUserContactId,
    formLoading,

    // Context data states
    leagues,
    teams,
    leagueSeasons,
    selectedLeagueId,
    selectedTeamId,
    contextDataLoading,

    // Actions
    handleSearch,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
    handleAssignRole,
    handleRemoveRole,
    openAssignRoleDialog,
    closeAssignRoleDialog,
    openRemoveRoleDialog,
    openEditContactDialog,
    closeEditContactDialog,
    handleEditContact,
    openDeleteContactDialog,
    closeDeleteContactDialog,
    handleDeleteContact,
    setAssignRoleDialogOpen,
    setRemoveRoleDialogOpen,
    setSelectedUser,
    setSelectedRole,
    setNewUserContactId,
    setSelectedLeagueId,
    setSelectedTeamId,
    setSearchTerm,
    setError,
    setSuccess,
    loadContextData,
    getRoleDisplayName,
  } = useUserManagement(accountId);

  // Check if user can manage users (this is handled in the hook)
  const canManageUsers = true; // The hook handles permission checking

  return (
    <main className="min-h-screen bg-background">
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

      {/* Quick Actions */}
      {canManageUsers && (
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={async () => {
              setSelectedUser(null); // Clear any preselected user
              setNewUserContactId(''); // Clear contact ID
              setAssignRoleDialogOpen(true);
              await loadContextData();
            }}
          >
            Add User Role
          </Button>
        </div>
      )}

      {/* Role Legend */}
      <RoleLegend variant="compact" />

      {/* Enhanced User Table with Modern Features */}
      <UserTableEnhanced
        users={users}
        loading={loading}
        isInitialLoad={isInitialLoad}
        onAssignRole={openAssignRoleDialog}
        onRemoveRole={openRemoveRoleDialog}
        onEditContact={openEditContactDialog}
        onDeleteContact={openDeleteContactDialog}
        canManageUsers={canManageUsers}
        page={page}
        rowsPerPage={rowsPerPage}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        getRoleDisplayName={getRoleDisplayName}
        // Enhanced features
        enableBulkOperations={false}
        enableViewSwitching={true}
        enableAdvancedFilters={true}
        enableVirtualization={true} // Auto-disabled when paginated data detected
        virtualizationThreshold={100}
        initialViewMode="card"
        onModernFeaturesChange={(_enabled) => {
          // Modern features notification
        }}
        // Enhanced props
        accountId={accountId}
        // Search props
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        searchLoading={searchLoading}
      />

      {/* Dialog Sections */}
      <AssignRoleDialog
        open={assignRoleDialogOpen}
        onClose={closeAssignRoleDialog}
        onAssign={handleAssignRole}
        selectedRole={selectedRole}
        newUserContactId={newUserContactId}
        roles={roles}
        onUserChange={setNewUserContactId}
        onRoleChange={setSelectedRole}
        loading={formLoading}
        accountId={accountId}
        // Pre-population props
        preselectedUser={selectedUser}
        isUserReadonly={!!selectedUser}
        // Context data props
        leagues={leagues}
        teams={teams}
        leagueSeasons={leagueSeasons}
        selectedLeagueId={selectedLeagueId}
        selectedTeamId={selectedTeamId}
        onLeagueChange={setSelectedLeagueId}
        onTeamChange={setSelectedTeamId}
        contextDataLoading={contextDataLoading}
      />

      <RemoveRoleDialog
        open={removeRoleDialogOpen}
        onClose={() => setRemoveRoleDialogOpen(false)}
        onRemove={handleRemoveRole}
        selectedUser={selectedUser}
        selectedRoleToRemove={selectedRoleToRemove}
        loading={formLoading}
      />

      <EditContactDialog
        open={editContactDialogOpen}
        contact={selectedContactForEdit}
        onClose={closeEditContactDialog}
        onSave={handleEditContact}
        loading={formLoading}
      />

      <DeleteContactDialog
        open={deleteContactDialogOpen}
        contact={selectedContactForDelete}
        onClose={closeDeleteContactDialog}
        onDelete={handleDeleteContact}
        loading={formLoading}
      />
    </main>
  );
};

export default UserManagement;
