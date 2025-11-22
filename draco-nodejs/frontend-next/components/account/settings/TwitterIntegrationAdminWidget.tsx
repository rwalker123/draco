'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { updateAccountTwitterSettings } from '@draco/shared-api-client';
import type {
  AccountSettingState,
  AccountTwitterSettingsType,
  AccountType,
} from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

interface TwitterIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
  postGameResultsSetting?: AccountSettingState;
  postGameResultsUpdating?: boolean;
  onUpdatePostGameResults?: (enabled: boolean) => Promise<void>;
}

export const TwitterIntegrationAdminWidget: React.FC<TwitterIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
  postGameResultsSetting,
  postGameResultsUpdating = false,
  onUpdatePostGameResults,
}) => {
  const apiClient = useApiClient();
  const [handle, setHandle] = useState(account.socials?.twitterAccountName ?? '');
  const [oauthToken, setOauthToken] = useState('');
  const [oauthSecret, setOauthSecret] = useState('');
  const [postGameResults, setPostGameResults] = useState(
    Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value ?? false),
  );
  const [clearCredentials, setClearCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formDisabled = saving || postGameResultsUpdating;

  useEffect(() => {
    setHandle(account.socials?.twitterAccountName ?? '');
    setPostGameResults(
      Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value ?? false),
    );
  }, [
    account.socials?.twitterAccountName,
    postGameResultsSetting?.effectiveValue,
    postGameResultsSetting?.value,
  ]);

  const hasPendingChanges = useMemo(() => {
    return (
      handle.trim() !== (account.socials?.twitterAccountName ?? '').trim() ||
      oauthToken.trim().length > 0 ||
      oauthSecret.trim().length > 0 ||
      clearCredentials ||
      postGameResults !==
        Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value)
    );
  }, [
    account.socials?.twitterAccountName,
    clearCredentials,
    handle,
    oauthSecret,
    oauthToken,
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
        const payload: AccountTwitterSettingsType = {};
        const normalizedHandle = handle.trim();
        const normalizedToken = oauthToken.trim();
        const normalizedSecret = oauthSecret.trim();

        if (normalizedHandle !== (account.socials?.twitterAccountName ?? '').trim()) {
          payload.twitterAccountName = normalizedHandle;
        }

        if (clearCredentials) {
          payload.twitterOauthToken = '';
          payload.twitterOauthSecretKey = '';
        } else {
          if (normalizedToken) {
            payload.twitterOauthToken = normalizedToken;
          }

          if (normalizedSecret) {
            payload.twitterOauthSecretKey = normalizedSecret;
          }
        }

        if (Object.keys(payload).length > 0) {
          const result = await updateAccountTwitterSettings({
            client: apiClient,
            path: { accountId: account.id },
            body: payload,
            throwOnError: false,
          });

          const updated = unwrapApiResult(result, 'Unable to save Twitter settings') as AccountType;
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

        setSuccess('Twitter settings saved. Secrets are encrypted and never shown here.');
        setOauthToken('');
        setOauthSecret('');
        setClearCredentials(false);
      } catch (err) {
        console.error('Failed to save Twitter settings', err);
        setError('Unable to save Twitter settings. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      account.id,
      account.socials?.twitterAccountName,
      apiClient,
      clearCredentials,
      handle,
      hasPendingChanges,
      oauthSecret,
      oauthToken,
      postGameResultsSetting?.effectiveValue,
      postGameResultsSetting?.value,
      postGameResults,
      onUpdatePostGameResults,
      onAccountUpdate,
    ],
  );

  return (
    <WidgetShell
      title="Twitter Integration"
      subtitle="Store the credentials needed to read and publish tweets without exposing secrets to the client."
      accent="info"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Alert severity="info">
            Twitter credentials are stored securely on the server and never returned to the browser.
            Enter new values to update them or use the toggle below to clear stored credentials.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Twitter account handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="@draco"
            helperText="Used for the like widget and to resolve your public tweets."
            fullWidth
          />

          <TextField
            label="OAuth token"
            type="password"
            value={oauthToken}
            onChange={(event) => setOauthToken(event.target.value)}
            helperText="New tokens overwrite the stored value. Leave blank to keep the current token."
            fullWidth
            autoComplete="off"
          />

          <TextField
            label="OAuth secret key"
            type="password"
            value={oauthSecret}
            onChange={(event) => setOauthSecret(event.target.value)}
            helperText="New secrets overwrite the stored value."
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
            label="Post game results to Twitter"
          />
          <Typography variant="body2" color="text.secondary">
            When enabled, game results will be posted to this Twitter account by the server once
            scores are finalized.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={clearCredentials}
                onChange={(event) => setClearCredentials(event.target.checked)}
                disabled={formDisabled}
              />
            }
            label="Clear stored OAuth token and secret key"
          />

          <Box display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" color="primary" disabled={formDisabled}>
              {saving ? 'Saving…' : 'Save Twitter settings'}
            </Button>
          </Box>
        </Stack>
      </form>
    </WidgetShell>
  );
};
