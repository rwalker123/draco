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

const GAME_RESULTS_FEATURE: DiscordFeatureSyncStatusType['feature'] = 'gameResults';
const ANNOUNCEMENTS_FEATURE: DiscordFeatureSyncStatusType['feature'] = 'announcements';
const WORKOUTS_FEATURE: DiscordFeatureSyncStatusType['feature'] = 'workouts';

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
  const [announcementStatus, setAnnouncementStatus] =
    React.useState<DiscordFeatureSyncStatusType | null>(null);
  const [workoutStatus, setWorkoutStatus] = React.useState<DiscordFeatureSyncStatusType | null>(
    null,
  );
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
  const [postAnnouncementsEnabled, setPostAnnouncementsEnabled] = React.useState<boolean>(false);

  const loadStatus = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resultsStatus, announcementSync, workoutsSync] = await Promise.all([
        fetchStatus(accountId, GAME_RESULTS_FEATURE),
        fetchStatus(accountId, ANNOUNCEMENTS_FEATURE),
        fetchStatus(accountId, WORKOUTS_FEATURE),
      ]);
      setStatus(resultsStatus);
      setAnnouncementStatus(announcementSync);
      setWorkoutStatus(workoutsSync);
      setPostAnnouncementsEnabled(Boolean(announcementSync?.enabled));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load Discord sync status.';
      setError(message);
      setStatus(null);
      setAnnouncementStatus(null);
      setWorkoutStatus(null);
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

  React.useEffect(() => {
    setPostAnnouncementsEnabled(Boolean(announcementStatus?.enabled));
  }, [announcementStatus]);

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
    if (!status && !announcementStatus && !workoutStatus) {
      return;
    }
    if (!postResultsEnabled && !postWorkoutsEnabledState && !postAnnouncementsEnabled) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const [nextResults, nextAnnouncements, nextWorkouts] = await Promise.all([
        status ? updateStatus(accountId, GAME_RESULTS_FEATURE, { enabled: false }) : status,
        announcementStatus
          ? updateStatus(accountId, ANNOUNCEMENTS_FEATURE, { enabled: false })
          : announcementStatus,
        workoutStatus
          ? updateStatus(accountId, WORKOUTS_FEATURE, { enabled: false })
          : workoutStatus,
      ]);
      setStatus(nextResults ?? null);
      setAnnouncementStatus(nextAnnouncements ?? null);
      setWorkoutStatus(nextWorkouts ?? null);
      setPostAnnouncementsEnabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to disable Discord sync.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChannelDialogSubmit = React.useCallback(
    async (channel: DiscordFeatureSyncChannelType) => {
      setDialogSubmitting(true);
      setChannelError(null);
      try {
        const [nextResults, nextAnnouncements, nextWorkouts] = await Promise.all([
          updateStatus(accountId, GAME_RESULTS_FEATURE, { enabled: true, channel }),
          updateStatus(accountId, ANNOUNCEMENTS_FEATURE, { enabled: true, channel }),
          updateStatus(accountId, WORKOUTS_FEATURE, { enabled: true, channel }),
        ]);
        setStatus(nextResults);
        setAnnouncementStatus(nextAnnouncements);
        setWorkoutStatus(nextWorkouts);
        setDialogOpen(false);
        setPostAnnouncementsEnabled(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to enable Discord sync.';
        setChannelError(message);
      } finally {
        setDialogSubmitting(false);
      }
    },
    [accountId, updateStatus],
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

  const postingEnabled = postResultsEnabled || postWorkoutsEnabledState || postAnnouncementsEnabled;
  const effectiveChannel =
    status?.channel || announcementStatus?.channel || workoutStatus?.channel || null;

  const normalizeExistingChannel = React.useCallback(():
    | DiscordFeatureSyncChannelType
    | undefined => {
    if (!effectiveChannel) {
      return undefined;
    }
    return {
      mode: 'existing',
      discordChannelId: effectiveChannel.discordChannelId,
      discordChannelName: effectiveChannel.discordChannelName,
      channelType: effectiveChannel.channelType ?? undefined,
    };
  }, [effectiveChannel]);

  const postingLabel = [
    postResultsEnabled ? 'game results' : null,
    postWorkoutsEnabledState ? 'workouts' : null,
    postAnnouncementsEnabled ? 'announcements' : null,
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

    if (!status && !announcementStatus) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Discord sync status unavailable.
        </Alert>
      );
    }

    if (!status?.guildConfigured && !announcementStatus?.guildConfigured) {
      return (
        <Alert severity="warning">
          Install the Draco Discord bot and configure your guild ID to enable Discord integration.
        </Alert>
      );
    }

    if (!status?.enabled && !announcementStatus?.enabled && !workoutStatus?.enabled) {
      return (
        <Stack spacing={2} alignItems="flex-start">
          <Alert severity="info">
            Post game results, announcements, and workouts to Discord with a dedicated channel and
            mirror updates into each team&apos;s channel.
          </Alert>
          <Button
            variant="contained"
            onClick={openChannelDialog}
            disabled={saving || settingSaving || postGameResultsUpdating || postWorkoutsUpdating}
          >
            Configure Discord Channel
          </Button>
        </Stack>
      );
    }

    const effectiveChannel =
      status?.channel || announcementStatus?.channel || workoutStatus?.channel;
    const channelLabel = effectiveChannel
      ? `${effectiveChannel.discordChannelName} (#${effectiveChannel.discordChannelId})`
      : 'Unknown channel';

    return (
      <Stack spacing={2}>
        <Alert severity="success">
          {postingLabel || 'Updates'} will be posted to <strong>{channelLabel}</strong>
          {effectiveChannel?.channelType ? ` (${effectiveChannel.channelType})` : ''} and mirrored
          into team channels.
        </Alert>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            onClick={openChannelDialog}
            disabled={saving || settingSaving || postGameResultsUpdating || postWorkoutsUpdating}
          >
            Change Channel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisableSync}
            disabled={saving || settingSaving || postGameResultsUpdating || postWorkoutsUpdating}
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
        title="Post to Discord"
        subtitle="Share announcements, game results, and workout updates automatically with your Discord community."
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
            label="Post game results"
          />
          <FormControlLabel
            control={
              <Switch
                checked={postAnnouncementsEnabled}
                onChange={async (event) => {
                  const nextValue = event.target.checked;
                  const channelPayload = normalizeExistingChannel();
                  if (nextValue && !channelPayload) {
                    openChannelDialog().catch(() => {});
                    return;
                  }
                  setSettingSaving(true);
                  const previous = postAnnouncementsEnabled;
                  try {
                    const next = await updateStatus(accountId, ANNOUNCEMENTS_FEATURE, {
                      enabled: nextValue,
                      channel: channelPayload,
                    });
                    setAnnouncementStatus(next);
                    setPostAnnouncementsEnabled(nextValue);
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : 'Unable to update Discord settings.';
                    setError(message);
                    setPostAnnouncementsEnabled(previous);
                  } finally {
                    setSettingSaving(false);
                  }
                }}
                disabled={settingSaving || saving}
              />
            }
            label="Post announcements"
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
            label="Post workouts"
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
