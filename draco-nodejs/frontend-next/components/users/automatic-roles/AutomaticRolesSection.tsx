import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import AccountOwnerDisplay from './AccountOwnerDisplay';
import TeamManagersList from './TeamManagersList';

interface AutomaticRolesSectionProps {
  accountOwner: {
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
  } | null;
  teamManagers: Array<{
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
    teams: Array<{
      teamSeasonId: string;
      teamName: string;
    }>;
  }>;
}

const AutomaticRolesSection: React.FC<AutomaticRolesSectionProps> = ({
  accountOwner,
  teamManagers,
}) => {
  // Don't render anything if there's no data
  if (!accountOwner && teamManagers.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          color: 'text.primary',
          fontWeight: 'bold',
        }}
      >
        Automatic Role Holders
      </Typography>

      <AccountOwnerDisplay accountOwner={accountOwner} />
      <TeamManagersList teamManagers={teamManagers} />

      <Divider sx={{ mt: 3, mb: 3 }} />
    </Box>
  );
};

export default AutomaticRolesSection;
