'use client';

import React, { useMemo } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import type { AccountSettingKey, AccountSettingState } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { AccountSettingsGroup } from './AccountSettingsGroup';

interface GeneralSettingsWidgetProps {
  loading: boolean;
  error: string | null;
  settings: AccountSettingState[] | null;
  canManage: boolean;
  updatingKey: AccountSettingKey | null;
  onRetry: () => void;
  onUpdate: (key: AccountSettingKey, value: boolean | number) => Promise<void>;
}

export const GeneralSettingsWidget: React.FC<GeneralSettingsWidgetProps> = ({
  error,
  settings,
  canManage,
  updatingKey,
  onRetry,
  onUpdate,
}) => {
  const settingsMap = useMemo(() => {
    const map = new Map<AccountSettingKey, AccountSettingState>();
    (settings ?? []).forEach((entry) => {
      map.set(entry.definition.key, entry);
    });
    return map;
  }, [settings]);

  if (error) {
    return (
      <WidgetShell title="General Account Settings" subtitle="Enable or disable account features.">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </WidgetShell>
    );
  }

  if (!settings || settings.length === 0) {
    return (
      <WidgetShell title="General Account Settings" subtitle="Enable or disable account features.">
        <Alert severity="info">Account settings are not available yet.</Alert>
      </WidgetShell>
    );
  }

  const groups = groupSettings(settings);

  return (
    <WidgetShell
      title="General Account Settings"
      subtitle="Enable or disable account features and player data tracking options."
      accent="secondary"
    >
      <Stack spacing={3}>
        {groups.map((group) => (
          <AccountSettingsGroup
            key={group.id}
            title={group.label}
            settings={group.settings}
            settingsMap={settingsMap}
            canManage={canManage}
            updatingKey={updatingKey}
            onUpdate={onUpdate}
          />
        ))}
      </Stack>
    </WidgetShell>
  );
};

const GROUP_ORDER = [
  'accountFeatures',
  'playerData',
  'contactInformation',
  'teamPages',
  'messageBoard',
] as const;

function groupSettings(settings: AccountSettingState[]) {
  const map = new Map<
    string,
    {
      id: string;
      label: string;
      settings: AccountSettingState[];
    }
  >();

  for (const entry of settings) {
    const { groupId, groupLabel } = entry.definition;
    if (!map.has(groupId)) {
      map.set(groupId, {
        id: groupId,
        label: groupLabel,
        settings: [],
      });
    }
    map.get(groupId)?.settings.push(entry);
  }

  return GROUP_ORDER.map((groupId) => map.get(groupId)).filter(
    (group): group is NonNullable<ReturnType<typeof map.get>> => Boolean(group),
  );
}
