import React from 'react';
import { Box, Typography } from '@mui/material';
import WorkoutPreview from './WorkoutPreview';
import PlayersWantedPreview from './PlayersWantedPreview';
import ContactLeagueSection from './ContactLeagueSection';
import { AccountType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import AccountOptional from '../account/AccountOptional';

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
      sx={{
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <WorkoutPreview
          accountId={accountId}
          token={token}
          showViewAllWorkoutsButton={showViewAllWorkoutsButton}
          onViewAllWorkouts={onViewAllWorkouts}
        />
        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          <AccountOptional accountId={accountId} componentId="home.playerClassified.widget">
            <PlayersWantedPreview
              accountId={accountId}
              maxDisplay={3}
              isAccountMember={isAccountMember}
            />
          </AccountOptional>
          <ContactLeagueSection account={account} />
        </Box>
      </Box>
    </WidgetShell>
  );
};

export default JoinLeagueDashboard;
