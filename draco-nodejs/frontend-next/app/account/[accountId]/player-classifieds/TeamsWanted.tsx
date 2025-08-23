'use client';

import React from 'react';
import { Box, Typography, Button, CircularProgress, Stack } from '@mui/material';
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
  const [formLoading, setFormLoading] = React.useState(false);

  // Pagination state
  const { pagination, setPage, setLimit } = useClassifiedsPagination({
    initialPage: 1,
    initialLimit: 25,
  });

  // Use the main hook for data management with pagination
  const { teamsWanted, createTeamsWanted } = usePlayerClassifieds(accountId);

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

  // Handle edit (requires access code)
  const handleEdit = (id: string, accessCodeRequired: string) => {
    // TODO: Open edit dialog with access code input
    console.log('Edit requested for:', id, 'with access code:', accessCodeRequired);
  };

  // Handle delete (requires access code)
  const handleDelete = async (id: string, accessCodeRequired: string) => {
    // TODO: Implement access code validation before deletion
    console.log('Delete requested for:', id, 'with access code:', accessCodeRequired);
  };

  // Handle create teams wanted
  const handleCreateTeamsWanted = async (formData: ITeamsWantedFormState) => {
    setFormLoading(true);
    try {
      await createTeamsWanted(formData);
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
          >
            Post Teams Wanted
          </Button>
        </Box>

        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading teams wanted ads...
            </Typography>
          </Stack>
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
    </Box>
  );
};

export default TeamsWanted;
