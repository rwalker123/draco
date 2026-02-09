'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import type { SocialFeedItemType } from '@draco/shared-schemas';
import AccountPageHeader from '@/components/AccountPageHeader';
import SocialPostCard from '@/components/social/SocialPostCard';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import { useRole } from '@/context/RoleContext';
import ConfirmDeleteDialog from '@/components/social/ConfirmDeleteDialog';

const PAGE_SIZE = 50;
const SOURCES = ['twitter', 'bluesky'] as const;

const AccountSocialPostsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const {
    currentSeasonId,
    loading: seasonLoading,
    error: seasonError,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId || '');

  const { fetchFeed, deleteFeedItem, restoreFeedItem } = useSocialHubService({
    accountId,
    seasonId: currentSeasonId ?? undefined,
  });
  const { hasPermission } = useRole();
  const canManage = hasPermission('account.manage', accountId ? { accountId } : undefined);

  const [posts, setPosts] = React.useState<SocialFeedItemType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const beforeCursorRef = React.useRef<string | undefined>(undefined);
  const [hasMore, setHasMore] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<SocialFeedItemType | null>(null);
  const loadMoreControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => {
      loadMoreControllerRef.current?.abort();
    };
  }, []);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }
    void fetchCurrentSeason();
  }, [accountId, fetchCurrentSeason]);

  React.useEffect(() => {
    if (!accountId || !currentSeasonId) {
      return;
    }

    const controller = new AbortController();

    const loadInitialPosts = async () => {
      beforeCursorRef.current = undefined;
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFeed(
          {
            sources: [...SOURCES],
            limit: PAGE_SIZE,
            includeDeleted: canManage,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setPosts(result);
        const nextCursor = result.length ? result[result.length - 1].postedAt : undefined;
        beforeCursorRef.current = nextCursor;
        setHasMore(result.length === PAGE_SIZE);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Unable to load social posts.';
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadInitialPosts();

    return () => {
      controller.abort();
    };
  }, [accountId, currentSeasonId, fetchFeed, canManage]);

  const loadMorePosts = async () => {
    if (!accountId || !currentSeasonId) {
      return;
    }

    loadMoreControllerRef.current?.abort();
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;

    const cursor = beforeCursorRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFeed(
        {
          sources: [...SOURCES],
          limit: PAGE_SIZE,
          includeDeleted: canManage,
          ...(cursor ? { before: cursor } : {}),
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      setPosts((prev) => [...prev, ...result]);
      const nextCursor = result.length ? result[result.length - 1].postedAt : undefined;
      beforeCursorRef.current = nextCursor;
      setHasMore(result.length === PAGE_SIZE);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Unable to load social posts.';
      setError(message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  if (!accountId) {
    return null;
  }

  const renderContent = () => {
    if (seasonLoading || loading) {
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

    if (!posts.length) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          No social posts have been ingested yet. Connect your Twitter or Bluesky accounts to see
          updates here.
        </Alert>
      );
    }

    return (
      <Stack spacing={3}>
        <ConfirmDeleteDialog
          open={Boolean(pendingDelete)}
          onClose={() => setPendingDelete(null)}
          title="Delete social post?"
          message="This removes the post from this site only. It does not delete the original content on Twitter or Bluesky."
          onConfirm={async () => {
            const item = pendingDelete;
            if (!item) return;
            setPendingDelete(null);
            setDeletingId(item.id);
            try {
              await deleteFeedItem(item.id);
              setPosts((prev) =>
                prev.map((post) =>
                  post.id === item.id ? { ...post, deletedAt: new Date().toISOString() } : post,
                ),
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to delete social post.';
              setError(message);
            } finally {
              setDeletingId(null);
            }
          }}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {posts.map((item) => (
            <SocialPostCard
              key={item.id}
              item={item}
              canDelete={canManage}
              deleting={deletingId === item.id}
              restoring={restoringId === item.id}
              onRestore={async (id) => {
                setRestoringId(id);
                setError(null);
                try {
                  await restoreFeedItem(id);
                  setPosts((prev) =>
                    prev.map((post) => (post.id === id ? { ...post, deletedAt: null } : post)),
                  );
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : 'Unable to restore social post.';
                  setError(message);
                } finally {
                  setRestoringId(null);
                }
              }}
              confirmDelete={setPendingDelete}
            />
          ))}
        </Box>
        {hasMore ? (
          <Box display="flex" justifyContent="center">
            <Button onClick={() => loadMorePosts()} disabled={loading} variant="outlined">
              Load more messages
            </Button>
          </Box>
        ) : null}
      </Stack>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Social Messages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review every ingested Twitter and Bluesky message for this season.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
          <Link component={NextLink} href={`/account/${accountId}/social-hub`} underline="hover">
            Social Hub
          </Link>
          <Typography color="text.primary">Social Messages</Typography>
        </Breadcrumbs>
        {renderContent()}
      </Container>
    </main>
  );
};

export default AccountSocialPostsPage;
