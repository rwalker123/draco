import React from 'react';
import { Box, Typography } from '@mui/material';
import WorkoutPreview from './WorkoutPreview';
import PlayersWantedPreview from './PlayersWantedPreview';
import ContactLeagueSection from './ContactLeagueSection';
import { AccountType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';

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
    <WidgetShell
      title={
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Ways to Join {account.name}
        </Typography>
      }
      subtitle={
        <Typography variant="body2" color="text.secondary">
          Discover opportunities to get involved in our baseball community
        </Typography>
      }
      accent="primary"
      sx={{ mb: 3 }}
    >
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
        <WorkoutPreview
          accountId={accountId}
          token={token}
          showViewAllWorkoutsButton={showViewAllWorkoutsButton}
          onViewAllWorkouts={onViewAllWorkouts}
        />
        <PlayersWantedPreview
          accountId={accountId}
          maxDisplay={3}
          isAccountMember={isAccountMember}
        />
        <ContactLeagueSection account={account} />
      </Box>
    </WidgetShell>
  );
};

export default JoinLeagueDashboard;
