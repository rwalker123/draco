import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Forum, OpenInNew } from '@mui/icons-material';
import NextLink from 'next/link';
import type { CommunityChannelType, CommunityMessagePreviewType } from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';
import WidgetShell from '../ui/WidgetShell';
import CommunityMessageList from './CommunityMessageList';
import { formatRelativeTime } from './utils';

interface CommunityChatsWidgetProps {
  accountId?: string;
  seasonId?: string;
  maxMessages?: number;
}

const DEFAULT_MESSAGE_LIMIT = 5;

const CommunityChatsWidget: React.FC<CommunityChatsWidgetProps> = ({
  accountId,
  seasonId,
  maxMessages = DEFAULT_MESSAGE_LIMIT,
}) => {
  const { fetchCommunityMessages, fetchCommunityChannels } = useSocialHubService({
    accountId,
    seasonId,
  });
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

  const selectedChannel = useMemo(
    () => channelState.channels.find((channel) => channel.id === selectedChannelId),
    [channelState.channels, selectedChannelId],
  );
  const selectedDiscordChannelId = selectedChannel?.discordChannelId;
  const contextMissing = !accountId || !seasonId;

  useEffect(() => {
    if (contextMissing) {
      setCommunityState({ items: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setCommunityState((prev) => ({ ...prev, loading: true, error: null }));

    const channelIds = selectedDiscordChannelId ? [selectedDiscordChannelId] : undefined;
    fetchCommunityMessages({ limit: maxMessages, channelIds })
      .then((items) => {
        if (!cancelled) {
          setCommunityState({ items, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('[CommunityChatsWidget] message load failed', error);
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
  }, [contextMissing, fetchCommunityMessages, maxMessages, selectedDiscordChannelId]);

  useEffect(() => {
    if (contextMissing) {
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
          console.error('[CommunityChatsWidget] channel load failed', error);
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
  }, [contextMissing, fetchCommunityChannels]);

  const handleOpenDiscord = useCallback(() => {
    const targetUrl =
      selectedChannel?.url ?? channelState.channels.find((channel) => channel.url)?.url;
    if (targetUrl && typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener');
    }
  }, [channelState.channels, selectedChannel?.url]);

  return (
    <WidgetShell
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Forum sx={{ color: 'primary.main' }} /> Community Chats
        </Box>
      }
      accent="primary"
      subtitle="Latest highlights from your Discord server."
    >
      {!accountId || !seasonId ? (
        <Alert severity="info">Select an account and season to view community discussions.</Alert>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            {channelState.loading ? (
              <Stack direction="row" spacing={1}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Button key={`channel-skeleton-${index}`} size="small" disabled>
                    Loading...
                  </Button>
                ))}
              </Stack>
            ) : null}
            {channelState.error ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {channelState.error}
              </Alert>
            ) : null}
            {channelState.channels.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={selectedChannelId ?? 'all'}
                  onChange={(event: React.SyntheticEvent<Element, Event>, value: string | null) => {
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
              onPermalinkClick={(permalink?: string) => {
                if (!permalink) {
                  return;
                }
                window.open(permalink, '_blank', 'noopener,noreferrer');
              }}
            />
          ) : (
            <Alert severity="info">No recent Discord activity yet.</Alert>
          )}
        </>
      )}
    </WidgetShell>
  );
};

export default CommunityChatsWidget;
