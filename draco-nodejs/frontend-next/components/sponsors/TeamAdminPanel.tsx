'use client';

import React from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import Link from 'next/link';

interface TeamAdminPanelProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  canManageSponsors?: boolean;
  showPlayerClassifiedsLink?: boolean;
  playerClassifiedsHref?: string;
}

const TeamAdminPanel: React.FC<TeamAdminPanelProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  canManageSponsors = true,
  showPlayerClassifiedsLink = false,
  playerClassifiedsHref,
}) => {
  const shouldShowClassifiedsLink = showPlayerClassifiedsLink && !!playerClassifiedsHref;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        border: '1px solid',
        borderColor: 'divider',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Team Admin Tools
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage the resources that keep your roster thriving.
        </Typography>
        {shouldShowClassifiedsLink && (
          <Typography variant="body2" color="text.secondary">
            Need reinforcements? Easily post a Teams Wanted ad to recruit new players.
          </Typography>
        )}
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {canManageSponsors && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<HandshakeIcon />}
            component={Link}
            href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/sponsors/manage`}
          >
            Manage Team Sponsors
          </Button>
        )}
        {shouldShowClassifiedsLink && (
          <Button
            variant={canManageSponsors ? 'outlined' : 'contained'}
            color={canManageSponsors ? 'primary' : 'secondary'}
            startIcon={<PersonSearchIcon />}
            component={Link}
            href={playerClassifiedsHref!}
          >
            Post Teams Wanted Ad
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default TeamAdminPanel;
