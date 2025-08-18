'use client';

import React from 'react';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { PlayersWantedCard } from '../../../../components/player-classifieds';
import EmptyState from '../../../../components/common/EmptyState';
import { IPlayersWantedResponse } from '../../../../types/playerClassifieds';

interface PlayersWantedProps {
  accountId: string;
}

const PlayersWanted: React.FC<PlayersWantedProps> = ({ accountId }) => {
  const { playersWanted, loading, error, refreshData, clearError } =
    usePlayerClassifieds(accountId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!playersWanted || playersWanted.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <EmptyState
          title="No Players Wanted"
          subtitle="No players are currently looking for teams."
        >
          <Button variant="contained" onClick={() => {}} sx={{ mt: 2 }}>
            Create Players Wanted
          </Button>
        </EmptyState>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Refresh Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Players Looking for Teams ({playersWanted.length})
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => {
            refreshData();
          }}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Players Wanted Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 2,
        }}
      >
        {playersWanted.map((classified: IPlayersWantedResponse) => (
          <PlayersWantedCard
            key={classified.id.toString()}
            classified={classified}
            onEdit={() => {}}
            onDelete={() => {}}
            canEdit={true}
            canDelete={true}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PlayersWanted;
