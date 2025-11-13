'use client';

import React from 'react';
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import type {
  DiscordFeatureSyncStatusType,
  DiscordGuildChannelType,
  DiscordFeatureSyncChannelType,
} from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { useDiscordFeatureSync } from '@/hooks/useDiscordFeatureSync';
import { useAccountDiscordAdmin } from '@/hooks/useAccountDiscordAdmin';
import DiscordFeatureChannelDialog from '@/components/discord/DiscordFeatureChannelDialog';

const FEATURE: DiscordFeatureSyncStatusType['feature'] = 'announcements';

interface AnnouncementsDiscordSyncCardProps {
  accountId: string;
}

const AnnouncementsDiscordSyncCard: React.FC<AnnouncementsDiscordSyncCardProps> = ({
  accountId,
}) => {
  const { fetchStatus, updateStatus } = useDiscordFeatureSync();
  const { fetchAvailableChannels } = useAccountDiscordAdmin();
  const [status, setStatus] = React.useState<DiscordFeatureSyncStatusType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [channels, setChannels] = React.useState<DiscordGuildChannelType[]>([]);
  const [channelsLoading, setChannelsLoading] = React.useState(false);
  const [channelError, setChannelError] = React.useState<string | null>(null);
  const [dialogSubmitting, setDialogSubmitting] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStatus(accountId, FEATURE);
      setStatus(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load Discord sync status.';
      setError(message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, fetchStatus]);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }
    void loadStatus();
  }, [accountId, loadStatus]);

  const openChannelDialog = React.useCallback(async () => {
    setDialogOpen(true);
    setChannelError(null);
    setChannelsLoading(true);
    try {
      const available = await fetchAvailableChannels(accountId);
      setChannels(available ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load Discord channels for selection.';
      setChannelError(message);
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  }, [accountId, fetchAvailableChannels]);

  const closeChannelDialog = React.useCallback(() => {
    if (dialogSubmitting) {
      return;
    }
    setDialogOpen(false);
    setChannelError(null);
  }, [dialogSubmitting]);

  const handleDisableSync = async () => {
    if (!status) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const next = await updateStatus(accountId, FEATURE, { enabled: false });
      setStatus(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to disable Discord sync.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChannelDialogSubmit = React.useCallback(
    async (channel: DiscordFeatureSyncChannelType) => {
      if (!status) {
        return;
      }
      setDialogSubmitting(true);
      setChannelError(null);
      try {
        const next = await updateStatus(accountId, FEATURE, { enabled: true, channel });
        setStatus(next);
        setDialogOpen(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to enable Discord sync.';
        setChannelError(message);
      } finally {
        setDialogSubmitting(false);
      }
    },
    [accountId, status, updateStatus],
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!status) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Discord sync status unavailable.
        </Alert>
      );
    }

    if (!status.guildConfigured) {
      return (
        <Alert severity="warning">
          Install the Draco Discord bot and configure your guild ID in Account Settings to enable
          announcement sync.
        </Alert>
      );
    }

    if (!status.enabled) {
      return (
        <Stack spacing={2}>
          <Alert severity="info">
            Automatically post new announcements to Discord so teams stay informed without leaving
            the server.
          </Alert>
          <Button variant="contained" onClick={openChannelDialog} disabled={saving}>
            Configure Discord Channel
          </Button>
        </Stack>
      );
    }

    const channelLabel = status.channel
      ? `${status.channel.discordChannelName} (#${status.channel.discordChannelId})`
      : 'Unknown channel';

    return (
      <Stack spacing={2}>
        <Alert severity="success">
          Announcements are syncing to <strong>{channelLabel}</strong>
          {status.channel?.channelType ? ` (${status.channel.channelType})` : ''}.
        </Alert>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={openChannelDialog} disabled={saving}>
            Change Channel
          </Button>
          <Button variant="outlined" color="error" onClick={handleDisableSync} disabled={saving}>
            Disable Sync
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <>
      <WidgetShell
        title="Discord Announcements Sync"
        subtitle="Keep Discord channels updated when you publish announcements."
        accent="info"
      >
        {renderContent()}
      </WidgetShell>

      <DiscordFeatureChannelDialog
        open={dialogOpen}
        loading={channelsLoading}
        submitting={dialogSubmitting}
        error={channelError}
        channels={channels}
        onClose={closeChannelDialog}
        onSubmit={handleChannelDialogSubmit}
      />
    </>
  );
};

export default AnnouncementsDiscordSyncCard;
