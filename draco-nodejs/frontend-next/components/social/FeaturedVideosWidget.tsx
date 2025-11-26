'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Skeleton, Button } from '@mui/material';
import { YouTube } from '@mui/icons-material';
import NextLink from 'next/link';
import WidgetShell from '../ui/WidgetShell';
import SocialVideoCard from './SocialVideoCard';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import { truncateText } from '@/utils/emailUtils';
import type { SocialVideoType } from '@draco/shared-schemas';

interface FeaturedVideosWidgetProps {
  accountId?: string;
  seasonId?: string;
  viewAllHref?: string;
}

const renderSkeletons = (count: number) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton
        key={`featured-video-skeleton-${index}`}
        variant="rounded"
        height={210}
        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, borderRadius: 2 }}
      />
    ))}
  </Box>
);

type VideoState = {
  items: SocialVideoType[];
  loading: boolean;
  error: string | null;
};

const FeaturedVideosWidget: React.FC<FeaturedVideosWidgetProps> = ({
  accountId,
  seasonId,
  viewAllHref,
}) => {
  const { fetchVideos } = useSocialHubService({ accountId, seasonId });
  const canFetch = Boolean(accountId && seasonId);
  const [videoState, setVideoState] = useState<VideoState>({
    items: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let isActive = true;
    fetchVideos({ limit: 6 })
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
          error: error instanceof Error ? error.message : 'Unable to load social videos.',
        });
      });

    return () => {
      isActive = false;
    };
  }, [canFetch, fetchVideos]);

  const displayedVideos = videoState.items.slice(0, 6);

  return (
    <WidgetShell
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <YouTube sx={{ color: '#FF0000' }} /> Featured Videos
        </Box>
      }
      accent="info"
    >
      {!accountId || !seasonId ? (
        <Alert severity="info">Select an account and season to load social videos.</Alert>
      ) : (
        <>
          {videoState.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {videoState.error}
            </Alert>
          ) : null}
          {videoState.loading && videoState.items.length === 0 ? (
            renderSkeletons(3)
          ) : displayedVideos.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {displayedVideos.map((video) => {
                const truncatedVideo = {
                  ...video,
                  description: truncateText(video.description),
                };

                return (
                  <Box key={video.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                    <SocialVideoCard video={truncatedVideo} />
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Alert severity="info">No connected video streams yet.</Alert>
          )}

          {displayedVideos.length > 0 && viewAllHref ? (
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                variant="text"
                size="small"
                component={NextLink}
                href={viewAllHref}
                sx={{ textTransform: 'none' }}
              >
                View all videos
              </Button>
            </Box>
          ) : null}
        </>
      )}
    </WidgetShell>
  );
};

export default FeaturedVideosWidget;
