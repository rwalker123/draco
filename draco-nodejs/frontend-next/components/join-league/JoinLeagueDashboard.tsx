import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import WorkoutPreview from './WorkoutPreview';
import PlayersWantedPreview from './PlayersWantedPreview';
import ContactLeagueSection from './ContactLeagueSection';
import { AccountType } from '@draco/shared-schemas';

interface JoinLeagueDashboardProps {
  accountId: string;
  account: AccountType;
  token?: string;
  showViewAllWorkoutsButton?: boolean;
  onViewAllWorkouts?: () => void;
  isAccountMember?: boolean;
}

const JoinLeagueDashboard: React.FC<JoinLeagueDashboardProps> = ({
  accountId,
  account,
  token,
  showViewAllWorkoutsButton,
  onViewAllWorkouts,
  isAccountMember = false,
}) => {
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
        <WorkoutPreview
          accountId={accountId}
          token={token}
          showViewAllWorkoutsButton={showViewAllWorkoutsButton}
          onViewAllWorkouts={onViewAllWorkouts}
        />

        {/* Players Wanted Section */}
        <PlayersWantedPreview
          accountId={accountId}
          maxDisplay={3}
          isAccountMember={isAccountMember}
        />

        {/* Contact Section */}
        <ContactLeagueSection account={account} />
      </Box>
    </Paper>
  );
};

export default JoinLeagueDashboard;
