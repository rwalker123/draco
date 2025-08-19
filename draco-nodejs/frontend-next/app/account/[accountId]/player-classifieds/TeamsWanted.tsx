'use client';

import React from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { useClassifiedsPagination } from '../../../../hooks/useClassifiedsPagination';
import { StreamPaginationControl } from '../../../../components/pagination';
import TeamsWantedCardPublic from '../../../../components/player-classifieds/TeamsWantedCardPublic';
import EmptyState from '../../../../components/common/EmptyState';
import { ITeamsWantedResponse } from '../../../../types/playerClassifieds';
import { playerClassifiedService } from '../../../../services/playerClassifiedService';

interface TeamsWantedProps {
  accountId: string;
}

const TeamsWanted: React.FC<TeamsWantedProps> = ({ accountId }) => {
  // Local state for teamsWanted data (bypassing hook for pagination)
  const [localTeamsWanted, setLocalTeamsWanted] = React.useState<ITeamsWantedResponse[]>([]);
  const [localLoading, setLocalLoading] = React.useState(false);
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

  // Pagination state
  const { pagination, setPage, setLimit } = useClassifiedsPagination({
    initialPage: 1,
    initialLimit: 25,
  });

  // Use the main hook for data management with pagination
  const { teamsWanted, error, clearError } = usePlayerClassifieds(accountId);

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
      // Set loading after 5 seconds to avoid flashing on fast page changes
      const loadingTimeout = setTimeout(() => {
        setLocalLoading(true);
      }, 5000);

      try {
        const response = await playerClassifiedService.getTeamsWanted(accountId, {
          page,
          limit,
          sortBy: 'dateCreated',
          sortOrder: 'desc',
          type: 'teams',
        });

        // Update the local teamsWanted data
        if (response.data) {
          setLocalTeamsWanted(response.data);
          // Update pagination info from API response
          setPaginationInfo({
            total: response.total || 0,
            totalPages: response.pagination?.totalPages || 0,
            hasNext: response.pagination?.hasNext || false,
            hasPrev: response.pagination?.hasPrev || false,
          });
        }
      } catch (error) {
        console.error('Failed to load page data:', error);
        // Error handling is done in the hook
      } finally {
        // Clear the timeout and reset loading state
        clearTimeout(loadingTimeout);
        setLocalLoading(false);
      }
    },
    [accountId],
  );

  // Load initial data on mount only
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await playerClassifiedService.getTeamsWanted(accountId, {
          page: 1,
          limit: 25,
          sortBy: 'dateCreated',
          sortOrder: 'desc',
          type: 'teams',
        });

        if (response.data) {
          setLocalTeamsWanted(response.data);
          // Update pagination info from API response
          setPaginationInfo({
            total: response.total || 0,
            totalPages: response.pagination?.totalPages || 0,
            hasNext: response.pagination?.hasNext || false,
            hasPrev: response.pagination?.hasPrev || false,
          });
          // Data loaded successfully
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [accountId]);

  // Handle edit (requires access code)
  const handleEdit = (_id: string, _accessCodeRequired: string) => {
    // TODO: Open edit dialog with access code input
  };

  // Handle delete (requires access code)
  const handleDelete = async (_id: string, _accessCodeRequired: string) => {
    // TODO: Implement access code validation before deletion
  };

  // Handle refresh
  const handleRefresh = () => {
    loadPageData(pagination.page, pagination.limit);
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
            onClick={() => {}} // TODO: Implement create dialog
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
            onClick={() => {}} // TODO: Implement create dialog
          >
            Post Teams Wanted
          </Button>
          <Button variant="outlined" onClick={handleRefresh} disabled={localLoading}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {localTeamsWanted.length === 0 ? (
        <EmptyState
          title="No Teams Wanted Ads"
          subtitle="Be the first to post a Teams Wanted ad to find a team to join."
          minHeight={300}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {}} // TODO: Implement create dialog
            sx={{ mt: 2 }}
          >
            Post Your First Ad
          </Button>
        </EmptyState>
      ) : (
        <Box>
          {/* Results Count and Pagination Info */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            {localLoading && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Grid of Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 3,
            }}
          >
            {localTeamsWanted.map((classified: ITeamsWantedResponse) => (
              <Box key={classified.id}>
                <TeamsWantedCardPublic
                  classified={classified}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Box>
            ))}
          </Box>

          {/* Pagination Controls */}
          {localTeamsWanted.length > 0 && (
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
        </Box>
      )}

      {/* TODO: Create Dialog */}
      {/* <CreateTeamsWantedDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={createTeamsWanted}
        loading={formLoading}
      /> */}
    </Box>
  );
};

export default TeamsWanted;
