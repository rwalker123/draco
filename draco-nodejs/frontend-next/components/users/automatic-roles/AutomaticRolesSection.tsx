import React from 'react';
import { Box, Divider } from '@mui/material';
import TeamManagersList from './TeamManagersList';

interface AutomaticRolesSectionProps {
  accountOwner: {
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
  } | null; // Keep nullable for component safety, but expect it to always have value
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
    <Box sx={{ mt: 4, mb: 4 }}>
      <TeamManagersList teamManagers={teamManagers} />

      <Divider sx={{ mt: 3, mb: 3 }} />
    </Box>
  );
};

export default AutomaticRolesSection;
