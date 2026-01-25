'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Skeleton, Button } from '@mui/material';
import type { SocialFeedItemType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import SocialPostCard from './SocialPostCard';
import { useRole } from '@/context/RoleContext';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface SocialPostsWidgetProps {
  accountId?: string;
  seasonId?: string;
  limit?: number;
  viewAllHref?: string;
}

const SocialPostsWidget: React.FC<SocialPostsWidgetProps> = ({
  accountId,
  seasonId,
  limit = 4,
  viewAllHref,
}) => {
  const { fetchFeed, deleteFeedItem } = useSocialHubService({
    accountId,
    seasonId,
  });
  const { hasPermission } = useRole();
  const canManage = hasPermission('account.manage', accountId ? { accountId } : undefined);
  const [state, setState] = useState<{
    items: SocialFeedItemType[];
    error: string | null;
    completedKey: string;
  }>({ items: [], error: null, completedKey: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SocialFeedItemType | null>(null);

  const canFetch = Boolean(accountId && seasonId);
  const requestKey = canFetch ? `${accountId}:${seasonId}:${limit}` : '';
  const isLoading = canFetch && state.completedKey !== requestKey;
  const hasData = state.items.length > 0;
  const loadCompleted = state.completedKey === requestKey;

  useEffect(() => {
    if (!canFetch) {
      return;
    }
    let isMounted = true;
    fetchFeed({
      sources: ['twitter', 'bluesky'],
      limit,
      includeDeleted: false,
    })
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
      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const item = pendingDelete;
          if (!item) return;
          setPendingDelete(null);
          setDeletingId(item.id);
          try {
            await deleteFeedItem(item.id);
            setState((prev) => ({
              ...prev,
              items: prev.items.filter((existing) => existing.id !== item.id),
            }));
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to delete social post.';
            setState((prev) => ({ ...prev, error: message }));
          } finally {
            setDeletingId(null);
          }
        }}
        message="This removes the post from this site only. It does not delete the original content on Twitter or Bluesky."
        title="Delete social post?"
      />
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
              <SocialPostCard
                item={item}
                canDelete={canManage}
                deleting={deletingId === item.id}
                confirmDelete={setPendingDelete}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Alert severity="info">No recent posts yet.</Alert>
      )}
      {viewAllHref && state.items.length > 0 ? (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button component="a" href={viewAllHref} variant="text">
            View all messages
          </Button>
        </Box>
      ) : null}
    </WidgetShell>
  );
};

export default SocialPostsWidget;
