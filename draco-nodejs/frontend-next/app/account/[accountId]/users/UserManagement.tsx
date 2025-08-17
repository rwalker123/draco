'use client';

import React, { useState, useCallback } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import {
  UserTableEnhanced,
  AssignRoleDialog,
  RemoveRoleDialog,
} from '../../../../components/users';
import EditContactDialog from '../../../../components/users/EditContactDialog';
import DeleteContactDialog from '../../../../components/users/DeleteContactDialog';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import {
  AutomaticRolesSection,
  AccountOwnerDisplay,
} from '../../../../components/users/automatic-roles';
import AccountPageHeader from '../../../../components/AccountPageHeader';

interface UserManagementProps {
  accountId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ accountId }) => {
  // Confirmation dialog state for photo deletion
  const [photoDeleteConfirmOpen, setPhotoDeleteConfirmOpen] = useState(false);
  const [contactToDeletePhoto, setContactToDeletePhoto] = useState<string | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [contactToRevoke, setContactToRevoke] = useState<string | null>(null);

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
    isShowingSearchResults,
    onlyWithRoles,

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    editContactDialogOpen,
    deleteContactDialogOpen,
    createContactDialogOpen,
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

    // Automatic role holders states
    accountOwner,
    teamManagers,

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
    closeAssignRoleDialog,
    openRemoveRoleDialog,
    openEditContactDialog,
    closeEditContactDialog,
    handleEditContact,
    openCreateContactDialog,
    closeCreateContactDialog,
    handleCreateContact,
    handleDeleteContactPhoto,
    handleRevokeRegistration,
    openDeleteContactDialog,
    closeDeleteContactDialog,
    handleDeleteContact,
    setRemoveRoleDialogOpen,
    setSelectedRole,
    setNewUserContactId,
    setSelectedLeagueId,
    setSelectedTeamId,
    setSearchTerm,
    setError,
    setSuccess,
    getRoleDisplayName,
  } = useUserManagement(accountId);

  // Check if user can manage users (this is handled in the hook)
  const canManageUsers = true; // The hook handles permission checking

  // Wrapper function for photo deletion with confirmation
  const handleDeleteContactPhotoWithConfirm = useCallback(async (contactId: string) => {
    setContactToDeletePhoto(contactId);
    setPhotoDeleteConfirmOpen(true);
  }, []);

  const confirmDeletePhoto = useCallback(async () => {
    if (contactToDeletePhoto) {
      await handleDeleteContactPhoto(contactToDeletePhoto);
      setPhotoDeleteConfirmOpen(false);
      setContactToDeletePhoto(null);
    }
  }, [contactToDeletePhoto, handleDeleteContactPhoto]);

  const handleRevokeWithConfirm = useCallback(async (contactId: string) => {
    setContactToRevoke(contactId);
    setRevokeConfirmOpen(true);
  }, []);

  const confirmRevoke = useCallback(async () => {
    if (contactToRevoke) {
      await handleRevokeRegistration(contactToRevoke);
      setRevokeConfirmOpen(false);
      setContactToRevoke(null);
    }
  }, [contactToRevoke, handleRevokeRegistration]);

  const cancelRevoke = useCallback(() => {
    setRevokeConfirmOpen(false);
    setContactToRevoke(null);
  }, []);

  const cancelDeletePhoto = useCallback(() => {
    setPhotoDeleteConfirmOpen(false);
    setContactToDeletePhoto(null);
  }, []);

  // No global event bridge; using explicit prop wiring instead

  return (
    <main className="min-h-screen bg-background">
      {/* Account Header */}
      <AccountPageHeader accountId={accountId}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flex: 1, textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              User Management
            </Typography>
          </Box>

          {/* Account Owner Information */}
          {accountOwner && <AccountOwnerDisplay accountOwner={accountOwner} variant="header" />}
        </Box>
      </AccountPageHeader>

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

      {/* Automatic Role Holders Section */}
      <AutomaticRolesSection accountOwner={accountOwner} teamManagers={teamManagers} />

      {/* Enhanced User Table with Modern Features */}
      <UserTableEnhanced
        users={users}
        loading={loading}
        isInitialLoad={isInitialLoad}
        onAssignRole={openAssignRoleDialog}
        onRemoveRole={openRemoveRoleDialog}
        onEditContact={openEditContactDialog}
        onDeleteContact={openDeleteContactDialog}
        onAddUser={openCreateContactDialog}
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
        enableViewSwitching={true}
        enableAdvancedFilters={true}
        enableVirtualization={true} // Auto-disabled when paginated data detected
        virtualizationThreshold={100}
        initialViewMode="table"
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
        isShowingSearchResults={isShowingSearchResults}
        searchLoading={searchLoading}
        onDeleteContactPhoto={handleDeleteContactPhotoWithConfirm}
        onRevokeRegistration={handleRevokeWithConfirm}
        // Filter props
        onlyWithRoles={onlyWithRoles}
        onOnlyWithRolesChange={handleFilterToggle}
        // Disable the title header above the search bar
        title={null}
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

      <EditContactDialog
        open={createContactDialogOpen}
        contact={null}
        mode="create"
        onClose={closeCreateContactDialog}
        onSave={handleCreateContact}
        loading={formLoading}
      />

      <DeleteContactDialog
        open={deleteContactDialogOpen}
        contact={selectedContactForDelete}
        onClose={closeDeleteContactDialog}
        onDelete={handleDeleteContact}
        loading={formLoading}
      />

      {/* Photo deletion confirmation dialog */}
      <ConfirmationDialog
        open={photoDeleteConfirmOpen}
        onClose={cancelDeletePhoto}
        onConfirm={confirmDeletePhoto}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="error"
      />

      {/* Revoke registration confirmation dialog */}
      <ConfirmationDialog
        open={revokeConfirmOpen}
        onClose={cancelRevoke}
        onConfirm={confirmRevoke}
        title="Remove Registration"
        message="Are you sure you want to remove registration for this user? They will no longer be linked to a login."
        confirmText="Remove"
        cancelText="Cancel"
        confirmButtonColor="error"
      />
    </main>
  );
};

export default UserManagement;
