'use client';

import React from 'react';
import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import NotificationSnackbar from '../../common/NotificationSnackbar';
import type { AccountSettingState } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useNotifications } from '../../../hooks/useNotifications';

type ToggleKey = 'gameResults' | 'announcements' | 'workouts';

interface FacebookPostSettingsWidgetProps {
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

export const FacebookPostSettingsWidget: React.FC<FacebookPostSettingsWidgetProps> = ({
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
      showNotification('Updating this Facebook setting is not available.', 'error');
      return;
    }

    const nextValue = !currentValue;
    setSavingKey(toggleKey);
    hideNotification();

    try {
      await updater(nextValue);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update Facebook settings.';
      showNotification(message, 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const isSaving = savingKey !== null;

  return (
    <WidgetShell
      title="Post to Facebook"
      subtitle="Choose which updates should be published to Facebook after integration is configured."
      accent="info"
    >
      <Stack spacing={2} sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          These toggles will control Facebook posting once the integration is fully wired.
        </Typography>
        <NotificationSnackbar notification={notification} onClose={hideNotification} />
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

export default FacebookPostSettingsWidget;
