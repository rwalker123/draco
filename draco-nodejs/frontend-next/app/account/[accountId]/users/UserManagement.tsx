'use client';

import React, { useCallback } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import { useUserDialogs } from '../../../../hooks/useUserDialogs';
import {
  UserTableEnhanced,
  AssignRoleDialog,
  RemoveRoleDialog,
} from '../../../../components/users';
import EditContactDialog from '../../../../components/users/EditContactDialog';
import DeleteContactDialog from '../../../../components/users/DeleteContactDialog';
import PhotoDeleteDialog from '../../../../components/users/PhotoDeleteDialog';
import RevokeRegistrationDialog from '../../../../components/users/RevokeRegistrationDialog';
import {
  AutomaticRolesSection,
  AccountOwnerDisplay,
} from '../../../../components/users/automatic-roles';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { ContactType, ContactRoleType, RoleWithContactType } from '@draco/shared-schemas';

interface UserManagementProps {
  accountId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ accountId }) => {
  // Use the new dialog hooks
  const dialogs = useUserDialogs();

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

    // Form loading state

    // Context data states
    leagues,
    teams,
    leagueSeasons,
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
    setSearchTerm,
    setError,
    setSuccess,
    getRoleDisplayName,
    handleRoleAssigned,
    handleRoleRemoved,
    handleContactUpdated,
    handlePhotoDeleted,
    handleRegistrationRevoked,
    handleContactDeleted,
    loadContextData,
  } = useUserManagement(accountId);

  // Check if user can manage users (this is handled in the hook)
  const canManageUsers = true; // The hook handles permission checking

  // Wrapper function for photo deletion with confirmation
  const handleDeleteContactPhotoWithConfirm = useCallback(
    async (contactId: string) => {
      dialogs.photoDeleteConfirmDialog.open(contactId);
    },
    [dialogs.photoDeleteConfirmDialog],
  );

  const handleRevokeWithConfirm = useCallback(
    async (contactId: string) => {
      dialogs.revokeConfirmDialog.open(contactId);
    },
    [dialogs.revokeConfirmDialog],
  );

  // Async wrapper functions to match the interface expectations
  const handleAssignRoleWrapper = useCallback(
    async (user: ContactType) => {
      dialogs.assignRoleDialog.open(user);
      await loadContextData();
    },
    [dialogs.assignRoleDialog, loadContextData],
  );

  // Handle success events from the self-contained dialogs
  const handleAssignRoleSuccess = useCallback(
    (result: { message: string; assignedRole: RoleWithContactType }) => {
      setSuccess(result.message);
      handleRoleAssigned(result.assignedRole);
      dialogs.assignRoleDialog.close();
    },
    [setSuccess, handleRoleAssigned, dialogs.assignRoleDialog],
  );

  const handleRemoveRoleSuccess = useCallback(
    (result: {
      message: string;
      removedRole: { contactId: string; roleId: string; id: string };
    }) => {
      setSuccess(result.message);
      handleRoleRemoved(result.removedRole.contactId, result.removedRole.id);
      dialogs.removeRoleDialog.close();
    },
    [setSuccess, handleRoleRemoved, dialogs.removeRoleDialog],
  );

  const handleEditContactSuccess = useCallback(
    (result: { message: string; contact: ContactType; isCreate: boolean }) => {
      setSuccess(result.message);
      handleContactUpdated(result.contact, result.isCreate);
      if (result.isCreate) {
        dialogs.createContactDialog.close();
      } else {
        dialogs.editContactDialog.close();
      }
    },
    [setSuccess, handleContactUpdated, dialogs.createContactDialog, dialogs.editContactDialog],
  );

  const handlePhotoDeleteSuccess = useCallback(
    (result: { message: string; contactId: string }) => {
      setSuccess(result.message);
      handlePhotoDeleted(result.contactId);
      dialogs.photoDeleteConfirmDialog.close();
    },
    [setSuccess, handlePhotoDeleted, dialogs.photoDeleteConfirmDialog],
  );

  const handleRevokeRegistrationSuccess = useCallback(
    (result: { message: string; contactId: string }) => {
      setSuccess(result.message);
      handleRegistrationRevoked(result.contactId);
      dialogs.revokeConfirmDialog.close();
    },
    [setSuccess, handleRegistrationRevoked, dialogs.revokeConfirmDialog],
  );

  const handleContactDeleteSuccess = useCallback(
    (result: {
      message: string;
      contactId: string;
      dependenciesDeleted?: number;
      wasForced: boolean;
    }) => {
      const finalMessage =
        result.dependenciesDeleted && result.dependenciesDeleted > 0
          ? `${result.message} (${result.dependenciesDeleted} related records deleted)`
          : result.message;

      setSuccess(finalMessage);
      handleContactDeleted(result.contactId);
      dialogs.deleteContactDialog.close();
    },
    [setSuccess, handleContactDeleted, dialogs.deleteContactDialog],
  );

  const handleRemoveRoleWrapper = useCallback(
    async (user: ContactType, role: ContactRoleType) => {
      dialogs.removeRoleDialog.open(user, role);
    },
    [dialogs.removeRoleDialog],
  );

  const handleEditContactWrapper = useCallback(
    async (contact: ContactType) => {
      dialogs.editContactDialog.open(contact);
    },
    [dialogs.editContactDialog],
  );

  const handleDeleteContactWrapper = useCallback(
    async (contact: ContactType) => {
      dialogs.deleteContactDialog.open(contact);
    },
    [dialogs.deleteContactDialog],
  );

  const handleAddUserWrapper = useCallback(async () => {
    dialogs.createContactDialog.open();
  }, [dialogs.createContactDialog]);

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
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
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
        onAssignRole={handleAssignRoleWrapper}
        onRemoveRole={handleRemoveRoleWrapper}
        onEditContact={handleEditContactWrapper}
        onDeleteContact={handleDeleteContactWrapper}
        onAddUser={handleAddUserWrapper}
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
        open={dialogs.assignRoleDialog.isOpen}
        onClose={dialogs.assignRoleDialog.close}
        onSuccess={handleAssignRoleSuccess}
        roles={roles}
        accountId={accountId}
        // Pre-population props
        preselectedUser={dialogs.assignRoleDialog.data || null}
        isUserReadonly={!!dialogs.assignRoleDialog.data}
        // Context data props
        leagues={leagues}
        teams={teams}
        leagueSeasons={leagueSeasons}
        contextDataLoading={contextDataLoading}
      />

      <RemoveRoleDialog
        open={dialogs.removeRoleDialog.isOpen}
        onClose={dialogs.removeRoleDialog.close}
        onSuccess={handleRemoveRoleSuccess}
        selectedUser={dialogs.removeRoleDialog.data?.user || null}
        selectedRoleToRemove={dialogs.removeRoleDialog.data?.role || null}
        accountId={accountId}
      />

      <EditContactDialog
        open={dialogs.editContactDialog.isOpen}
        contact={dialogs.editContactDialog.data || null}
        onClose={dialogs.editContactDialog.close}
        onSuccess={handleEditContactSuccess}
        accountId={accountId}
      />

      <EditContactDialog
        open={dialogs.createContactDialog.isOpen}
        contact={null}
        mode="create"
        onClose={dialogs.createContactDialog.close}
        onSuccess={handleEditContactSuccess}
        accountId={accountId}
      />

      <DeleteContactDialog
        open={dialogs.deleteContactDialog.isOpen}
        contact={dialogs.deleteContactDialog.data || null}
        onClose={dialogs.deleteContactDialog.close}
        onSuccess={handleContactDeleteSuccess}
        accountId={accountId}
      />

      {/* Photo deletion dialog */}
      <PhotoDeleteDialog
        open={dialogs.photoDeleteConfirmDialog.isOpen}
        contactId={dialogs.photoDeleteConfirmDialog.data || null}
        onClose={dialogs.photoDeleteConfirmDialog.close}
        onSuccess={handlePhotoDeleteSuccess}
        accountId={accountId}
      />

      {/* Revoke registration dialog */}
      <RevokeRegistrationDialog
        open={dialogs.revokeConfirmDialog.isOpen}
        contactId={dialogs.revokeConfirmDialog.data || null}
        onClose={dialogs.revokeConfirmDialog.close}
        onSuccess={handleRevokeRegistrationSuccess}
        accountId={accountId}
      />
    </main>
  );
};

export default UserManagement;
