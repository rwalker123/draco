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
import { playerClassifiedService } from '../../../../services/playerClassifiedService';
import { ITeamsWantedFormState } from '../../../../types/playerClassifieds';
import { UI_TIMEOUTS } from '../../../../constants/timeoutConstants';

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

  // Local state for teamsWanted data (bypassing hook for pagination)
  const [localTeamsWanted, setLocalTeamsWanted] = React.useState<ITeamsWantedResponse[]>([]);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Notification state
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [paginationInfo, setPaginationInfo] = React.useState<{
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

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

  // Pagination state
  const { pagination, setPage, setLimit } = useClassifiedsPagination({
    initialPage: 1,
    initialLimit: 25,
  });

  // Use the main hook for data management with pagination
  const { teamsWanted, createTeamsWanted, updateTeamsWanted, deleteTeamsWanted } =
    usePlayerClassifieds(accountId, token || undefined);

  // Initialize local state with hook data
  React.useEffect(() => {
    if (teamsWanted.length > 0) {
      setLocalTeamsWanted(teamsWanted);
    }
  }, [teamsWanted]);

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadPageData(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    loadPageData(1, newLimit); // Reset to first page when changing limit
  };

  // Handle next page
  const handleNextPage = () => {
    const nextPage = pagination.page + 1;
    setPage(nextPage);
    loadPageData(nextPage, pagination.limit);
  };

  // Handle previous page
  const handlePrevPage = () => {
    const prevPage = pagination.page - 1;
    setPage(prevPage);
    loadPageData(prevPage, pagination.limit);
  };

  // Load data for specific page
  const loadPageData = React.useCallback(
    async (page: number, limit: number) => {
      // Set loading after configured timeout to avoid flashing on fast page changes
      const loadingTimeout = setTimeout(() => {
        setLocalLoading(true);
      }, UI_TIMEOUTS.LOADING_DISPLAY_TIMEOUT_MS);

      try {
        if (!token) {
          return;
        }
        const response = await playerClassifiedService.getTeamsWanted(
          accountId,
          {
            page,
            limit,
            sortBy: 'dateCreated',
            sortOrder: 'desc',
            type: 'teams',
          },
          token,
        );

        if (response.success && response.data) {
          // Update the local teamsWanted data
          setLocalTeamsWanted(response.data.data);
          // Update pagination info from API response
          setPaginationInfo({
            total: response.data.total || 0,
            totalPages: response.data.pagination?.totalPages || 0,
            hasNext: response.data.pagination?.hasNext || false,
            hasPrev: response.data.pagination?.hasPrev || false,
          });
          // Clear any previous errors on success
          setLocalError(null);
        } else {
          // Handle error response
          let errorMessage = response.error || 'Failed to load Teams Wanted ads';

          // Handle specific error types
          if (response.errorCode === 'Unauthorized') {
            errorMessage =
              'You are not authorized to view Teams Wanted ads for this account. Please sign in or join the account.';
          } else if (response.errorCode === 'Forbidden') {
            errorMessage =
              'Access denied. You do not have permission to view Teams Wanted ads for this account.';
          } else if (response.statusCode === 404) {
            errorMessage = 'Account not found or Teams Wanted feature is not available.';
          }

          setLocalError(errorMessage);
        }
      } catch (error) {
        console.error('Unexpected error in loadPageData:', error);
        setLocalError('An unexpected error occurred while loading Teams Wanted ads');
      } finally {
        // Clear the timeout and reset loading state
        clearTimeout(loadingTimeout);
        setLocalLoading(false);
      }
    },
    [accountId, token],
  );

  // Load initial data on mount only
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!token) {
          return;
        }
        const response = await playerClassifiedService.getTeamsWanted(
          accountId,
          {
            page: 1,
            limit: 25,
            sortBy: 'dateCreated',
            sortOrder: 'desc',
            type: 'teams',
          },
          token,
        );

        if (response.success && response.data) {
          setLocalTeamsWanted(response.data.data);
          // Update pagination info from API response
          setPaginationInfo({
            total: response.data.total || 0,
            totalPages: response.data.pagination?.totalPages || 0,
            hasNext: response.data.pagination?.hasNext || false,
            hasPrev: response.data.pagination?.hasNext || false,
          });
          // Data loaded successfully
          // Clear any previous errors on success
          setLocalError(null);
        } else {
          // Handle error response
          let errorMessage = response.error || 'Failed to load Teams Wanted ads';

          // Handle specific error types
          if (response.errorCode === 'Unauthorized') {
            errorMessage =
              'You are not authorized to view Teams Wanted ads for this account. Please sign in or join the account.';
          } else if (response.errorCode === 'Forbidden') {
            errorMessage =
              'Access denied. You do not have permission to view Teams Wanted ads for this account.';
          } else if (response.statusCode === 404) {
            errorMessage = 'Account not found or Teams Wanted feature is not available.';
          }

          setLocalError(errorMessage);
        }
      } catch (error) {
        console.error('Unexpected error in loadInitialData:', error);
        setLocalError('An unexpected error occurred while loading Teams Wanted ads');
      }
    };

    loadInitialData();
  }, [accountId, token]);

  // Utility function to convert ITeamsWantedResponse to ITeamsWantedFormState
  const convertToFormState = (classified: ITeamsWantedResponse): ITeamsWantedFormState => {
    return {
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
  };

  // Check if user can perform operation without access code
  const canOperateWithoutAccessCode = (classified: ITeamsWantedResponse) => {
    // AccountAdmins and owners can operate without access code
    return (
      isAccountMember &&
      (canEditTeamsWantedById(classified) || canDeleteTeamsWantedById(classified))
    );
  };

  // Handle edit
  const handleEdit = (id: string, _accessCodeRequired: string) => {
    const classified = localTeamsWanted.find((c) => c.id.toString() === id);
    if (!classified) return;

    if (canOperateWithoutAccessCode(classified)) {
      // AccountAdmins can edit directly - open edit dialog
      setEditingClassified(classified);
      setEditDialogOpen(true);
    }
    // Access code verification is handled by TeamsWantedStateManager for non-AccountAdmins
  };

  // Handle edit dialog close
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingClassified(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async (formData: ITeamsWantedFormState) => {
    if (!editingClassified) return;

    try {
      // For AccountAdmins, no access code is needed - use empty string
      const updatedClassified = await updateTeamsWanted(
        editingClassified.id.toString(),
        formData,
        '',
      );

      // Update the local state with the updated classified (no server call needed)
      setLocalTeamsWanted((prev) =>
        prev.map((item) =>
          item.id.toString() === editingClassified.id.toString() ? updatedClassified : item,
        ),
      );

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
    const classified = localTeamsWanted.find((c) => c.id.toString() === id);
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
      loadPageData(pagination.page, pagination.limit);
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
      // Refresh the data to show the new ad
      loadPageData(pagination.page, pagination.limit);
    } catch (error) {
      // Error is already handled by the hook
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Loading state
  if (localLoading && localTeamsWanted.length === 0) {
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

      {/* Content - Delegated to TeamsWantedStateManager */}
      <TeamsWantedStateManager
        accountId={accountId}
        teamsWanted={localTeamsWanted}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditTeamsWantedById}
        canDelete={canDeleteTeamsWantedById}
        loading={localLoading}
        error={localError || undefined}
        autoVerificationData={autoVerificationData}
        onVerificationProcessed={onVerificationProcessed}
      />

      {/* Pagination Controls - Only show for authenticated account members */}
      {isAuthenticated && isAccountMember && localTeamsWanted.length > 0 && (
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
            currentItems={localTeamsWanted.length}
            itemLabel="Ads"
            loading={localLoading}
            showPageSize={true}
            showJumpControls={false}
          />
        </Box>
      )}

      {/* Create Dialog */}
      <CreateTeamsWantedDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTeamsWanted}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Teams Wanted Ad</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the Teams Wanted ad by &quot;{selectedClassified?.name}
            &quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete Ad
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <CreateTeamsWantedDialog
        open={editDialogOpen}
        onClose={closeEditDialog}
        onSubmit={handleEditSubmit}
        loading={formLoading}
        editMode={true}
        initialData={editingClassified ? convertToFormState(editingClassified) : undefined}
        _classifiedId={editingClassified?.id}
      />

      {/* TODO: Add AccessCodeVerificationDialog component */}
    </Box>
  );
};

export default TeamsWanted;
