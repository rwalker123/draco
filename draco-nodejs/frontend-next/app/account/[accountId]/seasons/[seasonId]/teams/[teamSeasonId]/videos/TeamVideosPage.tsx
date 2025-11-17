'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Button,
  Typography,
  Link,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import AccountPageHeader from '@/components/AccountPageHeader';
import TeamAvatar from '@/components/TeamAvatar';
import { useTeamHandoutHeader } from '@/hooks/useTeamHandoutHeader';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import SocialVideoCard from '@/components/social/SocialVideoCard';
import type { SocialVideoType } from '@draco/shared-schemas';

const PAGE_SIZE = 12;

const TeamVideosPage: React.FC = () => {
  const [channelUrl, setChannelUrl] = React.useState<string | null>(null);
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const {
    teamHeader,
    loading: teamHeaderLoading,
    error: teamHeaderError,
  } = useTeamHandoutHeader({
    accountId,
    seasonId,
    teamSeasonId,
  });
  const { fetchVideos } = useSocialHubService({ accountId, seasonId });

  const [videos, setVideos] = React.useState<SocialVideoType[]>([]);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);

  React.useEffect(() => {
    if (teamHeader?.youtubeUserId) {
      setChannelUrl(`https://www.youtube.com/channel/${teamHeader.youtubeUserId}`);
    } else {
      setChannelUrl(null);
    }
  }, [teamHeader?.youtubeUserId]);

  const loadVideos = React.useCallback(
    async (limitValue: number, teamId?: string | null) => {
      if (!accountId || !teamId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchVideos({ limit: limitValue, teamId });
        setVideos(result);
        setHasMore(result.length === limitValue);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load team videos.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, fetchVideos],
  );

  React.useEffect(() => {
    if (teamHeader?.teamId) {
      void loadVideos(limit, teamHeader.teamId);
    }
  }, [limit, loadVideos, teamHeader?.teamId]);

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const breadcrumbHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  const renderBody = () => {
    if (teamHeaderLoading || loading) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    }

    if (teamHeaderError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {teamHeaderError}
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
          No team videos have been ingested yet. New uploads will appear automatically.
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
            <Button variant="contained" onClick={() => setLimit((prev) => prev + PAGE_SIZE)}>
              Load more videos
            </Button>
          </Box>
        ) : null}
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
              <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>
                {teamHeader?.teamName ?? 'Team'} Videos
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Browse every video ingested for this team.
              </Typography>
              {channelUrl ? (
                <Button
                  variant="outlined"
                  size="small"
                  component="a"
                  href={channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  Open YouTube channel
                </Button>
              ) : null}
            </Box>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={2}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={NextLink} underline="hover" color="inherit" href={breadcrumbHref}>
              Team Overview
            </Link>
            <Typography color="text.primary">Videos</Typography>
          </Breadcrumbs>
        </Box>
        {renderBody()}
      </Container>
    </main>
  );
};

export default TeamVideosPage;
