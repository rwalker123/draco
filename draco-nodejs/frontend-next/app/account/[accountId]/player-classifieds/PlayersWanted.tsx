'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

interface PlayersWantedProps {
  accountId: string;
}

const PlayersWanted: React.FC<PlayersWantedProps> = ({ accountId: _accountId }) => {
  return (
    <ProtectedRoute requiredRole="TeamAdmin" checkAccountBoundary={true}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Players Wanted
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // TODO: Open create dialog
              console.log('Create Players Wanted');
            }}
          >
            Post Players Wanted
          </Button>
        </Box>

        <Box>
          <Typography variant="body1" color="text.secondary">
            No players wanted ads posted yet. Be the first to post one!
          </Typography>
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

export default PlayersWanted;
