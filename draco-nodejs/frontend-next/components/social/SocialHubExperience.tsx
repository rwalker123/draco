'use client';

import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Stack,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Twitter,
  Facebook,
  YouTube,
  Instagram,
  OpenInNew,
  ThumbUp,
  Comment,
  Share,
  Forum,
} from '@mui/icons-material';
import type { SocialFeedItemType } from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import { formatRelativeTime } from './utils';
import FeaturedVideosWidget from './FeaturedVideosWidget';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import HofSpotlightWidget from '@/components/hall-of-fame/HofSpotlightWidget';
import PlayersWantedPreview from '@/components/join-league/PlayersWantedPreview';
import MemberBusinessSpotlightWidget from '@/components/social/MemberBusinessSpotlightWidget';
import AccountOptional from '@/components/account/AccountOptional';
import CommunityChatsWidget from './CommunityChatsWidget';

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'twitter':
      return <Twitter sx={{ color: '#1DA1F2' }} />;
    case 'youtube':
      return <YouTube sx={{ color: '#FF0000' }} />;
    case 'instagram':
      return <Instagram sx={{ color: '#E4405F' }} />;
    case 'facebook':
      return <Facebook sx={{ color: '#4267B2' }} />;
    case 'discord':
      return <Forum sx={{ color: 'text.secondary.main' }} />;
    default:
      return <Share sx={{ color: 'text.secondary' }} />;
  }
};

const SocialFeedCard = ({ item }: { item: SocialFeedItemType }) => {
  const postedLabel = formatRelativeTime(item.postedAt);
  const authorDisplay = item.authorName ?? item.channelName;
  const handleDisplay = item.authorHandle ?? item.channelName;
  const initial = authorDisplay?.charAt(0).toUpperCase() ?? 'C';
  const mediaAttachment = item.media?.[0];
  const mediaUrl = mediaAttachment?.thumbnailUrl ?? mediaAttachment?.url ?? undefined;
  const reactions = item.metadata?.reactions ?? 0;
  const replies = item.metadata?.replies ?? 0;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {getSourceIcon(item.source)}
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            {postedLabel}
          </Typography>
          {item.permalink ? (
            <IconButton
              size="small"
              sx={{ ml: 'auto' }}
              component="a"
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{initial}</Avatar>
          <Box>
            <Typography variant="subtitle2">{authorDisplay}</Typography>
            <Typography variant="caption" color="text.secondary">
              {handleDisplay}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {item.content}
        </Typography>
        {mediaUrl && (
          <CardMedia
            component="img"
            height="200"
            image={mediaUrl}
            alt={item.channelName}
            sx={{ borderRadius: 1, mb: 2 }}
          />
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThumbUp fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">{reactions}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Comment fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">{replies}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Share fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">{item.source}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface SocialHubExperienceProps {
  accountId?: string;
  seasonId?: string;
  isAccountMember?: boolean | null;
}

export default function SocialHubExperience({
  accountId,
  seasonId,
  isAccountMember,
}: SocialHubExperienceProps) {
  const { fetchFeed } = useSocialHubService({
    accountId,
    seasonId,
  });
  const [feedState, setFeedState] = useState<{
    items: SocialFeedItemType[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: false, error: null });
  useEffect(() => {
    if (!accountId || !seasonId) {
      setFeedState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setFeedState((prev) => ({ ...prev, loading: true, error: null }));

    fetchFeed({ limit: 6 })
      .then((items) => {
        if (!cancelled) {
          setFeedState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedState({
            items: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load social feed.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, fetchFeed]);

  const displayedFeedItems = feedState.items.slice(0, 4);
  const renderCardSkeletons = (count: number) => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={`card-skeleton-${index}`}
          variant="rounded"
          height={210}
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, borderRadius: 2 }}
        />
      ))}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Social Media Section */}
        <Box sx={{ flex: { xs: 1, md: '2 1 0' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Share sx={{ mr: 1 }} /> Recent Social Media
            </Typography>
            {!accountId || !seasonId ? (
              <Alert severity="info">Select an account and season to view social activity.</Alert>
            ) : (
              <>
                {feedState.error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {feedState.error}
                  </Alert>
                ) : null}
                {feedState.loading && feedState.items.length === 0 ? (
                  renderCardSkeletons(2)
                ) : displayedFeedItems.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {displayedFeedItems.map((post) => (
                      <Box
                        key={post.id}
                        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}
                      >
                        <SocialFeedCard item={post} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No recent social posts yet.</Alert>
                )}
              </>
            )}
          </Paper>

          <Stack spacing={3}>
            <FeaturedVideosWidget
              accountId={accountId}
              seasonId={seasonId}
              viewAllHref={accountId ? `/account/${accountId}/social-hub/videos` : undefined}
            />

            <CommunityChatsWidget accountId={accountId} seasonId={seasonId} />
          </Stack>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: { xs: 1, md: '1 1 0' } }}>
          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="account.playerSurvey.widget">
                <SurveySpotlightWidget
                  accountId={accountId}
                  canAnswerSurvey={Boolean(isAccountMember)}
                />
              </AccountOptional>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="home.playerClassified.widget">
                <PlayersWantedPreview
                  accountId={accountId}
                  isAccountMember={Boolean(isAccountMember)}
                  maxDisplay={3}
                />
              </AccountOptional>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="profile.memberBusiness.card">
                <MemberBusinessSpotlightWidget
                  accountId={accountId}
                  seasonId={seasonId}
                  viewAllHref={`/account/${accountId}/social-hub/member-businesses`}
                />
              </AccountOptional>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="account.home.hallOfFame">
                <HofSpotlightWidget accountId={accountId} />
              </AccountOptional>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
