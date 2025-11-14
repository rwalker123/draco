'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Container,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import AccountPageHeader from '@/components/AccountPageHeader';
import TeamAvatar from '@/components/TeamAvatar';
import { useTeamHandoutHeader } from '@/hooks/useTeamHandoutHeader';
import InformationMessagesManager from '@/components/information/InformationMessagesManager';

const TeamInformationMessagesManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const { teamHeader, loading, error, notMember } = useTeamHandoutHeader({
    accountId,
    seasonId,
    teamSeasonId,
  });

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const breadcrumbHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (notMember) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You need to be part of this account to load team information.
        </Alert>
      );
    }

    if (!teamHeader) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Team information is currently unavailable.
        </Alert>
      );
    }

    return (
      <InformationMessagesManager
        scope={{
          type: 'team',
          accountId,
          teamSeasonId,
          teamId: teamHeader.teamId,
          teamLabel: teamHeader.teamName,
        }}
        title={`${teamHeader.teamName} Information Messages`}
        description="Share tailored instructions, reminders, and resources with your roster."
        accent="info"
      />
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box display="flex" justifyContent="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <TeamAvatar
              name={teamHeader?.teamName ?? 'Team'}
              logoUrl={teamHeader?.logoUrl}
              size={56}
              alt={`${teamHeader?.teamName ?? 'Team'} logo`}
            />
            <Stack spacing={0.5} sx={{ color: 'text.primary' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Team Information Messages
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Craft welcome content that keeps your athletes and staff aligned.
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box mb={2}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" underline="hover" component={NextLink} href={breadcrumbHref}>
              Team Overview
            </Link>
            <Typography color="text.primary">Information Messages</Typography>
          </Breadcrumbs>
        </Box>
        {renderContent()}
      </Container>
    </main>
  );
};

export default TeamInformationMessagesManagementPage;
