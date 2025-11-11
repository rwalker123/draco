'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  IconButton,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
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
  PlayCircleOutline,
  Forum,
} from '@mui/icons-material';
import type {
  SocialFeedItemType,
  SocialVideoType,
  CommunityMessagePreviewType,
} from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import HofSpotlightWidget from '@/components/hall-of-fame/HofSpotlightWidget';
import PlayersWantedPreview from '@/components/join-league/PlayersWantedPreview';

const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
};

const formatDuration = (seconds?: number | null): string | null => {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    return `${hours}h ${minutesPart}m`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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

const SocialVideoCard = ({ video }: { video: SocialVideoType }) => {
  const publishedLabel = formatRelativeTime(video.publishedAt);
  const durationLabel = video.isLive ? 'LIVE' : formatDuration(video.durationSeconds);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="160"
          image={video.thumbnailUrl}
          alt={video.title}
          sx={{ borderRadius: 1 }}
        />
        {durationLabel && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: video.isLive ? 'error.main' : 'rgba(0,0,0,0.75)',
              color: 'white',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            <Typography variant="caption">{durationLabel}</Typography>
          </Box>
        )}
        <PlayCircleOutline
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 48,
            color: 'white',
            opacity: 0.85,
          }}
        />
      </Box>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">{video.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {video.description ?? 'Watch the latest highlight.'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {publishedLabel}
        </Typography>
        <Button
          variant="contained"
          size="small"
          component="a"
          href={video.videoUrl}
          target="_blank"
          rel="noreferrer"
        >
          Watch
        </Button>
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
  const { fetchFeed, fetchVideos, fetchCommunityMessages } = useSocialHubService({
    accountId,
    seasonId,
  });
  const [feedState, setFeedState] = useState<{
    items: SocialFeedItemType[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: false, error: null });
  const [videoState, setVideoState] = useState<{
    items: SocialVideoType[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: false, error: null });
  const [communityState, setCommunityState] = useState<{
    items: CommunityMessagePreviewType[];
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

  useEffect(() => {
    if (!accountId || !seasonId) {
      setVideoState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setVideoState((prev) => ({ ...prev, loading: true, error: null }));

    fetchVideos({ limit: 4 })
      .then((items) => {
        if (!cancelled) {
          setVideoState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setVideoState({
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

  useEffect(() => {
    if (!accountId || !seasonId) {
      setCommunityState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setCommunityState((prev) => ({ ...prev, loading: true, error: null }));

    fetchCommunityMessages({ limit: 5 })
      .then((items) => {
        if (!cancelled) {
          setCommunityState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
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
  }, [accountId, seasonId, fetchCommunityMessages]);

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
  const displayedVideos = videoState.items.slice(0, 2);

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

  // Grid Layout
  const GridLayout = () => (
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
                    <Box key={post.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
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

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <YouTube sx={{ mr: 1, color: '#FF0000' }} /> Featured Videos
          </Typography>
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
                renderCardSkeletons(2)
              ) : displayedVideos.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {displayedVideos.map((video) => (
                    <Box
                      key={video.id}
                      sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}
                    >
                      <SocialVideoCard video={video} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No connected video streams yet.</Alert>
              )}
            </>
          )}
        </Paper>

        {/* Message Board */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Forum sx={{ mr: 1 }} /> Community Chats
          </Typography>
          {!accountId || !seasonId ? (
            <Alert severity="info">Select an account and season to load community messages.</Alert>
          ) : (
            <>
              {communityState.error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {communityState.error}
                </Alert>
              ) : null}
              {communityState.loading && communityState.items.length === 0 ? (
                <Stack spacing={2}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={`community-skeleton-${index}`} variant="rounded" height={80} />
                  ))}
                </Stack>
              ) : communityState.items.length > 0 ? (
                <List>
                  {communityState.items.map((message, index) => (
                    <React.Fragment key={message.id}>
                      {index > 0 && <Divider />}
                      <ListItem alignItems="flex-start" disableGutters>
                        <ListItemAvatar>
                          <Avatar src={message.avatarUrl ?? undefined}>
                            {(message.authorDisplayName ?? 'C').charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {message.authorDisplayName}
                              </Typography>
                              <Chip
                                label={`#${message.channelName}`}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatRelativeTime(message.postedAt)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {message.content}
                            </Typography>
                          }
                        />
                        {message.permalink ? (
                          <IconButton
                            size="small"
                            component="a"
                            href={message.permalink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        ) : null}
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">No recent Discord activity yet.</Alert>
              )}
            </>
          )}
        </Paper>
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
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Social Hub Concept{accountId ? ` · Account ${accountId}` : ''}
      </Typography>

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

      <GridLayout />
    </Container>
  );
}
