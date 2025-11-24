'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { updateAccountBlueskySettings } from '@draco/shared-api-client';
import type {
  AccountBlueskySettingsType,
  AccountSettingState,
  AccountType,
} from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

interface BlueskyIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
  postGameResultsSetting?: AccountSettingState;
  postGameResultsUpdating?: boolean;
  onUpdatePostGameResults?: (enabled: boolean) => Promise<void>;
}

export const BlueskyIntegrationAdminWidget: React.FC<BlueskyIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
  postGameResultsSetting,
  postGameResultsUpdating = false,
  onUpdatePostGameResults,
}) => {
  const apiClient = useApiClient();
  const [handle, setHandle] = useState(account.socials?.blueskyHandle ?? '');
  const [appPassword, setAppPassword] = useState('');
  const [postGameResults, setPostGameResults] = useState(
    Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value ?? false),
  );
  const [clearPassword, setClearPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formDisabled = saving || postGameResultsUpdating;

  useEffect(() => {
    setHandle(account.socials?.blueskyHandle ?? '');
    setPostGameResults(
      Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value ?? false),
    );
  }, [account.socials?.blueskyHandle, postGameResultsSetting?.effectiveValue, postGameResultsSetting?.value]);

  const hasPendingChanges = useMemo(() => {
    return (
      handle.trim() !== (account.socials?.blueskyHandle ?? '').trim() ||
      appPassword.trim().length > 0 ||
      clearPassword ||
      postGameResults !==
        Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value)
    );
  }, [
    account.socials?.blueskyHandle,
    appPassword,
    clearPassword,
    handle,
    postGameResultsSetting?.effectiveValue,
    postGameResultsSetting?.value,
    postGameResults,
  ]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (!hasPendingChanges) {
        setError('Update at least one field before saving.');
        return;
      }

      setSaving(true);

      try {
        const payload: AccountBlueskySettingsType = {};
        const normalizedHandle = handle.trim();
        const normalizedPassword = appPassword.trim();

        if (normalizedHandle !== (account.socials?.blueskyHandle ?? '').trim()) {
          payload.blueskyHandle = normalizedHandle;
        }

        if (clearPassword) {
          payload.blueskyAppPassword = '';
        } else if (normalizedPassword) {
          payload.blueskyAppPassword = normalizedPassword;
        }

        if (Object.keys(payload).length > 0) {
          const result = await updateAccountBlueskySettings({
            client: apiClient,
            path: { accountId: account.id },
            body: payload,
            throwOnError: false,
          });

          const updated = unwrapApiResult(result, 'Unable to save Bluesky settings') as AccountType;
          onAccountUpdate?.(updated);
        }

        if (
          postGameResults !==
          Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value)
        ) {
          if (!onUpdatePostGameResults) {
            throw new Error('Post game results setting handler is not available.');
          }

          await onUpdatePostGameResults(postGameResults);
        }

        setSuccess('Bluesky settings saved. App passwords are encrypted and never shown here.');
        setAppPassword('');
        setClearPassword(false);
      } catch (err) {
        console.error('Failed to save Bluesky settings', err);
        setError('Unable to save Bluesky settings. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      account.id,
      account.socials?.blueskyHandle,
      apiClient,
      appPassword,
      clearPassword,
      handle,
      hasPendingChanges,
      postGameResultsSetting?.effectiveValue,
      postGameResultsSetting?.value,
      postGameResults,
      onUpdatePostGameResults,
      onAccountUpdate,
    ],
  );

  return (
    <WidgetShell
      title="Bluesky Integration"
      subtitle="Securely store your Bluesky app password and control automated posts."
      accent="info"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Alert severity="info">
            Bluesky credentials are stored securely on the server and never returned to the browser.
            Enter new values to update them or use the toggle below to clear the stored app password.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Bluesky handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="teamname.bsky.social"
            helperText="Used to fetch your public feed and attribute posts."
            fullWidth
          />

          <TextField
            label="App password"
            type="password"
            value={appPassword}
            onChange={(event) => setAppPassword(event.target.value)}
            helperText="New passwords overwrite the stored value. Leave blank to keep the current password."
            fullWidth
            autoComplete="off"
          />

          <FormControlLabel
            control={
              <Switch
                checked={postGameResults}
                onChange={(event) => setPostGameResults(event.target.checked)}
                disabled={formDisabled}
              />
            }
            label="Post game results to Bluesky"
          />
          <Typography variant="body2" color="text.secondary">
            When enabled, game results will be posted to this Bluesky account by the server once scores are
            finalized.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={clearPassword}
                onChange={(event) => setClearPassword(event.target.checked)}
                disabled={formDisabled}
              />
            }
            label="Clear stored app password"
          />

          <Box display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" color="primary" disabled={formDisabled}>
              {saving ? 'Saving…' : 'Save Bluesky settings'}
            </Button>
          </Box>
        </Stack>
      </form>
    </WidgetShell>
  );
};
