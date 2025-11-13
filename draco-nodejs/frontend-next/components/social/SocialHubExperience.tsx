'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  PlayCircleOutline,
  Forum,
  Image as ImageIcon,
  Movie,
  AttachFile,
} from '@mui/icons-material';
import type {
  SocialFeedItemType,
  SocialVideoType,
  CommunityMessagePreviewType,
  CommunityChannelType,
  CommunityMessageAttachmentType,
} from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import HofSpotlightWidget from '@/components/hall-of-fame/HofSpotlightWidget';
import PlayersWantedPreview from '@/components/join-league/PlayersWantedPreview';
import WidgetShell from '../ui/WidgetShell';

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

const AttachmentIcon = ({ type }: { type: CommunityMessageAttachmentType['type'] }) => {
  switch (type) {
    case 'image':
      return <ImageIcon fontSize="small" />;
    case 'video':
      return <Movie fontSize="small" />;
    default:
      return <AttachFile fontSize="small" />;
  }
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
  const { fetchFeed, fetchVideos, fetchCommunityMessages, fetchCommunityChannels } =
    useSocialHubService({
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
  const [channelState, setChannelState] = useState<{
    channels: CommunityChannelType[];
    loading: boolean;
    error: string | null;
  }>({ channels: [], loading: false, error: null });
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const selectedChannel = channelState.channels.find((channel) => channel.id === selectedChannelId);
  const selectedDiscordChannelId = selectedChannel?.discordChannelId;

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
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      Discord channels will appear here once an admin connects them to the Social
                      Hub.
                    </Alert>
                  )}
                </Box>
                {communityState.error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {communityState.error}
                  </Alert>
                ) : null}
                {communityState.items.length > 0 ? (
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
                              <Typography component="div" variant="body2">
                                <Box
                                  component="div"
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Typography variant="subtitle2" component="span">
                                    {message.authorDisplayName}
                                  </Typography>
                                  <Chip
                                    label={`#${message.channelName}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    component="span"
                                  >
                                    {formatRelativeTime(message.postedAt)}
                                  </Typography>
                                  {message.permalink ? (
                                    <Button
                                      size="small"
                                      startIcon={<OpenInNew fontSize="inherit" />}
                                      component="a"
                                      href={message.permalink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Reply in Discord
                                    </Button>
                                  ) : null}
                                </Box>
                              </Typography>
                            }
                            secondary={
                              <Stack spacing={1} sx={{ mt: 1 }} component="div">
                                <Typography variant="body2" color="text.primary" component="div">
                                  {message.content}
                                </Typography>
                                {message.attachments && message.attachments.length > 0 ? (
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    useFlexGap
                                    flexWrap="wrap"
                                    component="div"
                                  >
                                    {message.attachments.map((attachment) => (
                                      <Chip
                                        key={`${message.id}-${attachment.url}`}
                                        icon={<AttachmentIcon type={attachment.type} />}
                                        label={attachment.type}
                                        component="a"
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        clickable
                                        variant="outlined"
                                      />
                                    ))}
                                  </Stack>
                                ) : null}
                              </Stack>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No recent Discord activity yet.</Alert>
                )}
              </>
            )}
          </WidgetShell>
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
