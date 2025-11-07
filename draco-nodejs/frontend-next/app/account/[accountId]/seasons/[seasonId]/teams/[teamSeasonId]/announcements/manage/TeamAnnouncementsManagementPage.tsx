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
import AnnouncementsManager from '@/components/announcements/AnnouncementsManager';
import { useTeamHandoutHeader } from '@/hooks/useTeamHandoutHeader';

const TeamAnnouncementsManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const { teamHeader, loading, error } = useTeamHandoutHeader({
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

    if (!teamHeader) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Team information is currently unavailable.
        </Alert>
      );
    }

    return (
      <AnnouncementsManager
        scope={{ type: 'team', accountId, teamId: teamHeader.teamId }}
        title={`${teamHeader.teamName} Announcements`}
        description="Share updates with your team roster."
        accent="info"
        emptyMessage="No team announcements have been created yet."
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
                Team Announcement Management
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Publish messages to keep your team in sync.
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
            <Typography color="text.primary">Announcements</Typography>
          </Breadcrumbs>
        </Box>
        {renderContent()}
      </Container>
    </main>
  );
};

export default TeamAnnouncementsManagementPage;
