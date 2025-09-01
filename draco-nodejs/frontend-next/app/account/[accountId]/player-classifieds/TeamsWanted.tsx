'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { useClassifiedsPagination } from '../../../../hooks/useClassifiedsPagination';
import { useClassifiedsPermissions } from '../../../../hooks/useClassifiedsPermissions';
import { useAuth } from '../../../../context/AuthContext';
import { useAccountMembership } from '../../../../hooks/useAccountMembership';
import { StreamPaginationControl } from '../../../../components/pagination';
import TeamsWantedStateManager from '../../../../components/player-classifieds/TeamsWantedStateManager';
import CreateTeamsWantedDialog from '../../../../components/player-classifieds/CreateTeamsWantedDialog';
import {
  ITeamsWantedResponse,
  ITeamsWantedOwnerResponse,
} from '../../../../types/playerClassifieds';
import { ITeamsWantedFormState } from '../../../../types/playerClassifieds';
import { playerClassifiedService } from '../../../../services/playerClassifiedService';

interface TeamsWantedProps {
  accountId: string;
  autoVerificationData?: {
    accessCode: string;
    classifiedData: ITeamsWantedOwnerResponse;
  } | null;
  onVerificationProcessed?: () => void;
}

const TeamsWanted: React.FC<TeamsWantedProps> = ({
  accountId,
  autoVerificationData,
  onVerificationProcessed,
}) => {
  // Get permission functions for edit/delete controls
  const { canEditTeamsWantedById, canDeleteTeamsWantedById } = useClassifiedsPermissions({
    accountId,
  });

  // Get authentication and account membership status
  const { user, token } = useAuth();
  const { isMember } = useAccountMembership(accountId);
  const isAuthenticated = !!user;
  const isAccountMember = !!isMember;

  // Use hook state directly (no local state needed)

  // Notification state
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // Pagination info will come from hook

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);

  // State for delete operation
  const [selectedClassified, setSelectedClassified] = React.useState<ITeamsWantedResponse | null>(
    null,
  );

  // State for edit operation
  const [editingClassified, setEditingClassified] = React.useState<ITeamsWantedResponse | null>(
    null,
  );

  // State for contact fetching during edit
  const [editContactLoading, setEditContactLoading] = React.useState(false);
  const [editContactError, setEditContactError] = React.useState<string | null>(null);

  // Pagination state
  const { pagination, setPage, setLimit } = useClassifiedsPagination({
    initialPage: 1,
    initialLimit: 25,
  });

  // Use the main hook for data management with pagination
  const {
    teamsWanted,
    loading,
    paginationLoading,
    error: hookError,
    paginationInfo,
    createTeamsWanted,
    updateTeamsWanted,
    deleteTeamsWanted,
    loadTeamsWantedPage,
  } = usePlayerClassifieds(accountId, token || undefined);

  // Load initial data on mount
  React.useEffect(() => {
    if (token) {
      loadTeamsWantedPage(pagination.page, pagination.limit);
    }
  }, [accountId, token, loadTeamsWantedPage, pagination.page, pagination.limit]);

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadTeamsWantedPage(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    loadTeamsWantedPage(1, newLimit); // Reset to first page when changing limit
  };

  // Handle next page
  const handleNextPage = () => {
    const nextPage = pagination.page + 1;
    setPage(nextPage);
    loadTeamsWantedPage(nextPage, pagination.limit);
  };

  // Handle previous page
  const handlePrevPage = () => {
    const prevPage = pagination.page - 1;
    setPage(prevPage);
    loadTeamsWantedPage(prevPage, pagination.limit);
  };

  // Removed loadPageData - now using hook's loadTeamsWantedPage

  // Removed loadInitialData useEffect - now handled in initial load effect above

  // Utility function to convert ITeamsWantedResponse to ITeamsWantedFormState
  const convertToFormState = (classified: ITeamsWantedResponse): ITeamsWantedFormState => {
    const formState = {
      name: classified.name,
      email: classified.email,
      phone: classified.phone,
      experience: classified.experience,
      positionsPlayed: classified.positionsPlayed
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
      birthDate: new Date(classified.birthDate),
    };

    return formState;
  };

  // Check if user can perform operation without access code
  const canOperateWithoutAccessCode = (classified: ITeamsWantedResponse) => {
    // AccountAdmins and owners can operate without access code
    return (
      isAccountMember &&
      (canEditTeamsWantedById(classified) || canDeleteTeamsWantedById(classified))
    );
  };

  // Handle edit - unified contact fetching for both AccountAdmin and Access Code users
  const handleEdit = async (id: string, _accessCodeRequired: string) => {
    const classified = teamsWanted.find((c) => c.id.toString() === id);
    if (!classified) return;

    if (canOperateWithoutAccessCode(classified)) {
      // AccountAdmins - fetch contact info with JWT token
      setEditContactLoading(true);
      setEditContactError(null);

      try {
        const contactResult = await playerClassifiedService.getTeamsWantedContactForEdit(
          accountId,
          classified.id.toString(),
          '', // Empty access code for AccountAdmins
          token || undefined, // JWT token for authentication
        );

        if (contactResult.success && contactResult.data) {
          // Merge contact info with classified data
          const classifiedWithContact = {
            ...classified,
            email: contactResult.data.email,
            phone: contactResult.data.phone,
          };

          setEditingClassified(classifiedWithContact);
          setEditDialogOpen(true);
        } else {
          setEditContactError(contactResult.error || 'Failed to fetch contact information');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch contact information';
        setEditContactError(errorMessage);
      } finally {
        setEditContactLoading(false);
      }
    }
    // Access code verification is handled by TeamsWantedStateManager for non-AccountAdmins
  };

  // Handle edit dialog close
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingClassified(null);
    setEditContactError(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async (formData: ITeamsWantedFormState) => {
    if (!editingClassified) return;

    try {
      // For AccountAdmins, no access code is needed - use empty string
      await updateTeamsWanted(editingClassified.id.toString(), formData, '');

      // The hook state is automatically updated by the updateTeamsWanted call
      // No need to manually update state

      // Close the edit dialog and show detailed success message
      closeEditDialog();
      setSuccess(
        'Teams Wanted ad updated successfully! Your Teams Wanted ad has been updated with the new information.',
      );
      setError(null);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      // Let the hook handle error notifications, but re-throw so dialog can handle it
      throw error;
    }
  };

  // Handle delete
  const handleDelete = async (id: string, _accessCodeRequired: string) => {
    const classified = teamsWanted.find((c) => c.id.toString() === id);
    if (!classified) {
      // No classified found - this should be handled by TeamsWantedStateManager for access code users
      return;
    }

    if (canOperateWithoutAccessCode(classified)) {
      // AccountAdmins can delete directly - open confirmation dialog
      setSelectedClassified(classified);
      setDeleteDialogOpen(true);
    }
    // Access code verification is handled by TeamsWantedStateManager for non-AccountAdmins
  };

  // Handle delete dialog close
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedClassified(null);
  };

  // Handle confirmed delete
  const confirmDelete = async () => {
    if (!selectedClassified) return;

    const result = await deleteTeamsWanted(selectedClassified.id.toString(), ''); // Empty access code for AccountAdmins

    if (result.success) {
      // Show success notification
      setSuccess('Teams Wanted deleted successfully');
      setError(null);
      // Refresh the data to show updated list
      loadTeamsWantedPage(pagination.page, pagination.limit);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } else {
      // Show error notification
      setError(result.error || 'Failed to delete Teams Wanted');
      setSuccess(null);
    }

    // Always close dialog whether success or error
    closeDeleteDialog();
  };

  // Handle create teams wanted
  const handleCreateTeamsWanted = async (formData: ITeamsWantedFormState) => {
    setFormLoading(true);
    try {
      await createTeamsWanted(formData);
      // Close dialog and show detailed success message
      setCreateDialogOpen(false);
      setSuccess(
        "Teams Wanted ad created successfully! You'll receive an access code via email shortly. Keep this code safe - you'll need it to edit or delete your ad later.",
      );
      setError(null);
      // Auto-hide success message after 8 seconds (longer for detailed message)
      setTimeout(() => setSuccess(null), 8000);
    } catch (error) {
      // Error is already handled by the hook
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Loading state - only show spinner for initial load, not for pagination
  if (loading && teamsWanted.length === 0) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Teams Wanted
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={!isAccountMember}
          >
            Create Ad
          </Button>
        </Box>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Teams Wanted
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Post Teams Wanted
          </Button>
        </Box>
      </Box>

      {/* Notifications */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {editContactError && (
        <Alert severity="error" onClose={() => setEditContactError(null)} sx={{ mb: 3 }}>
          Contact Info Error: {editContactError}
        </Alert>
      )}

      {/* Content - Delegated to TeamsWantedStateManager */}
      <TeamsWantedStateManager
        accountId={accountId}
        teamsWanted={teamsWanted}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditTeamsWantedById}
        canDelete={canDeleteTeamsWantedById}
        loading={false} // Never show loading in the state manager during pagination
        error={hookError || undefined}
        autoVerificationData={autoVerificationData}
        onVerificationProcessed={onVerificationProcessed}
      />

      {/* Pagination Controls - Only show for authenticated account members */}
      {isAuthenticated && isAccountMember && teamsWanted.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <StreamPaginationControl
            page={pagination.page}
            rowsPerPage={pagination.limit}
            hasNext={paginationInfo.hasNext}
            hasPrev={paginationInfo.hasPrev}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRowsPerPageChange={handleLimitChange}
            onJumpToPage={handlePageChange}
            currentItems={teamsWanted.length}
            itemLabel="Ads"
            loading={paginationLoading} // Use pagination-specific loading state
            showPageSize={true}
            showJumpControls={false}
          />
        </Box>
      )}

      {/* Create Teams Wanted Dialog */}
      <CreateTeamsWantedDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTeamsWanted}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Teams Wanted</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Teams Wanted ad? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Teams Wanted Dialog */}
      {editingClassified && (
        <CreateTeamsWantedDialog
          open={editDialogOpen}
          onClose={closeEditDialog}
          onSubmit={handleEditSubmit}
          loading={formLoading || editContactLoading}
          initialData={convertToFormState(editingClassified)}
          editMode={true}
        />
      )}
    </Box>
  );
};

export default TeamsWanted;
