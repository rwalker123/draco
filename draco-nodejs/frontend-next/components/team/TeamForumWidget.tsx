'use client';

import React from 'react';
import WidgetShell from '../ui/WidgetShell';
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { CommunityChannelType, CommunityMessagePreviewType } from '@draco/shared-schemas';
import { useSocialHubService } from '@/hooks/useSocialHubService';

interface TeamForumWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  teamName?: string | null;
  isTeamMember: boolean;
  membershipLoading?: boolean;
}

const MessagePreview: React.FC<{
  message: CommunityMessagePreviewType;
  onOpen?: (permalink?: string) => void;
}> = ({ message, onOpen }) => {
  const postedAt = React.useMemo(() => {
    try {
      return new Date(message.postedAt).toLocaleString();
    } catch {
      return message.postedAt;
    }
  }, [message.postedAt]);

  const canOpen = Boolean(onOpen && message.permalink);

  return (
    <ButtonBase
      onClick={() => {
        if (canOpen) {
          onOpen?.(message.permalink ?? undefined);
        }
      }}
      sx={{
        textAlign: 'left',
        width: '100%',
        borderRadius: 1,
        p: 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        opacity: canOpen ? 1 : 0.6,
        cursor: canOpen ? 'pointer' : 'default',
        '&:hover': canOpen ? { backgroundColor: 'action.hover' } : undefined,
      }}
    >
      <Avatar
        src={message.avatarUrl ?? undefined}
        alt={message.authorDisplayName}
        sx={{ width: 36, height: 36, mt: 0.5 }}
      >
        {message.authorDisplayName?.charAt(0) ?? '?'}
      </Avatar>
      <Box flex={1}>
        <Typography variant="subtitle2">{message.authorDisplayName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {postedAt}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {message.content}
        </Typography>
      </Box>
    </ButtonBase>
  );
};

const TeamForumWidget: React.FC<TeamForumWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  teamName,
  isTeamMember,
  membershipLoading,
}) => {
  const { fetchCommunityChannels, fetchCommunityMessages } = useSocialHubService({
    accountId,
    seasonId,
  });
  const [channel, setChannel] = React.useState<CommunityChannelType | null>(null);
  const [messages, setMessages] = React.useState<CommunityMessagePreviewType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!teamSeasonId) {
      setChannel(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [channels] = await Promise.all([fetchCommunityChannels({ teamSeasonId })]);
      const forumChannel = channels[0] ?? null;
      setChannel(forumChannel ?? null);

      if (!forumChannel) {
        setMessages([]);
        return;
      }

      const fetchedMessages = await fetchCommunityMessages({
        teamSeasonId,
        limit: 5,
      });
      setMessages(fetchedMessages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load team forum.';
      setError(message);
      setChannel(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [fetchCommunityChannels, fetchCommunityMessages, teamSeasonId]);

  React.useEffect(() => {
    if (membershipLoading) {
      return;
    }
    void loadData();
  }, [membershipLoading, loadData]);

  const handleOpenDiscord = React.useCallback(() => {
    if (!channel?.url) {
      return;
    }
    window.open(channel.url, '_blank', 'noopener,noreferrer');
  }, [channel?.url]);

  const handleOpenMessage = React.useCallback((permalink?: string) => {
    if (!permalink) {
      return;
    }
    window.open(permalink, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <WidgetShell
      title={
        <Stack direction="row" spacing={1} alignItems="center">
          <ForumIcon fontSize="small" color="primary" />{' '}
          <Typography component="span" variant="h6">
            Team Forum
          </Typography>
        </Stack>
      }
      subtitle={
        channel
          ? `Latest updates from the ${teamName ?? 'team'} Discord forum`
          : 'Enable Discord team forums in account settings to surface conversations here.'
      }
      accent="info"
    >
      {loading || membershipLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !channel ? (
        <Alert severity="info">
          No Discord forum is active for this team yet. Ask your administrator to enable Discord
          team forums in Account Settings.
        </Alert>
      ) : (
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle1">{channel.label ?? channel.name}</Typography>
            </Box>
            {channel.url ? (
              <Button
                variant="outlined"
                endIcon={<OpenInNewIcon fontSize="small" />}
                onClick={handleOpenDiscord}
                disabled={!isTeamMember}
              >
                Open in Discord
              </Button>
            ) : null}
          </Stack>

          {messages.length === 0 ? (
            <Alert severity="info">No recent messages yet.</Alert>
          ) : (
            <Stack spacing={2}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                >
                  <MessagePreview message={message} onOpen={handleOpenMessage} />
                </Box>
              ))}
            </Stack>
          )}
          {!isTeamMember ? (
            <Alert severity="info">
              You need team access to participate in Discord discussions. Contact your coach or
              admin if you should be added.
            </Alert>
          ) : null}
        </Stack>
      )}
    </WidgetShell>
  );
};

export default TeamForumWidget;
