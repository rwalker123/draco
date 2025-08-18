'use client';

import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { PlayersWantedCard } from '../../../../components/player-classifieds';
import EmptyState from '../../../../components/common/EmptyState';
import { IPlayersWantedResponse } from '../../../../types/playerClassifieds';

// Test if console logging is working
console.log('🔧 PlayersWanted.tsx file loaded');
console.error('🚨 ERROR TEST 6 - This should definitely show up');

interface PlayersWantedProps {
  accountId: string;
}

const PlayersWanted: React.FC<PlayersWantedProps> = ({ accountId }) => {
  console.log(`🎯 PlayersWanted component render: accountId=${accountId}`);

  const { playersWanted, loading, error, deletePlayersWanted, refreshData, clearError } =
    usePlayerClassifieds(accountId);

  console.log(`🔗 PlayersWanted hook result:`, {
    playersWanted: playersWanted?.length || 0,
    loading,
    error,
    hasRefreshData: !!refreshData,
    hasDeletePlayersWanted: !!deletePlayersWanted,
  });

  useEffect(() => {
    console.log(`📱 PlayersWanted component mounted with accountId: ${accountId}`);
    console.log(`📊 Initial hook state:`, {
      playersWanted: playersWanted?.length || 0,
      loading,
      error,
    });
  }, [accountId, playersWanted, loading, error]);

  console.log(`🎨 PlayersWanted component rendering with:`, {
    playersWantedCount: playersWanted?.length || 0,
    loading,
    error,
    accountId,
  });

  if (loading) {
    console.log(`⏳ PlayersWanted: Showing loading state`);
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    console.log(`❌ PlayersWanted: Showing error state: ${error}`);
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!playersWanted || playersWanted.length === 0) {
    console.log(`📭 PlayersWanted: Showing empty state`);
    return (
      <Box sx={{ p: 2 }}>
        <EmptyState
          title="No Players Wanted"
          subtitle="No players are currently looking for teams."
        >
          <Button
            variant="contained"
            onClick={() => console.log('Create Players Wanted clicked (placeholder)')}
            sx={{ mt: 2 }}
          >
            Create Players Wanted
          </Button>
        </EmptyState>
      </Box>
    );
  }

  console.log(`✅ PlayersWanted: Rendering ${playersWanted.length} items`);

  return (
    <Box sx={{ p: 2 }}>
      {/* TEST BANNER - IF YOU SEE THIS, THE FILE IS UPDATED */}
      <Box
        sx={{
          backgroundColor: 'red',
          color: 'white',
          p: 2,
          mb: 2,
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        🚨 TEST BANNER - FILE UPDATED SUCCESSFULLY! 🚨
      </Box>

      {/* Header with Refresh Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Players Looking for Teams ({playersWanted.length})
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => {
            console.log('🔄 Refresh button clicked');
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
            onEdit={() => console.log('Edit clicked (placeholder)')}
            onDelete={() => console.log('Delete clicked (placeholder)')}
            canEdit={true}
            canDelete={true}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PlayersWanted;
