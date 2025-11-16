'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  Button,
  Stack,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Twitter,
  Facebook,
  YouTube,
  Instagram,
  Search,
  FilterList,
  Refresh,
  OpenInNew,
  ThumbUp,
  Comment,
  Share,
  Forum,
} from '@mui/icons-material';
import type {
  SocialFeedItemType,
  CommunityMessagePreviewType,
  CommunityChannelType,
} from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import { formatRelativeTime } from './utils';
import FeaturedVideosWidget from './FeaturedVideosWidget';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import HofSpotlightWidget from '@/components/hall-of-fame/HofSpotlightWidget';
import PlayersWantedPreview from '@/components/join-league/PlayersWantedPreview';
import WidgetShell from '../ui/WidgetShell';
import CommunityMessageList from './CommunityMessageList';
import NextLink from 'next/link';

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
  const { fetchFeed, fetchCommunityMessages, fetchCommunityChannels } = useSocialHubService({
    accountId,
    seasonId,
  });
  const [feedState, setFeedState] = useState<{
    items: SocialFeedItemType[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: false, error: null });
  const [communityState, setCommunityState] = useState<{
    items: CommunityMessagePreviewType[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: false, error: null });
  const [channelState, setChannelState] = useState<{
    channels: CommunityChannelType[];
    loading: boolean;
    error: string | null;
  }>({ channels: [], loading: false, error: null });
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const selectedChannel = channelState.channels.find((channel) => channel.id === selectedChannelId);
  const selectedDiscordChannelId = selectedChannel?.discordChannelId;
  const handleOpenMessagePermalink = useCallback((permalink?: string) => {
    if (!permalink) {
      return;
    }
    window.open(permalink, '_blank', 'noopener,noreferrer');
  }, []);

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

  useEffect(() => {
    if (!accountId || !seasonId) {
      setCommunityState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setCommunityState((prev) => ({ ...prev, loading: true, error: null }));

    const channelIds = selectedDiscordChannelId ? [selectedDiscordChannelId] : undefined;
    fetchCommunityMessages({ limit: 5, channelIds })
      .then((items) => {
        if (!cancelled) {
          setCommunityState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('[SocialHub] Community message load failed', error);
          setCommunityState({
            items: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load community discussions.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, fetchCommunityMessages, selectedDiscordChannelId]);

  useEffect(() => {
    if (!accountId || !seasonId) {
      setChannelState({ channels: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setChannelState((prev) => ({ ...prev, loading: true, error: null }));

    fetchCommunityChannels()
      .then((channels) => {
        if (!cancelled) {
          setChannelState({ channels, loading: false, error: null });
          setSelectedChannelId((prev) =>
            prev && !channels.some((channel) => channel.id === prev) ? null : prev,
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setChannelState({
            channels: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load community channels.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, fetchCommunityChannels]);

  const handleOpenDiscord = useCallback(() => {
    const targetUrl =
      selectedChannel?.url ?? channelState.channels.find((channel) => channel.url)?.url;
    if (targetUrl && typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener');
    }
  }, [selectedChannel?.url, channelState.channels]);

  const renderAccountRequiredNotice = (title: string, description: string) => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );

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
      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search all social content..."
            variant="outlined"
            size="small"
            sx={{ flex: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button startIcon={<FilterList />}>Filters</Button>
          <Button startIcon={<Refresh />}>Refresh</Button>
        </Box>
      </Paper>

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

            <WidgetShell
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Forum sx={{ color: 'primary.main' }} /> Community Chats
                </Box>
              }
              accent="primary"
            >
              {!accountId || !seasonId ? (
                <Alert severity="info">
                  Select an account and season to load community messages.
                </Alert>
              ) : (
                <>
                  <Box sx={{ mb: 2 }}>
                    {channelState.error ? (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {channelState.error}
                      </Alert>
                    ) : null}
                    {channelState.channels.length > 0 ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        alignItems="center"
                      >
                        <ToggleButtonGroup
                          exclusive
                          size="small"
                          value={selectedChannelId ?? 'all'}
                          onChange={(
                            event: React.SyntheticEvent<Element, Event>,
                            value: string | null,
                          ) => {
                            event.preventDefault();
                            if (value === null) {
                              return;
                            }
                            const nextId = value === 'all' ? null : value;
                            setSelectedChannelId(nextId);
                          }}
                          sx={{ flexWrap: 'wrap' }}
                        >
                          <ToggleButton value="all">All Channels</ToggleButton>
                          {channelState.channels.map((channel) => (
                            <ToggleButton key={channel.id} value={channel.id} sx={{ gap: 0.5 }}>
                              <Forum fontSize="small" /> {channel.label ?? `#${channel.name}`}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<OpenInNew fontSize="inherit" />}
                          onClick={handleOpenDiscord}
                          disabled={!channelState.channels.some((channel) => channel.url)}
                        >
                          Open Discord
                        </Button>
                        {accountId ? (
                          <Button
                            size="small"
                            variant="text"
                            component={NextLink}
                            href={`/account/${accountId}/social-hub/community`}
                            startIcon={<Forum fontSize="inherit" />}
                          >
                            View all messages
                          </Button>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Box>
                  {communityState.error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {communityState.error}
                    </Alert>
                  ) : null}
                  {communityState.items.length > 0 ? (
                    <CommunityMessageList
                      messages={communityState.items}
                      formatTimestamp={formatRelativeTime}
                      onPermalinkClick={handleOpenMessagePermalink}
                    />
                  ) : (
                    <Alert severity="info">No recent Discord activity yet.</Alert>
                  )}
                </>
              )}
            </WidgetShell>
          </Stack>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: { xs: 1, md: '1 1 0' } }}>
          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <SurveySpotlightWidget
                accountId={accountId}
                canAnswerSurvey={Boolean(isAccountMember)}
              />
            ) : (
              renderAccountRequiredNotice(
                'Player Spotlights',
                'Select an account to highlight recent survey responses.',
              )
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <PlayersWantedPreview
                accountId={accountId}
                isAccountMember={Boolean(isAccountMember)}
                maxDisplay={3}
              />
            ) : (
              renderAccountRequiredNotice(
                'Looking for Players/Teams',
                'Choose an account to browse the latest classifieds.',
              )
            )}
          </Box>

          <Box>
            {accountId ? (
              <HofSpotlightWidget accountId={accountId} hideCta />
            ) : (
              renderAccountRequiredNotice(
                'Hall of Fame',
                'Select an account to celebrate recent inductees.',
              )
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
