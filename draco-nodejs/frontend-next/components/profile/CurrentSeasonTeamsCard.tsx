'use client';

import React from 'react';
import NextLink from 'next/link';
import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import type { PublicPlayerTeamAffiliationType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';

interface CurrentSeasonTeamsCardProps {
  accountId: string;
  seasonName: string | null;
  teams: PublicPlayerTeamAffiliationType[];
  loading: boolean;
  error?: string | null;
}

const CurrentSeasonTeamsCard: React.FC<CurrentSeasonTeamsCardProps> = ({
  accountId,
  seasonName,
  teams,
  loading,
  error,
}) => {
  const widgetSx = { p: 4 };
  const title = seasonName ? `${seasonName} Teams` : 'Current Season Teams';

  if (loading) {
    return (
      <WidgetShell title={title} accent="primary" sx={widgetSx}>
        <Stack spacing={1.5}>
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={48} />
        </Stack>
      </WidgetShell>
    );
  }

  if (error) {
    return (
      <WidgetShell title={title} accent="primary" sx={widgetSx}>
        <Alert severity="error">{error}</Alert>
      </WidgetShell>
    );
  }

  if (!seasonName) {
    return (
      <WidgetShell title={title} accent="primary" sx={widgetSx}>
        <Alert severity="info">No current season is configured for this account.</Alert>
      </WidgetShell>
    );
  }

  if (teams.length === 0) {
    return (
      <WidgetShell title={title} accent="primary" sx={widgetSx}>
        <Alert severity="info">Not rostered on any team this season.</Alert>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title={title} accent="primary" sx={widgetSx}>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {teams.map((team) => (
          <Box
            key={team.teamSeasonId}
            component={NextLink}
            href={`/account/${accountId}/seasons/${team.seasonId}/teams/${team.teamSeasonId}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              color: 'inherit',
              py: 1,
              '&:hover .team-name': {
                textDecoration: 'underline',
              },
            }}
          >
            <GroupsIcon color="primary" />
            <Box>
              <Typography
                variant="body1"
                className="team-name"
                sx={{ fontWeight: 600 }}
                color="text.primary"
              >
                {team.teamName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {team.leagueName}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </WidgetShell>
  );
};

export default CurrentSeasonTeamsCard;
