'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Link,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import AccountPageHeader from '@/components/AccountPageHeader';
import AdPlacement from '@/components/ads/AdPlacement';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import { useApiClient } from '@/hooks/useApiClient';
import SocialVideoCard from '@/components/social/SocialVideoCard';
import { listSeasonTeams, listSocialVideos } from '@draco/shared-api-client';
import type { SocialVideoType } from '@draco/shared-schemas';
import { unwrapApiResult } from '@/utils/apiResult';

const PAGE_SIZE = 12;
const FILTER_ALL = 'all';
const FILTER_ACCOUNT_ONLY = 'account-only';

const AccountVideosPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const {
    currentSeasonId,
    loading: seasonLoading,
    error: seasonError,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId || '');

  const { fetchVideos } = useSocialHubService({
    accountId,
    seasonId: currentSeasonId ?? undefined,
  });
  const apiClient = useApiClient();

  const [videos, setVideos] = React.useState<SocialVideoType[]>([]);
  const [selectedFilter, setSelectedFilter] = React.useState<string>(FILTER_ALL);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [teamOptions, setTeamOptions] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }
    void fetchCurrentSeason();
  }, [accountId, fetchCurrentSeason]);

  const loadVideos = React.useCallback(
    async (limitValue: number, currentFilter?: string | null) => {
      if (!accountId || !currentSeasonId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const filterValue = currentFilter ?? FILTER_ALL;
        const query =
          filterValue !== FILTER_ALL && filterValue !== FILTER_ACCOUNT_ONLY
            ? { limit: limitValue, teamId: filterValue }
            : filterValue === FILTER_ACCOUNT_ONLY
              ? { limit: limitValue, accountOnly: true }
              : { limit: limitValue };
        const result = await fetchVideos(query);
        setVideos(result);
        setHasMore(result.length === limitValue);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load videos.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, currentSeasonId, fetchVideos],
  );

  const buildTeamOptions = React.useCallback(async () => {
    if (!accountId || !currentSeasonId) {
      return;
    }
    try {
      const [videoResponse, teamsResponse] = await Promise.all([
        listSocialVideos({
          client: apiClient,
          path: { accountId, seasonId: currentSeasonId },
          query: { limit: 100 },
          throwOnError: false,
        }),
        listSeasonTeams({
          client: apiClient,
          path: { accountId, seasonId: currentSeasonId },
          throwOnError: false,
        }),
      ]);

      const videoPayload = unwrapApiResult<{ videos: SocialVideoType[] }>(
        videoResponse,
        'Failed to load social videos',
      );
      const teamsPayload = unwrapApiResult(teamsResponse, 'Failed to load season teams');

      const teamIdsWithVideos = new Set(
        (videoPayload?.videos ?? [])
          .map((video) => video.teamId)
          .filter((value): value is string => Boolean(value)),
      );

      if (!teamIdsWithVideos.size) {
        setTeamOptions([]);
        return;
      }

      const optionEntries: Array<{ id: string; name: string }> = [];
      const seen = new Set<string>();
      (teamsPayload ?? []).forEach((team) => {
        const id = team.team?.id;
        if (!id || !teamIdsWithVideos.has(id) || seen.has(id)) {
          return;
        }
        seen.add(id);
        optionEntries.push({
          id,
          name: team.name ?? 'Team',
        });
      });
      setTeamOptions(optionEntries);
    } catch {
      setTeamOptions([]);
    }
  }, [accountId, apiClient, currentSeasonId]);

  React.useEffect(() => {
    if (currentSeasonId) {
      void buildTeamOptions();
    }
  }, [currentSeasonId, buildTeamOptions]);

  React.useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [selectedFilter]);

  React.useEffect(() => {
    if (currentSeasonId) {
      void loadVideos(limit, selectedFilter);
    }
  }, [currentSeasonId, limit, selectedFilter, loadVideos]);

  if (!accountId) {
    return null;
  }

  const showFullPageLoader = (seasonLoading || loading) && !videos.length;

  const renderContent = () => {
    if (showFullPageLoader) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    }

    if (seasonError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {seasonError}
        </Alert>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!videos.length) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          No videos have been ingested yet. Connect YouTube channels to showcase highlights here.
        </Alert>
      );
    }

    return (
      <>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {videos.map((video) => (
            <Box key={video.id} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)' } }}>
              <SocialVideoCard video={video} />
            </Box>
          ))}
        </Box>
        {hasMore ? (
          <Box mt={3} textAlign="center">
            <Button
              variant="contained"
              onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Loading...' : 'Load more videos'}
            </Button>
          </Box>
        ) : null}
      </>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Account Videos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse featured uploads for this account or focus on a specific team channel.
          </Typography>
        </Box>
      </AccountPageHeader>

      <AdPlacement />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              component={NextLink}
              underline="hover"
              color="inherit"
              href={`/account/${accountId}/social-hub`}
            >
              Social Hub
            </Link>
            <Typography color="text.primary">Videos</Typography>
          </Breadcrumbs>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="team-filter-label">Filter videos</InputLabel>
            <Select
              labelId="team-filter-label"
              id="team-filter-select"
              value={selectedFilter}
              label="Filter videos"
              onChange={(event) => setSelectedFilter(event.target.value)}
            >
              <MenuItem value={FILTER_ALL}>All videos</MenuItem>
              <MenuItem value={FILTER_ACCOUNT_ONLY}>Account videos only</MenuItem>
              {teamOptions.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {renderContent()}
      </Container>
    </main>
  );
};

export default AccountVideosPage;
