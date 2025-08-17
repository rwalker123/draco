'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface TeamsWantedProps {
  accountId: string;
}

const TeamsWanted: React.FC<TeamsWantedProps> = ({ accountId: _accountId }) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Teams Wanted
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Open create dialog
            console.log('Create Teams Wanted');
          }}
        >
          Post Teams Wanted
        </Button>
      </Box>

      <Box>
        <Typography variant="body1" color="text.secondary">
          No teams wanted ads posted yet. Be the first to post one!
        </Typography>
      </Box>
    </Box>
  );
};

export default TeamsWanted;
