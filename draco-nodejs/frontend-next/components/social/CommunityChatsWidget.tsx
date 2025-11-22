import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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

type CommunityState = {
  items: CommunityMessagePreviewType[];
  loading: boolean;
  error: string | null;
};

type ChannelState = {
  channels: CommunityChannelType[];
  loading: boolean;
  error: string | null;
};

const createStore = <T,>(initial: T) => {
  let snapshot = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => snapshot,
    setSnapshot: (next: T | ((prev: T) => T)) => {
      snapshot = typeof next === 'function' ? (next as (prev: T) => T)(snapshot) : next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

const CommunityChatsWidget: React.FC<CommunityChatsWidgetProps> = ({
  accountId,
  seasonId,
  maxMessages = DEFAULT_MESSAGE_LIMIT,
}) => {
  const { fetchCommunityMessages, fetchCommunityChannels } = useSocialHubService({
    accountId,
    seasonId,
  });
  const [communityStore] = useState(() =>
    createStore<CommunityState>({ items: [], loading: false, error: null }),
  );
  const communityState = useSyncExternalStore(
    communityStore.subscribe,
    communityStore.getSnapshot,
    communityStore.getSnapshot,
  );
  const [channelStore] = useState(() =>
    createStore<ChannelState>({ channels: [], loading: false, error: null }),
  );
  const channelState = useSyncExternalStore(
    channelStore.subscribe,
    channelStore.getSnapshot,
    channelStore.getSnapshot,
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const effectiveChannelId = useMemo(() => {
    if (!selectedChannelId) {
      return null;
    }

    return channelState.channels.some((channel) => channel.id === selectedChannelId)
      ? selectedChannelId
      : null;
  }, [channelState.channels, selectedChannelId]);

  const selectedChannel = useMemo(
    () => channelState.channels.find((channel) => channel.id === effectiveChannelId),
    [channelState.channels, effectiveChannelId],
  );
  const selectedDiscordChannelId = selectedChannel?.discordChannelId;
  const contextMissing = !accountId || !seasonId;
  const hasContent =
    channelState.channels.length > 0 || communityState.items.length > 0 || channelState.loading;
  const loadsComplete =
    !channelState.loading &&
    !communityState.loading &&
    !channelState.error &&
    !communityState.error;

  const loadCommunityMessages = useCallback(
    async (signal: { cancelled: boolean }) => {
      if (contextMissing) {
        communityStore.setSnapshot({ items: [], loading: false, error: null });
        return;
      }

      communityStore.setSnapshot((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const channelIds = selectedDiscordChannelId ? [selectedDiscordChannelId] : undefined;
        const items = await fetchCommunityMessages({ limit: maxMessages, channelIds });
        if (!signal.cancelled) {
          communityStore.setSnapshot({ items, loading: false, error: null });
        }
      } catch (error) {
        if (!signal.cancelled) {
          console.error('[CommunityChatsWidget] message load failed', error);
          communityStore.setSnapshot({
            items: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load community discussions.',
          });
        }
      }
    },
    [communityStore, contextMissing, fetchCommunityMessages, maxMessages, selectedDiscordChannelId],
  );

  const loadCommunityChannels = useCallback(
    async (signal: { cancelled: boolean }) => {
      if (contextMissing) {
        channelStore.setSnapshot({ channels: [], loading: false, error: null });
        return;
      }

      channelStore.setSnapshot((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const channels = await fetchCommunityChannels();
        if (signal.cancelled) {
          return;
        }
        channelStore.setSnapshot({ channels, loading: false, error: null });
      } catch (error) {
        if (!signal.cancelled) {
          console.error('[CommunityChatsWidget] channel load failed', error);
          channelStore.setSnapshot({
            channels: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load community channels.',
          });
        }
      }
    },
    [channelStore, contextMissing, fetchCommunityChannels],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void loadCommunityMessages(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadCommunityMessages]);

  useEffect(() => {
    const signal = { cancelled: false };
    void loadCommunityChannels(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadCommunityChannels]);

  const handleOpenDiscord = useCallback(() => {
    const targetUrl =
      selectedChannel?.url ?? channelState.channels.find((channel) => channel.url)?.url;
    if (targetUrl && typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener');
    }
  }, [channelState.channels, selectedChannel?.url]);

  const shouldHide = !contextMissing && loadsComplete && !hasContent;
  if (shouldHide) {
    return null;
  }

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
            {contextMissing ? null : channelState.channels.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={effectiveChannelId ?? 'all'}
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
          {contextMissing ? null : communityState.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {communityState.error}
            </Alert>
          ) : null}
          {contextMissing ? null : communityState.items.length > 0 ? (
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
          ) : contextMissing ? null : (
            <Alert severity="info">No recent Discord activity yet.</Alert>
          )}
        </>
      )}
    </WidgetShell>
  );
};

export default CommunityChatsWidget;
