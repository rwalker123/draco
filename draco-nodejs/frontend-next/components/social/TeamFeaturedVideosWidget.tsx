'use client';

import React, { useEffect, useState } from 'react';
import { Box, Alert, Skeleton, Typography } from '@mui/material';
import type { SocialVideoType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import SocialVideoCard from './SocialVideoCard';

interface TeamFeaturedVideosWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  youtubeChannelId?: string | null;
  teamName?: string | null;
}

interface VideoState {
  items: SocialVideoType[];
  loading: boolean;
  error: string | null;
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

const TeamFeaturedVideosWidget: React.FC<TeamFeaturedVideosWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  youtubeChannelId,
  teamName,
}) => {
  const { fetchVideos } = useSocialHubService({ accountId, seasonId });
  const [videoState, setVideoState] = useState<VideoState>({
    items: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      setVideoState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setVideoState((prev) => ({ ...prev, loading: true, error: null }));

    fetchVideos({ limit: 4, teamSeasonId })
      .then((items) => {
        if (!cancelled) {
          setVideoState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unable to load team videos.';
          setVideoState({ items: [], loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, teamSeasonId, fetchVideos]);

  const hasVideos = videoState.items.length > 0;
  const hasConfiguredChannel = Boolean(youtubeChannelId && youtubeChannelId.trim().length > 0);
  const heading = teamName ? `${teamName} Highlights` : 'Team Highlights';
  const subtitle = hasConfiguredChannel
    ? 'Catch the latest uploads from the team channel.'
    : 'Connect a YouTube channel so highlights appear here.';

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
      ) : hasConfiguredChannel ? (
        <Alert severity="info">
          No featured videos have been ingested yet. New uploads will appear automatically.
        </Alert>
      ) : (
        <Alert severity="info">
          Team administrators can connect a YouTube channel from the Team Admin panel to showcase
          highlights here.
        </Alert>
      )}

      {hasVideos && youtubeChannelId ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Videos sourced from
          {teamName ? ` the ${teamName} channel.` : ' the configured team channel.'}
        </Typography>
      ) : null}
    </WidgetShell>
  );
};

export default TeamFeaturedVideosWidget;
