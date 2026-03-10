'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { updateAccountBlueskySettings } from '@draco/shared-api-client';
import type { AccountBlueskySettingsType, AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { useNotifications } from '../../../hooks/useNotifications';
import { unwrapApiResult } from '@/utils/apiResult';

interface BlueskyIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

export const BlueskyIntegrationAdminWidget: React.FC<BlueskyIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
}) => {
  const apiClient = useApiClient();
  const [handle, setHandle] = useState(account.socials?.blueskyHandle ?? '');
  const [appPassword, setAppPassword] = useState('');
  const [clearPassword, setClearPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();
  const formDisabled = saving;

  useEffect(() => {
    setHandle(account.socials?.blueskyHandle ?? '');
  }, [account.socials?.blueskyHandle]);

  const hasPendingChanges =
    handle.trim() !== (account.socials?.blueskyHandle ?? '').trim() ||
    appPassword.trim().length > 0 ||
    clearPassword;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    hideNotification();

    if (!hasPendingChanges) {
      showNotification('Update at least one field before saving.', 'error');
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

      showNotification(
        'Bluesky settings saved. App passwords are encrypted and never shown here.',
        'success',
      );
      setAppPassword('');
      setClearPassword(false);
    } catch (err) {
      console.error('Failed to save Bluesky settings', err);
      showNotification('Unable to save Bluesky settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WidgetShell
      title="Bluesky Integration"
      subtitle="Securely store your Bluesky app password and handle. Manage posting preferences in the Post to Bluesky widget."
      accent="info"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Alert severity="info">
            Bluesky credentials are stored securely on the server and never returned to the browser.
            Enter new values to update them or use the toggle below to clear the stored app
            password.
          </Alert>

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
      </form>
    </WidgetShell>
  );
};
