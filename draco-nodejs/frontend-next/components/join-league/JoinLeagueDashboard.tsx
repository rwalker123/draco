import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TrainingSection from './TrainingSection';
import PlayersWantedPreview from './PlayersWantedPreview';
import ContactLeagueSection from './ContactLeagueSection';
import { WorkoutSummary } from '../../types/workouts';
import { AccountType } from '@draco/shared-schemas';

interface JoinLeagueDashboardProps {
  accountId: string;
  account: AccountType;
  workouts: WorkoutSummary[];
  token?: string;
}

const JoinLeagueDashboard: React.FC<JoinLeagueDashboardProps> = ({
  accountId,
  account,
  workouts,
  token,
}) => {
  const hasAnyContent = workouts.length > 0;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Main Header */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 1,
          }}
        >
          Ways to Join {account.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover opportunities to get involved in our baseball community
        </Typography>
      </Box>

      {/* Three-section layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gridTemplateRows: {
            xs: 'auto auto auto',
            md: 'auto auto',
            lg: 'auto',
          },
          gap: 4,
        }}
      >
        {/* Training Section - spans full width on tablet */}
        <Box
          sx={{
            gridColumn: {
              xs: '1',
              md: 'span 2',
              lg: '1',
            },
          }}
        >
          <TrainingSection workouts={workouts} accountId={accountId} token={token} />
        </Box>

        {/* Players Wanted Section */}
        <PlayersWantedPreview accountId={accountId} maxDisplay={3} />

        {/* Contact Section */}
        <ContactLeagueSection account={account} />
      </Box>
    </Paper>
  );
};

export default JoinLeagueDashboard;
