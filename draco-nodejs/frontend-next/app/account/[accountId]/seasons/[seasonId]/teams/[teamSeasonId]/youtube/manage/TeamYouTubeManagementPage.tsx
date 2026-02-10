'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Link,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import AccountPageHeader from '@/components/AccountPageHeader';
import TeamAvatar from '@/components/TeamAvatar';
import YouTubeChannelAdminPanel from '@/components/social/YouTubeChannelAdminPanel';
import { useTeamHandoutHeader } from '@/hooks/useTeamHandoutHeader';
import { useApiClient } from '@/hooks/useApiClient';
import { getTeamSeasonDetails as apiGetTeamSeasonDetails } from '@draco/shared-api-client';
import type { TeamSeasonRecordType } from '@draco/shared-schemas';
import { unwrapApiResult } from '@/utils/apiResult';

interface ChannelState {
  channelId: string | null;
  loading: boolean;
  error: string | null;
}

const TeamYouTubeManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const apiClient = useApiClient();
  const {
    teamHeader,
    loading: headerLoading,
    error: headerError,
    notMember,
  } = useTeamHandoutHeader({
    accountId,
    seasonId,
    teamSeasonId,
  });

  const [channelState, setChannelState] = React.useState<ChannelState>({
    channelId: null,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      return;
    }

    const controller = new AbortController();

    const loadChannelState = async () => {
      setChannelState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const result = await apiGetTeamSeasonDetails({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult<TeamSeasonRecordType>(
          result,
          'Failed to load team YouTube configuration',
        );
        setChannelState({
          channelId: data.team.youtubeUserId ?? null,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Unable to load the current YouTube configuration.';
        setChannelState({ channelId: null, loading: false, error: message });
      }
    };

    void loadChannelState();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, seasonId, teamSeasonId]);

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const breadcrumbHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  const renderContent = () => {
    if (headerLoading || channelState.loading) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    }

    if (headerError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {headerError}
        </Alert>
      );
    }

    if (notMember) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You need to be part of this account to manage the team YouTube channel.
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
      <>
        {channelState.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {channelState.error}
          </Alert>
        ) : null}
        <YouTubeChannelAdminPanel
          context="team"
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          currentChannelId={channelState.channelId}
          title="Team YouTube Channel"
          subtitle="Showcase highlights across the Social Hub and team page."
          description={`Connect the ${teamHeader.teamName} channel to feature new uploads automatically.`}
          onTeamSeasonUpdated={(updated) =>
            setChannelState({
              channelId: updated.team.youtubeUserId ?? null,
              loading: false,
              error: null,
            })
          }
        />
      </>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box display="flex" justifyContent="center">
          <Box display="flex" gap={2} alignItems="center">
            <TeamAvatar
              name={teamHeader?.teamName ?? 'Team'}
              logoUrl={teamHeader?.logoUrl}
              size={56}
              alt={`${teamHeader?.teamName ?? 'Team'} logo`}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Team YouTube Channel
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Connect your team’s official channel to feature new uploads automatically.
              </Typography>
            </Box>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box mb={2}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" underline="hover" component={NextLink} href={breadcrumbHref}>
              Team Overview
            </Link>
            <Typography color="text.primary">YouTube Channel</Typography>
          </Breadcrumbs>
        </Box>
        {renderContent()}
      </Container>
    </main>
  );
};

export default TeamYouTubeManagementPage;
