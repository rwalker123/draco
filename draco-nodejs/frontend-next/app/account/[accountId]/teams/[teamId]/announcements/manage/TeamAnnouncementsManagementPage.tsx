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
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import AnnouncementsManager from '../../../../../../../components/announcements/AnnouncementsManager';
import { useTeamHandoutHeader } from '../../../../../../../hooks/useTeamHandoutHeader';

const TeamAnnouncementsManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const teamIdParam = params?.teamId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const teamId = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;

  const { teamHeader, loading, error, notMember } = useTeamHandoutHeader({
    accountId,
    teamId,
  });

  if (!accountId || !teamId) {
    return null;
  }

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
        <Alert severity="info" sx={{ mb: 2 }}>
          You must be a member of this team to manage announcements.
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
    <ProtectedRoute requiredPermission="team.manage" checkAccountBoundary>
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
          {teamHeader ? (
            <Box mb={2}>
              <Breadcrumbs aria-label="breadcrumb">
                <Link
                  color="inherit"
                  underline="hover"
                  component={NextLink}
                  href={
                    teamHeader.teamSeasonId && teamHeader.seasonId
                      ? `/account/${accountId}/seasons/${teamHeader.seasonId}/teams/${teamHeader.teamSeasonId}`
                      : `/account/${accountId}/teams/${teamHeader.teamId}`
                  }
                >
                  Team Overview
                </Link>
                <Typography color="text.primary">Announcements</Typography>
              </Breadcrumbs>
            </Box>
          ) : null}
          {renderContent()}
        </Container>
      </main>
    </ProtectedRoute>
  );
};

export default TeamAnnouncementsManagementPage;
