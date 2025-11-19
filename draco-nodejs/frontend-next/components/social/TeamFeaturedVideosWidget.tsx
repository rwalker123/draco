'use client';

import React, { useEffect, useState } from 'react';
import { Box, Alert, Skeleton, Typography, Button } from '@mui/material';
import NextLink from 'next/link';
import WidgetShell from '../ui/WidgetShell';
import type { SocialVideoType } from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import SocialVideoCard from './SocialVideoCard';

interface TeamFeaturedVideosWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  teamId: string;
  youtubeChannelId?: string | null;
  teamName?: string | null;
  viewAllHref?: string;
  channelUrl?: string | null;
}

const renderSkeletons = (count: number) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton
        key={`team-video-skeleton-${index}`}
        variant="rounded"
        height={210}
        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, borderRadius: 2 }}
      />
    ))}
  </Box>
);

type TeamVideoState = {
  items: SocialVideoType[];
  loading: boolean;
  error: string | null;
};

const TeamFeaturedVideosWidget: React.FC<TeamFeaturedVideosWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  teamId,
  youtubeChannelId,
  teamName,
  viewAllHref,
  channelUrl,
}) => {
  const { fetchVideos } = useSocialHubService({ accountId, seasonId });
  const hasConfiguredChannel = Boolean(youtubeChannelId && youtubeChannelId.trim().length > 0);
  const canFetch = Boolean(accountId && seasonId && teamSeasonId && teamId && hasConfiguredChannel);

  const [videoState, setVideoState] = useState<TeamVideoState>({
    items: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let isActive = true;

    fetchVideos({ limit: 4, teamId })
      .then((items) => {
        if (!isActive) {
          return;
        }
        setVideoState({ items, loading: false, error: null });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setVideoState({
          items: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load team videos.',
        });
      });

    return () => {
      isActive = false;
    };
  }, [canFetch, fetchVideos, teamId]);

  const hasVideos = videoState.items.length > 0;
  const heading = teamName ? `${teamName} Highlights` : 'Team Highlights';
  const subtitle = hasConfiguredChannel
    ? 'Catch the latest uploads from the team channel.'
    : 'Connect a YouTube channel so highlights appear here.';

  if (!hasConfiguredChannel) {
    return null;
  }

  if (!videoState.loading && !videoState.error && !hasVideos) {
    return null;
  }

  return (
    <WidgetShell title={heading} subtitle={subtitle} accent="info">
      {videoState.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {videoState.error}
        </Alert>
      ) : null}

      {videoState.loading && !hasVideos ? (
        renderSkeletons(2)
      ) : hasVideos ? (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {videoState.items.map((video) => (
            <Box key={video.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
              <SocialVideoCard video={video} />
            </Box>
          ))}
        </Box>
      ) : null}

      {hasVideos && youtubeChannelId ? (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Videos sourced from
            {teamName ? ` the ${teamName} channel.` : ' the configured team channel.'}
          </Typography>
          <Box display="flex" gap={1}>
            {channelUrl ? (
              <Button
                variant="text"
                size="small"
                component="a"
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                sx={{ textTransform: 'none' }}
              >
                Visit channel
              </Button>
            ) : null}
            {viewAllHref ? (
              <Button
                variant="text"
                size="small"
                component={NextLink}
                href={viewAllHref}
                sx={{ textTransform: 'none' }}
              >
                View all videos
              </Button>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </WidgetShell>
  );
};

export default TeamFeaturedVideosWidget;
