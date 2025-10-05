import React from 'react';
import { Box, Divider } from '@mui/material';
import TeamManagersList from './TeamManagersList';
import { BaseContactType, TeamManagerWithTeamsType } from '@draco/shared-schemas';

interface AutomaticRolesSectionProps {
  accountOwner: BaseContactType | null; // Keep nullable for component safety, but expect it to always have value
  teamManagers: TeamManagerWithTeamsType[];
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
