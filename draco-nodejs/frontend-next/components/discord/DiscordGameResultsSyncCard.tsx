'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import type {
  DiscordFeatureSyncStatusType,
  DiscordGuildChannelType,
  DiscordFeatureSyncChannelType,
} from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { useDiscordFeatureSync } from '@/hooks/useDiscordFeatureSync';
import { useAccountDiscordAdmin } from '@/hooks/useAccountDiscordAdmin';
import DiscordFeatureChannelDialog from './DiscordFeatureChannelDialog';

const FEATURE: DiscordFeatureSyncStatusType['feature'] = 'gameResults';

interface DiscordGameResultsSyncCardProps {
  accountId: string;
  refreshKey?: number;
  postGameResultsEnabled?: boolean;
  postGameResultsUpdating?: boolean;
  onTogglePostGameResults?: (enabled: boolean) => Promise<void>;
  postWorkoutsEnabled?: boolean;
  postWorkoutsUpdating?: boolean;
  onTogglePostWorkouts?: (enabled: boolean) => Promise<void>;
}

const DiscordGameResultsSyncCard: React.FC<DiscordGameResultsSyncCardProps> = ({
  accountId,
  refreshKey,
  postGameResultsEnabled = false,
  postGameResultsUpdating = false,
  onTogglePostGameResults,
  postWorkoutsEnabled = false,
  postWorkoutsUpdating = false,
  onTogglePostWorkouts,
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
  const [settingSaving, setSettingSaving] = React.useState(false);
  const [postResultsEnabled, setPostResultsEnabled] = React.useState<boolean>(
    Boolean(postGameResultsEnabled),
  );
  const [postWorkoutsEnabledState, setPostWorkoutsEnabledState] = React.useState<boolean>(
    Boolean(postWorkoutsEnabled),
  );

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
  }, [accountId, loadStatus, refreshKey]);

  React.useEffect(() => {
    setPostResultsEnabled(Boolean(postGameResultsEnabled));
  }, [postGameResultsEnabled]);

  React.useEffect(() => {
    setPostWorkoutsEnabledState(Boolean(postWorkoutsEnabled));
  }, [postWorkoutsEnabled]);

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
    if (!postResultsEnabled && !postWorkoutsEnabledState) {
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

  const handlePostResultsToggle = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!onTogglePostGameResults) {
      return;
    }

    const nextValue = event.target.checked;
    const previousValue = postResultsEnabled;

    setSettingSaving(true);
    setError(null);

    try {
      await onTogglePostGameResults(nextValue);
      setPostResultsEnabled(nextValue);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update Discord settings.';
      setError(message);
      setPostResultsEnabled(previousValue);
    } finally {
      setSettingSaving(false);
    }
  };

  const handlePostWorkoutsToggle = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!onTogglePostWorkouts) {
      return;
    }

    const nextValue = event.target.checked;
    const previousValue = postWorkoutsEnabledState;

    setSettingSaving(true);
    setError(null);

    try {
      await onTogglePostWorkouts(nextValue);
      setPostWorkoutsEnabledState(nextValue);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update Discord settings.';
      setError(message);
      setPostWorkoutsEnabledState(previousValue);
    } finally {
      setSettingSaving(false);
    }
  };

  const postingEnabled = postResultsEnabled || postWorkoutsEnabledState;

  const postingLabel = [
    postResultsEnabled ? 'game results' : null,
    postWorkoutsEnabledState ? 'workouts' : null,
  ]
    .filter(Boolean)
    .join(' and ');

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

    if (!postingEnabled) {
      return (
        <Stack spacing={2}>
          <Alert severity="info">
            Posting to Discord is turned off for this account. Enable posting for game results or
            workouts to configure channels for automated updates.
          </Alert>
        </Stack>
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
          Install the Draco Discord bot and configure your guild ID to enable Discord integration.
        </Alert>
      );
    }

    if (!status.enabled) {
      return (
        <Stack spacing={2} alignItems="flex-start">
          <Alert severity="info">
            Post game results and workouts to Discord with a dedicated channel and mirror updates
            into each team&apos;s channel.
          </Alert>
          <Button
            variant="contained"
            onClick={openChannelDialog}
            disabled={
              saving || settingSaving || postGameResultsUpdating || postWorkoutsUpdating
            }
          >
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
          {(postingLabel || 'Updates')} will be posted to <strong>{channelLabel}</strong>
          {status.channel?.channelType ? ` (${status.channel.channelType})` : ''} and mirrored into
          team channels.
        </Alert>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            onClick={openChannelDialog}
            disabled={
              saving || settingSaving || postGameResultsUpdating || postWorkoutsUpdating
            }
          >
            Change Channel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisableSync}
            disabled={
              saving || settingSaving || postGameResultsUpdating || postWorkoutsUpdating
            }
          >
            Disable Posting
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <>
      <WidgetShell
        title="Post Game Results & Workouts to Discord"
        subtitle="Share final scores and workout announcements automatically with your Discord community."
        accent="info"
      >
        <Stack spacing={2} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={postResultsEnabled}
                onChange={handlePostResultsToggle}
                disabled={
                  settingSaving ||
                  postGameResultsUpdating ||
                  postWorkoutsUpdating ||
                  !onTogglePostGameResults
                }
              />
            }
            label="Post game results to Discord"
          />
          <FormControlLabel
            control={
              <Switch
                checked={postWorkoutsEnabledState}
                onChange={handlePostWorkoutsToggle}
                disabled={
                  settingSaving ||
                  postGameResultsUpdating ||
                  postWorkoutsUpdating ||
                  !onTogglePostWorkouts
                }
              />
            }
            label="Post workouts to Discord"
          />
        </Stack>
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

export default DiscordGameResultsSyncCard;
