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

  const { fetchFeed } = useSocialHubService({
    accountId,
    seasonId: currentSeasonId ?? undefined,
  });

  const [posts, setPosts] = React.useState<SocialFeedItemType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const beforeCursorRef = React.useRef<string | undefined>(undefined);
  const [hasMore, setHasMore] = React.useState(false);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }
    void fetchCurrentSeason();
  }, [accountId, fetchCurrentSeason]);

  const loadPosts = React.useCallback(
    async (options?: { reset?: boolean }) => {
      if (!accountId || !currentSeasonId) {
        return;
      }

      const reset = options?.reset ?? false;
      const cursor = reset ? undefined : beforeCursorRef.current;

      setLoading(true);
      setError(null);
      if (reset) {
        beforeCursorRef.current = undefined;
      }

      try {
        const result = await fetchFeed({
          sources: [...SOURCES],
          limit: PAGE_SIZE,
          ...(cursor ? { before: cursor } : {}),
        });

        setPosts((prev) => (reset ? result : [...prev, ...result]));
        const nextCursor = result.length ? result[result.length - 1].postedAt : undefined;
        beforeCursorRef.current = nextCursor;
        setHasMore(result.length === PAGE_SIZE);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load social posts.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, currentSeasonId, fetchFeed],
  );

  React.useEffect(() => {
    if (currentSeasonId) {
      void loadPosts({ reset: true });
    }
  }, [currentSeasonId, loadPosts]);

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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {posts.map((item) => (
            <SocialPostCard key={item.id} item={item} />
          ))}
        </Box>
        {hasMore ? (
          <Box display="flex" justifyContent="center">
            <Button onClick={() => loadPosts()} disabled={loading} variant="outlined">
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
