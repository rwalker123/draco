'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Skeleton, Button } from '@mui/material';
import { YouTube } from '@mui/icons-material';
import NextLink from 'next/link';
import type { SocialVideoType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import SocialVideoCard from './SocialVideoCard';
import { useSocialHubService } from '@/hooks/useSocialHubService';

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

const FeaturedVideosWidget: React.FC<FeaturedVideosWidgetProps> = ({
  accountId,
  seasonId,
  viewAllHref,
}) => {
  const { fetchVideos } = useSocialHubService({ accountId, seasonId });
  const [state, setState] = useState<{
    items: SocialVideoType[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: false, error: null });

  useEffect(() => {
    if (!accountId || !seasonId) {
      setState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchVideos({ limit: 6 })
      .then((items) => {
        if (!cancelled) {
          setState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            items: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load social videos.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, fetchVideos]);

  const displayedVideos = state.items.slice(0, 6);

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
          {state.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          ) : null}
          {state.loading && state.items.length === 0 ? (
            renderSkeletons(3)
          ) : displayedVideos.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {displayedVideos.map((video) => (
                <Box key={video.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                  <SocialVideoCard video={video} />
                </Box>
              ))}
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
