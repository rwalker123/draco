'use client';

import React from 'react';
import { Alert, FormControlLabel, Snackbar, Stack, Switch, Typography } from '@mui/material';
import type { AccountSettingState } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useNotifications } from '../../../hooks/useNotifications';

type ToggleKey = 'gameResults' | 'announcements' | 'workouts';

interface BlueskyPostSettingsWidgetProps {
  postGameResultsSetting?: AccountSettingState;
  postGameResultsUpdating?: boolean;
  onUpdatePostGameResults?: (enabled: boolean) => Promise<void>;
  postAnnouncementsSetting?: AccountSettingState;
  postAnnouncementsUpdating?: boolean;
  onUpdatePostAnnouncements?: (enabled: boolean) => Promise<void>;
  postWorkoutSetting?: AccountSettingState;
  postWorkoutUpdating?: boolean;
  onUpdatePostWorkout?: (enabled: boolean) => Promise<void>;
}

const resolveSettingValue = (setting?: AccountSettingState): boolean =>
  Boolean(setting?.effectiveValue ?? setting?.value ?? false);

export const BlueskyPostSettingsWidget: React.FC<BlueskyPostSettingsWidgetProps> = ({
  postGameResultsSetting,
  postGameResultsUpdating = false,
  onUpdatePostGameResults,
  postAnnouncementsSetting,
  postAnnouncementsUpdating = false,
  onUpdatePostAnnouncements,
  postWorkoutSetting,
  postWorkoutUpdating = false,
  onUpdatePostWorkout,
}) => {
  const { notification, showNotification, hideNotification } = useNotifications();
  const [savingKey, setSavingKey] = React.useState<ToggleKey | null>(null);

  const postGameResultsEnabled = resolveSettingValue(postGameResultsSetting);
  const postAnnouncementsEnabled = resolveSettingValue(postAnnouncementsSetting);
  const postWorkoutsEnabled = resolveSettingValue(postWorkoutSetting);

  const handleToggle = async (
    toggleKey: ToggleKey,
    currentValue: boolean,
    updater?: (enabled: boolean) => Promise<void>,
  ) => {
    if (!updater) {
      showNotification('Updating this Bluesky setting is not available.', 'error');
      return;
    }

    const nextValue = !currentValue;
    setSavingKey(toggleKey);
    hideNotification();

    try {
      await updater(nextValue);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update Bluesky posting settings.';
      showNotification(message, 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const isSaving = savingKey !== null;

  return (
    <WidgetShell
      title="Post to Bluesky"
      subtitle="Share announcements, game results, and workout updates automatically with your Bluesky followers."
      accent="info"
    >
      <Stack spacing={2} sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Choose which updates are posted using your saved Bluesky credentials.
        </Typography>
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={hideNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {notification ? (
            <Alert onClose={hideNotification} severity={notification.severity} variant="filled">
              {notification.message}
            </Alert>
          ) : undefined}
        </Snackbar>
        <FormControlLabel
          control={
            <Switch
              checked={postGameResultsEnabled}
              onChange={() =>
                handleToggle('gameResults', postGameResultsEnabled, onUpdatePostGameResults)
              }
              disabled={isSaving || postGameResultsUpdating || !onUpdatePostGameResults}
            />
          }
          label="Post game results"
        />
        <FormControlLabel
          control={
            <Switch
              checked={postAnnouncementsEnabled}
              onChange={() =>
                handleToggle('announcements', postAnnouncementsEnabled, onUpdatePostAnnouncements)
              }
              disabled={isSaving || postAnnouncementsUpdating || !onUpdatePostAnnouncements}
            />
          }
          label="Post announcements"
        />
        <FormControlLabel
          control={
            <Switch
              checked={postWorkoutsEnabled}
              onChange={() => handleToggle('workouts', postWorkoutsEnabled, onUpdatePostWorkout)}
              disabled={isSaving || postWorkoutUpdating || !onUpdatePostWorkout}
            />
          }
          label="Post workouts"
        />
      </Stack>
    </WidgetShell>
  );
};

export default BlueskyPostSettingsWidget;
