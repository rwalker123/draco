'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  updateAccountTwitterSettings,
  createTwitterAuthorizationUrl,
} from '@draco/shared-api-client';
import type {
  AccountSettingState,
  AccountTwitterSettingsType,
  AccountType,
} from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { useSearchParams } from 'next/navigation';

interface TwitterIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
  postGameResultsSetting?: AccountSettingState;
  postGameResultsUpdating?: boolean;
  onUpdatePostGameResults?: (enabled: boolean) => Promise<void>;
  postWorkoutSetting?: AccountSettingState;
  postWorkoutUpdating?: boolean;
  onUpdatePostWorkout?: (enabled: boolean) => Promise<void>;
}

export const TwitterIntegrationAdminWidget: React.FC<TwitterIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
  postGameResultsSetting,
  postGameResultsUpdating = false,
  onUpdatePostGameResults,
  postWorkoutSetting,
  postWorkoutUpdating = false,
  onUpdatePostWorkout,
}) => {
  const apiClient = useApiClient();
  const [handle, setHandle] = useState(account.socials?.twitterAccountName ?? '');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [ingestionBearerToken, setIngestionBearerToken] = useState('');
  const [postGameResults, setPostGameResults] = useState(
    Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value ?? false),
  );
  const [postWorkouts, setPostWorkouts] = useState(
    Boolean(postWorkoutSetting?.effectiveValue ?? postWorkoutSetting?.value ?? false),
  );
  const [authorizing, setAuthorizing] = useState(false);
  const [clearCredentials, setClearCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formDisabled = saving || postGameResultsUpdating || postWorkoutUpdating;
  const searchParams = useSearchParams();
  const authStatus = searchParams.get('twitterAuth');
  const authMessage = searchParams.get('message');
  const twitterConnected = Boolean(account.socials?.twitterConnected);

  useEffect(() => {
    setHandle(account.socials?.twitterAccountName ?? '');
    setPostGameResults(
      Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value ?? false),
    );
    setPostWorkouts(Boolean(postWorkoutSetting?.effectiveValue ?? postWorkoutSetting?.value ?? false));
  }, [
    account.socials?.twitterAccountName,
    postGameResultsSetting?.effectiveValue,
    postGameResultsSetting?.value,
    postWorkoutSetting?.effectiveValue,
    postWorkoutSetting?.value,
  ]);

  const hasPendingChanges = useMemo(() => {
    const normalizedHandle = (account.socials?.twitterAccountName ?? '').trim();
    return (
      handle.trim() !== normalizedHandle ||
      clientId.trim().length > 0 ||
      clientSecret.trim().length > 0 ||
      ingestionBearerToken.trim().length > 0 ||
      clearCredentials ||
      postGameResults !==
        Boolean(postGameResultsSetting?.effectiveValue ?? postGameResultsSetting?.value) ||
      postWorkouts !== Boolean(postWorkoutSetting?.effectiveValue ?? postWorkoutSetting?.value)
    );
  }, [
    account.socials?.twitterAccountName,
    clearCredentials,
    clientId,
    clientSecret,
    handle,
    ingestionBearerToken,
    postGameResultsSetting?.effectiveValue,
    postGameResultsSetting?.value,
    postWorkoutSetting?.effectiveValue,
    postWorkoutSetting?.value,
    postGameResults,
    postWorkouts,
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
        const normalizedClientId = clientId.trim();
        const normalizedClientSecret = clientSecret.trim();
        const normalizedIngestionBearerToken = ingestionBearerToken.trim();
        const currentHandle = (account.socials?.twitterAccountName ?? '').trim();

        if (normalizedHandle !== currentHandle) {
          payload.twitterAccountName = normalizedHandle;
        }

        if (clearCredentials) {
          payload.twitterClientId = '';
          payload.twitterClientSecret = '';
          payload.twitterIngestionBearerToken = '';
        } else {
          if (normalizedClientId) {
            payload.twitterClientId = normalizedClientId;
          }
          if (normalizedClientSecret) {
            payload.twitterClientSecret = normalizedClientSecret;
          }
          if (normalizedIngestionBearerToken) {
            payload.twitterIngestionBearerToken = normalizedIngestionBearerToken;
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

        if (postWorkouts !== Boolean(postWorkoutSetting?.effectiveValue ?? postWorkoutSetting?.value)) {
          if (!onUpdatePostWorkout) {
            throw new Error('Post workouts setting handler is not available.');
          }

          await onUpdatePostWorkout(postWorkouts);
        }

        setSuccess('Twitter settings saved. Secrets are encrypted and never shown here.');
        setClientId('');
        setClientSecret('');
        setIngestionBearerToken('');
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
      clientId,
      clientSecret,
      handle,
      hasPendingChanges,
      ingestionBearerToken,
      postGameResultsSetting?.effectiveValue,
      postGameResultsSetting?.value,
      postWorkoutSetting?.effectiveValue,
      postWorkoutSetting?.value,
      postGameResults,
      postWorkouts,
      onUpdatePostGameResults,
      onUpdatePostWorkout,
      onAccountUpdate,
    ],
  );

  const startOAuthFlow = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setAuthorizing(true);
    try {
      const returnUrl = `${window.location.origin}/account/${account.id}/social-media`;
      const result = await createTwitterAuthorizationUrl({
        client: apiClient,
        path: { accountId: account.id },
        body: { returnUrl },
        throwOnError: false,
      });
      const data = unwrapApiResult(result, 'Unable to start Twitter authorization') as {
        authorizationUrl?: string;
      };
      if (!data.authorizationUrl) {
        throw new Error('Authorization URL not returned');
      }

      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error('Failed to start Twitter OAuth flow', err);
      setError('Unable to start Twitter authorization. Please try again.');
    } finally {
      setAuthorizing(false);
    }
  }, [account.id, apiClient]);

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
            Enter new values to update them or use the toggle below to clear stored credentials. You
            can find client credentials in the Twitter Developer Portal under
            <strong> Developer Portal → Projects & Apps → Your App → Keys and tokens</strong>. If
            you don&apos;t have an app yet, create one there first.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          {authStatus === 'success' && (
            <Alert severity="success">Twitter authorization completed successfully.</Alert>
          )}
          {authStatus === 'error' && (
            <Alert severity="error">
              Twitter authorization failed
              {authMessage ? `: ${decodeURIComponent(authMessage)}` : ''}. Please verify client
              credentials and try again.
            </Alert>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Ingestion (read-only)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              In Twitter Developer Portal: Projects &gt; [Your App] &gt; Keys and tokens &gt;
              App-only (OAuth 2.0) → copy the bearer token. Handle is the public @username of the
              account.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Twitter account handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="@draco"
                helperText="Handle used for ingestion (reading public tweets); copy your public @ handle from your Twitter profile."
                fullWidth
              />

              <TextField
                label="Ingestion bearer token"
                type="password"
                value={ingestionBearerToken}
                onChange={(event) => setIngestionBearerToken(event.target.value)}
                helperText="App-only bearer token for reading timelines. In the Twitter Developer Portal: Keys and tokens → Authentication tokens → Bearer token."
                fullWidth
                autoComplete="off"
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Posting (user context)
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Chip
                label={twitterConnected ? 'Connected' : 'Not connected'}
                color={twitterConnected ? 'success' : 'error'}
                size="small"
                variant={twitterConnected ? 'filled' : 'outlined'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              In Twitter Developer Portal: Projects &gt; [Your App] &gt; User authentication
              settings → enable OAuth 2.0 with PKCE + offline access. Copy the Client ID and Client
              Secret from “Keys and tokens”. Click Connect to start OAuth; no manual access token
              input is needed.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Client ID"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                helperText="Twitter app Client ID (OAuth 2.0). Developer Portal → Keys and tokens → Client ID."
                fullWidth
                autoComplete="off"
              />

              <TextField
                label="Client secret"
                type="password"
                value={clientSecret}
                onChange={(event) => setClientSecret(event.target.value)}
                helperText="Twitter app Client Secret. Developer Portal → Keys and tokens → Client secret."
                fullWidth
                autoComplete="off"
              />

              <Box display="flex" gap={2} alignItems="center">
                <Button
                  variant="outlined"
                  onClick={startOAuthFlow}
                  disabled={formDisabled || authorizing}
                >
                  {authorizing ? 'Starting OAuth…' : 'Connect Twitter (OAuth)'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {account.socials?.twitterConnected
                    ? 'Connected: tweet.write is authorized.'
                    : 'Starts the OAuth flow to grant tweet.write permissions for posting game results.'}
                </Typography>
              </Box>

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
                When enabled, game results will be posted to this Twitter account once scores are
                finalized.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={postWorkouts}
                    onChange={(event) => setPostWorkouts(event.target.checked)}
                    disabled={formDisabled}
                  />
                }
                label="Post workouts to Twitter"
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, workout announcements will be posted with the date, time, and a link to view
                full details.
              </Typography>
            </Stack>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={clearCredentials}
                onChange={(event) => setClearCredentials(event.target.checked)}
                disabled={formDisabled}
              />
            }
            label="Clear stored Twitter credentials (client ID/secret, ingestion and user tokens)"
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
