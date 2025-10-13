'use client';

import React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import TeamAvatar from '../../../../../../../components/TeamAvatar';
import HandoutSection from '@/components/handouts/HandoutSection';
import { useTeamHandoutHeader } from '../TeamHandoutsPage';

const TeamHandoutManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const { teamHeader, loading, error } = useTeamHandoutHeader(accountId, seasonId, teamSeasonId);

  if (!accountId || !seasonId || !teamSeasonId) {
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

    if (!teamHeader) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Team details are unavailable at the moment.
        </Alert>
      );
    }

    return (
      <HandoutSection
        scope={{ type: 'team', accountId, teamId: teamHeader.teamId }}
        title="Manage Team Handouts"
        description="Upload new files or refresh your team resources."
        allowManage
        variant="panel"
        emptyMessage="No team handouts have been added yet."
      />
    );
  };

  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <TeamAvatar
                name={teamHeader?.teamName || 'Team'}
                logoUrl={teamHeader?.logoUrl}
                size={56}
                alt={`${teamHeader?.teamName || 'Team'} logo`}
              />
              <Stack spacing={0.5}>
                {teamHeader?.leagueName && (
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {teamHeader.leagueName}
                  </Typography>
                )}
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {teamHeader?.teamName ? `${teamHeader.teamName} Handout Management` : 'Team Handout Management'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </AccountPageHeader>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {renderContent()}
        </Container>
      </main>
    </ProtectedRoute>
  );
};

export default TeamHandoutManagementPage;
