'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { Forum } from '@mui/icons-material';
import CommunityMessageList from '@/components/social/CommunityMessageList';
import AccountPageHeader from '@/components/AccountPageHeader';
import AdPlacement from '@/components/ads/AdPlacement';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import type { CommunityChannelType, CommunityMessagePreviewType } from '@draco/shared-schemas';

const PAGE_SIZE = 50;
const CHANNEL_FILTER_ALL = 'all';

const AccountCommunityMessagesPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const {
    currentSeasonId,
    loading: seasonLoading,
    error: seasonError,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId || '');

  const { fetchCommunityMessages, fetchCommunityChannels } = useSocialHubService({
    accountId,
    seasonId: currentSeasonId ?? undefined,
  });

  const [channels, setChannels] = React.useState<CommunityChannelType[]>([]);
  const [channelLoading, setChannelLoading] = React.useState(false);
  const [selectedChannelId, setSelectedChannelId] = React.useState<string>(CHANNEL_FILTER_ALL);
  const [messages, setMessages] = React.useState<CommunityMessagePreviewType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    setChannelLoading(true);

    const loadChannels = async () => {
      try {
        const channelList = await fetchCommunityChannels(undefined, controller.signal);
        if (controller.signal.aborted) return;
        setChannels(channelList);
        setSelectedChannelId((previous) => {
          if (previous === CHANNEL_FILTER_ALL) {
            return previous;
          }
          return channelList.some((channel) => channel.id === previous)
            ? previous
            : CHANNEL_FILTER_ALL;
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('[CommunityMessages] Failed to load channels', err);
        setChannels([]);
        setSelectedChannelId(CHANNEL_FILTER_ALL);
      } finally {
        if (!controller.signal.aborted) setChannelLoading(false);
      }
    };

    void loadChannels();
    return () => {
      controller.abort();
    };
  }, [accountId, currentSeasonId, fetchCommunityChannels]);

  React.useEffect(() => {
    if (!accountId || !currentSeasonId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const loadMessages = async () => {
      try {
        const query: Partial<Parameters<typeof fetchCommunityMessages>[0]> = {
          limit: PAGE_SIZE,
        };

        const currentChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
        if (currentChannel?.discordChannelId) {
          query.channelIds = [currentChannel.discordChannelId];
        }
        if (currentChannel?.scope === 'teamSeason' && currentChannel.teamSeasonId) {
          query.teamSeasonId = currentChannel.teamSeasonId;
        }

        const result = await fetchCommunityMessages(query, controller.signal);
        if (controller.signal.aborted) return;
        setMessages(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Unable to load community messages.';
        setError(message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadMessages();
    return () => {
      controller.abort();
    };
  }, [accountId, currentSeasonId, selectedChannelId, channels, fetchCommunityMessages]);

  const handleOpenMessage = (permalink?: string) => {
    if (!permalink) {
      return;
    }
    window.open(permalink, '_blank', 'noopener,noreferrer');
  };

  if (!accountId) {
    return null;
  }

  const renderContent = () => {
    if (seasonLoading || loading || channelLoading) {
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

    if (!messages.length) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          No community conversations have been ingested yet. Connect Discord channels to begin
          surfacing discussions.
        </Alert>
      );
    }

    return <CommunityMessageList messages={messages} onPermalinkClick={handleOpenMessage} />;
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Community Messages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review every Discord conversation we&apos;ve ingested for this season, filtered by
            channel.
          </Typography>
        </Box>
      </AccountPageHeader>

      <AdPlacement />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              component={NextLink}
              underline="hover"
              color="inherit"
              href={`/account/${accountId}/social-hub`}
            >
              Social Hub
            </Link>
            <Typography color="text.primary">Community Messages</Typography>
          </Breadcrumbs>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="channel-filter-label">Filter by channel</InputLabel>
            <Select
              labelId="channel-filter-label"
              id="channel-filter-select"
              value={selectedChannelId}
              label="Filter by channel"
              onChange={(event) => setSelectedChannelId(event.target.value)}
            >
              <MenuItem value={CHANNEL_FILTER_ALL}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Forum fontSize="small" />
                  <span>All channels</span>
                </Stack>
              </MenuItem>
              {channels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  {channel.label ?? `#${channel.name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {renderContent()}
      </Container>
    </main>
  );
};

export default AccountCommunityMessagesPage;
