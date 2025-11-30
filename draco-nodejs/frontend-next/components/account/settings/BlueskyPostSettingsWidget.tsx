'use client';

import React from 'react';
import { Alert, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import type { AccountSettingState } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';

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
  const [error, setError] = React.useState<string | null>(null);
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
      setError('Updating this Bluesky setting is not available.');
      return;
    }

    const nextValue = !currentValue;
    setSavingKey(toggleKey);
    setError(null);

    try {
      await updater(nextValue);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update Bluesky posting settings.';
      setError(message);
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
        {error && <Alert severity="error">{error}</Alert>}
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
