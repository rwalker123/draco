'use client';

import React from 'react';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import AccountPageHeader from '@/components/AccountPageHeader';
import AccountOptional from '@/components/account/AccountOptional';
import EmailHistoryPanel from '@/components/emails/history/EmailHistoryPanel';

const TeamEmailHistoryPage: React.FC = () => {
  const params = useParams();

  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;

  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : (accountIdParam ?? '');
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : (seasonIdParam ?? '');
  const teamSeasonId = Array.isArray(teamSeasonIdParam)
    ? teamSeasonIdParam[0]
    : (teamSeasonIdParam ?? '');

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const teamOverviewHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  return (
    <AccountOptional accountId={accountId} componentId="team.emailHistory.page">
      <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AccountPageHeader accountId={accountId}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                Team Email History
              </Typography>
            </Box>
          </Box>
        </AccountPageHeader>

        <Box sx={{ px: 3, pt: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" underline="hover" component={NextLink} href={teamOverviewHref}>
              Team Overview
            </Link>
            <Typography color="text.primary">Email History</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ p: 3 }}>
          <EmailHistoryPanel
            accountId={accountId}
            scope="team"
            seasonId={seasonId}
            teamSeasonId={teamSeasonId}
            showBouncedAddresses={false}
          />
        </Box>
      </Box>
    </AccountOptional>
  );
};

export default TeamEmailHistoryPage;
