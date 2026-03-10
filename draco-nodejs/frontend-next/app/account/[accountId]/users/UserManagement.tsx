'use client';

import React, { useEffect } from 'react';
import { Alert, Box, Container, Typography, Fab, Snackbar } from '@mui/material';
import { useUserManagement } from '../../../../hooks/useUserManagement';
import { useUserDialogs } from '../../../../hooks/useUserDialogs';
import { useNotifications } from '../../../../hooks/useNotifications';
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
import { AdminBreadcrumbs } from '../../../../components/admin';
import { ContactType, ContactRoleType, RoleWithContactType } from '@draco/shared-schemas';
import { exportContacts } from '@draco/shared-api-client';
import AddIcon from '@mui/icons-material/Add';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { downloadBlob } from '../../../../utils/downloadUtils';
import AutoRegisterDialog from '../../../../components/users/AutoRegisterDialog';
import AutoRegisterConflictDialog from '../../../../components/users/AutoRegisterConflictDialog';

interface UserManagementProps {
  accountId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ accountId }) => {
  const apiClient = useApiClient();

  const dialogs = useUserDialogs();

  const { notification, showNotification, hideNotification } = useNotifications();

  const {
    users,
    roles,
    loading,
    isInitialLoad,
    feedback,
    page,
    rowsPerPage,
    hasNext,
    hasPrev,
    searchTerm,
    searchLoading,
    isShowingSearchResults,
    onlyWithRoles,
    currentSeasonId,

    leagues,
    teams,
    leagueSeasons,
    contextDataLoading,

    accountOwner,
    teamManagers,

    filter,
    hasActiveFilter,

    sort,

    handleSearch,
    handleClearSearch,
    handleFilterToggle,
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
    setSearchTerm,
    getRoleDisplayName,
    handleRoleAssigned,
    handleRoleRemoved,
    handleContactUpdated,
    handlePhotoDeleted,
    handleRegistrationRevoked,
    handleRegistrationLinked,
    handleContactDeleted,
    loadContextData,

    handleFilterChange,
    handleApplyFilter,
    handleClearFilter,

    handleSortChange,
  } = useUserManagement(accountId);

  useEffect(() => {
    if (feedback) {
      showNotification(feedback.message, feedback.severity);
    }
  }, [feedback, showNotification]);

  const canManageUsers = true;

  const handleDeleteContactPhotoWithConfirm = async (contactId: string) => {
    dialogs.photoDeleteConfirmDialog.open(contactId);
  };

  const handleRevokeWithConfirm = async (contactId: string) => {
    dialogs.revokeConfirmDialog.open(contactId);
  };

  const handleAutoRegisterConflict = (data: {
    contact: ContactType;
    otherContactName?: string;
    otherContactId?: string;
    email?: string;
    message?: string;
  }) => {
    dialogs.autoRegisterDialog.close();
    dialogs.autoRegisterConflictDialog.open(data);
  };

  const handleAssignRoleWrapper = async (user: ContactType) => {
    dialogs.assignRoleDialog.open(user);
    await loadContextData();
  };

  const handleAssignRoleSuccess = (result: {
    message: string;
    assignedRole: RoleWithContactType;
  }) => {
    showNotification(result.message, 'success');
    handleRoleAssigned(result.assignedRole);
    dialogs.assignRoleDialog.close();
  };

  const handleRemoveRoleSuccess = (result: {
    message: string;
    removedRole: { contactId: string; roleId: string; id: string };
  }) => {
    showNotification(result.message, 'success');
    handleRoleRemoved(result.removedRole.contactId, result.removedRole.id);
    dialogs.removeRoleDialog.close();
  };

  const handleEditContactSuccess = (result: {
    message: string;
    contact: ContactType;
    isCreate: boolean;
    status?: 'success' | 'warning';
  }) => {
    const message = result.status === 'warning' ? `⚠️ ${result.message}` : result.message;
    showNotification(message, 'success');
    handleContactUpdated(result.contact, result.isCreate);
    if (result.isCreate) {
      dialogs.createContactDialog.close();
    } else {
      dialogs.editContactDialog.close();
    }
  };

  const handlePhotoDeleteSuccess = (result: { message: string; contactId: string }) => {
    showNotification(result.message, 'success');
    handlePhotoDeleted(result.contactId);
    dialogs.photoDeleteConfirmDialog.close();
  };

  const handleRevokeRegistrationSuccess = (result: { message: string; contactId: string }) => {
    showNotification(result.message, 'success');
    handleRegistrationRevoked(result.contactId);
    dialogs.revokeConfirmDialog.close();
  };

  const handleAutoRegisterSuccess = (result: {
    message?: string;
    contactId: string;
    userId: string;
  }) => {
    if (result.message) {
      showNotification(result.message, 'success');
    }
    handleRegistrationLinked(result.contactId, result.userId);
    dialogs.autoRegisterDialog.close();
  };

  const handleContactDeleteSuccess = (result: {
    message: string;
    contactId: string;
    dependenciesDeleted?: number;
    wasForced: boolean;
  }) => {
    const finalMessage =
      result.dependenciesDeleted && result.dependenciesDeleted > 0
        ? `${result.message} (${result.dependenciesDeleted} related records deleted)`
        : result.message;

    showNotification(finalMessage, 'success');
    handleContactDeleted(result.contactId);
    dialogs.deleteContactDialog.close();
  };

  const handleRemoveRoleWrapper = async (user: ContactType, role: ContactRoleType) => {
    dialogs.removeRoleDialog.open(user, role);
  };

  const handleAutoRegisterWrapper = async (contact: ContactType) => {
    dialogs.autoRegisterDialog.open(contact);
  };

  const handleEditContactWrapper = async (contact: ContactType) => {
    dialogs.editContactDialog.open(contact);
  };

  const handleDeleteContactWrapper = async (contact: ContactType) => {
    dialogs.deleteContactDialog.open(contact);
  };

  const handleAddUserWrapper = async () => {
    dialogs.createContactDialog.open();
  };

  const handleExportUsers = async () => {
    try {
      const hasCompleteFilter =
        hasActiveFilter && filter.filterField && filter.filterOp && filter.filterValue;

      const result = await exportContacts({
        client: apiClient,
        path: { accountId },
        query: {
          searchTerm: isShowingSearchResults ? searchTerm : undefined,
          onlyWithRoles: onlyWithRoles ? 'true' : undefined,
          seasonId: currentSeasonId || undefined,
          filterField: hasCompleteFilter ? filter.filterField || undefined : undefined,
          filterOp: hasCompleteFilter ? filter.filterOp || undefined : undefined,
          filterValue: hasCompleteFilter ? filter.filterValue : undefined,
        },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export users') as Blob;
      downloadBlob(blob, 'users.csv');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to export users', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          User Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage account users, roles, and permissions.
        </Typography>
        {accountOwner && (
          <Box mt={2} display="flex" justifyContent="center">
            <AccountOwnerDisplay accountOwner={accountOwner} variant="header" />
          </Box>
        )}
      </AccountPageHeader>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Account', href: `/account/${accountId}/admin/account` }}
          currentPage="User Management"
        />

        <AutomaticRolesSection accountOwner={accountOwner} teamManagers={teamManagers} />

        <UserTableEnhanced
          users={users}
          loading={loading}
          isInitialLoad={isInitialLoad}
          onAssignRole={handleAssignRoleWrapper}
          onRemoveRole={handleRemoveRoleWrapper}
          onEditContact={handleEditContactWrapper}
          onDeleteContact={handleDeleteContactWrapper}
          canManageUsers={canManageUsers}
          page={page}
          rowsPerPage={rowsPerPage}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          getRoleDisplayName={getRoleDisplayName}
          enableViewSwitching={true}
          enableAdvancedFilters={true}
          initialViewMode="table"
          onModernFeaturesChange={(_enabled) => {}}
          accountId={accountId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          isShowingSearchResults={isShowingSearchResults}
          searchLoading={searchLoading}
          onDeleteContactPhoto={handleDeleteContactPhotoWithConfirm}
          onRevokeRegistration={handleRevokeWithConfirm}
          onAutoRegister={handleAutoRegisterWrapper}
          onlyWithRoles={onlyWithRoles}
          onOnlyWithRolesChange={handleFilterToggle}
          onExport={handleExportUsers}
          filter={filter}
          onFilterChange={handleFilterChange}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          hasActiveFilter={hasActiveFilter}
          sort={sort}
          onAdvancedSortChange={handleSortChange}
          title={null}
        />
      </Container>

      <AssignRoleDialog
        open={dialogs.assignRoleDialog.isOpen}
        onClose={dialogs.assignRoleDialog.close}
        onSuccess={handleAssignRoleSuccess}
        roles={roles}
        accountId={accountId}
        preselectedUser={dialogs.assignRoleDialog.data || null}
        isUserReadonly={!!dialogs.assignRoleDialog.data}
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

      <PhotoDeleteDialog
        open={dialogs.photoDeleteConfirmDialog.isOpen}
        contactId={dialogs.photoDeleteConfirmDialog.data || null}
        onClose={dialogs.photoDeleteConfirmDialog.close}
        onSuccess={handlePhotoDeleteSuccess}
        accountId={accountId}
      />

      <RevokeRegistrationDialog
        open={dialogs.revokeConfirmDialog.isOpen}
        contactId={dialogs.revokeConfirmDialog.data || null}
        onClose={dialogs.revokeConfirmDialog.close}
        onSuccess={handleRevokeRegistrationSuccess}
        accountId={accountId}
      />

      <AutoRegisterDialog
        open={dialogs.autoRegisterDialog.isOpen}
        contact={dialogs.autoRegisterDialog.data || null}
        accountId={accountId}
        onClose={dialogs.autoRegisterDialog.close}
        onSuccess={handleAutoRegisterSuccess}
        onConflict={handleAutoRegisterConflict}
      />

      <AutoRegisterConflictDialog
        open={dialogs.autoRegisterConflictDialog.isOpen}
        data={dialogs.autoRegisterConflictDialog.data || null}
        onClose={dialogs.autoRegisterConflictDialog.close}
      />

      {canManageUsers && (
        <Fab
          color="primary"
          aria-label="add user"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: (theme) => theme.zIndex.snackbar + 1,
          }}
          onClick={handleAddUserWrapper}
        >
          <AddIcon />
        </Fab>
      )}

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default UserManagement;
