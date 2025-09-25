'use client';

import React from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import Link from 'next/link';

interface TeamAdminPanelProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

const TeamAdminPanel: React.FC<TeamAdminPanelProps> = ({ accountId, seasonId, teamSeasonId }) => {
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
          Manage sponsors for this team to keep partner information up to date.
        </Typography>
      </Stack>
      <Button
        variant="contained"
        color="primary"
        startIcon={<HandshakeIcon />}
        component={Link}
        href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/sponsors/manage`}
      >
        Manage Team Sponsors
      </Button>
    </Paper>
  );
};

export default TeamAdminPanel;
