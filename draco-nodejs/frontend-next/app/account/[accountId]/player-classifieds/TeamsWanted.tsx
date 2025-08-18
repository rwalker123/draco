'use client';

import React from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import TeamsWantedCardPublic from '../../../../components/player-classifieds/TeamsWantedCardPublic';
import EmptyState from '../../../../components/common/EmptyState';
import { ITeamsWantedResponse } from '../../../../types/playerClassifieds';

interface TeamsWantedProps {
  accountId: string;
}

const TeamsWanted: React.FC<TeamsWantedProps> = ({ accountId }) => {
  // Use the main hook for data management
  const { teamsWanted, loading, error, refreshData, clearError } = usePlayerClassifieds(accountId);

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
    refreshData();
  };

  // Loading state
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
          <Button variant="outlined" onClick={handleRefresh} disabled={loading}>
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
      {teamsWanted.length === 0 ? (
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
          {/* Results Count */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              {teamsWanted.length} {teamsWanted.length === 1 ? 'ad' : 'ads'} posted
            </Typography>
            {loading && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Refreshing...
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
            {teamsWanted.map((classified: ITeamsWantedResponse) => (
              <Box key={classified.id}>
                <TeamsWantedCardPublic
                  classified={classified}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Box>
            ))}
          </Box>

          {/* Load More Button (for future pagination) */}
          {teamsWanted.length > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button variant="outlined" onClick={handleRefresh} disabled={loading}>
                Load More
              </Button>
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
