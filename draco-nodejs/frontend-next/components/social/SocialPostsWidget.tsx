'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { Twitter } from '@mui/icons-material';
import type { SocialFeedItemType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import { formatRelativeTime } from './utils';

interface SocialPostsWidgetProps {
  accountId?: string;
  seasonId?: string;
  limit?: number;
}

const SourceIcon: React.FC<{ source: string }> = ({ source }) => {
  switch (source) {
    case 'twitter':
      return <Twitter sx={{ color: '#1DA1F2' }} fontSize="small" />;
    default:
      return null;
  }
};

const SocialPostCard: React.FC<{ item: SocialFeedItemType }> = ({ item }) => {
  const postedLabel = formatRelativeTime(item.postedAt);
  const authorDisplay = item.authorName ?? item.channelName ?? 'Social';
  const handleDisplay = item.authorHandle ?? item.channelName ?? '';
  const initial = authorDisplay.charAt(0).toUpperCase();
  const mediaAttachment = item.media?.[0];
  const mediaUrl = mediaAttachment?.thumbnailUrl ?? mediaAttachment?.url;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SourceIcon source={item.source} />
          <Typography variant="caption" color="text.secondary">
            {postedLabel}
          </Typography>
          {item.permalink ? (
            <IconButton
              size="small"
              sx={{ marginLeft: 'auto' }}
              component="a"
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>{initial}</Avatar>
          <Box>
            <Typography variant="subtitle2">{authorDisplay}</Typography>
            {handleDisplay ? (
              <Typography variant="caption" color="text.secondary">
                {handleDisplay}
              </Typography>
            ) : null}
          </Box>
        </Box>
        <Typography variant="body2" color="text.primary">
          {item.content}
        </Typography>
        {mediaUrl ? (
          <Box
            component="img"
            src={mediaUrl}
            alt={authorDisplay}
            sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 1 }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

const SocialPostsWidget: React.FC<SocialPostsWidgetProps> = ({
  accountId,
  seasonId,
  limit = 4,
}) => {
  const { fetchFeed } = useSocialHubService({ accountId, seasonId });
  const [state, setState] = useState<{
    items: SocialFeedItemType[];
    error: string | null;
    completedKey: string;
  }>({ items: [], error: null, completedKey: '' });

  const canFetch = useMemo(() => Boolean(accountId && seasonId), [accountId, seasonId]);
  const requestKey = canFetch ? `${accountId}:${seasonId}:${limit}` : '';
  const isLoading = canFetch && state.completedKey !== requestKey;
  const hasData = state.items.length > 0;
  const loadCompleted = state.completedKey === requestKey;

  useEffect(() => {
    if (!canFetch) {
      return;
    }
    let isMounted = true;
    fetchFeed({ sources: ['twitter'], limit })
      .then((items) => {
        if (!isMounted) return;
        setState({ items, error: null, completedKey: requestKey });
      })
      .catch((error) => {
        if (!isMounted) return;
        setState({
          items: [],
          error: error instanceof Error ? error.message : 'Unable to load posts.',
          completedKey: requestKey,
        });
      });
    return () => {
      isMounted = false;
    };
  }, [canFetch, fetchFeed, limit, requestKey]);

  if (!canFetch) {
    return null;
  }

  // If we've loaded for this context and found nothing (no errors), hide the widget.
  if (!isLoading && loadCompleted && !state.error && !hasData) {
    return null;
  }

  const renderSkeletons = (count: number) => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={`social-skel-${index}`}
          variant="rounded"
          height={180}
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, borderRadius: 2 }}
        />
      ))}
    </Box>
  );

  return (
    <WidgetShell
      title="Recent Social Posts"
      subtitle="Latest posts mirrored for this account."
      accent="info"
    >
      {!canFetch ? (
        <Alert severity="info">Select an account and season to view posts.</Alert>
      ) : state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : isLoading && state.items.length === 0 ? (
        renderSkeletons(2)
      ) : state.items.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {state.items.slice(0, limit).map((item) => (
            <Box key={item.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
              <SocialPostCard item={item} />
            </Box>
          ))}
        </Box>
      ) : (
        <Alert severity="info">No recent posts yet.</Alert>
      )}
    </WidgetShell>
  );
};

export default SocialPostsWidget;
