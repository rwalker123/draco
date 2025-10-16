'use client';

import React from 'react';
import { Alert, Box, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import { getTeamSeasonDetails as apiGetTeamSeasonDetails } from '@draco/shared-api-client';
import type { TeamSeasonRecordType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../../../../../../../utils/apiResult';
import { useApiClient } from '../../../../../../../../hooks/useApiClient';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import TeamAvatar from '../../../../../../../../components/TeamAvatar';
import HandoutSection from '@/components/handouts/HandoutSection';
import { useTeamMembership } from '../../../../../../../../hooks/useTeamMembership';

export interface TeamHeaderData {
  teamName: string;
  leagueName?: string;
  logoUrl?: string;
  teamId: string;
}

export function useTeamHandoutHeader(accountId?: string, seasonId?: string, teamSeasonId?: string) {
  const apiClient = useApiClient();
  const [teamHeader, setTeamHeader] = React.useState<TeamHeaderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      return;
    }

    let ignore = false;

    const fetchTeam = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGetTeamSeasonDetails({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        });

        const data = unwrapApiResult<TeamSeasonRecordType>(
          result,
          'Failed to load team information',
        );

        if (ignore) {
          return;
        }

        setTeamHeader({
          teamName: data.name ?? 'Team',
          leagueName: data.league?.name ?? undefined,
          logoUrl: data.team.logoUrl ?? undefined,
          teamId: data.team.id,
        });
      } catch (err) {
        if (ignore) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load team information';
        setError(message);
        setTeamHeader(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchTeam();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient, seasonId, teamSeasonId]);

  return { teamHeader, loading, error };
}

const TeamHandoutsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const { teamHeader, loading, error } = useTeamHandoutHeader(accountId, seasonId, teamSeasonId);
  const {
    isMember: isTeamMember,
    loading: membershipLoading,
    error: membershipError,
  } = useTeamMembership(accountId, teamSeasonId, seasonId);

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const renderContent = () => {
    if (loading || membershipLoading) {
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

    if (membershipError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {membershipError}
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

    if (!isTeamMember) {
      return null;
    }

    return (
      <HandoutSection
        scope={{ type: 'team', accountId, teamId: teamHeader.teamId }}
        title="Team Handouts"
        description="Download the documents shared with your team."
        allowManage={false}
        variant="panel"
        emptyMessage="No team handouts have been posted yet."
        hideWhenEmpty
      />
    );
  };

  return (
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
                {teamHeader?.teamName || 'Team Handouts'}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </AccountPageHeader>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {renderContent()}
      </Container>
    </main>
  );
};

export default TeamHandoutsPage;
