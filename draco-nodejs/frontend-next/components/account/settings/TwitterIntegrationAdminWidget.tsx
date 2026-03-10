'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  updateAccountTwitterSettings,
  createTwitterAuthorizationUrl,
} from '@draco/shared-api-client';
import type { AccountTwitterSettingsType, AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { useNotifications } from '../../../hooks/useNotifications';
import { useSearchParams } from 'next/navigation';

interface TwitterIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

export const TwitterIntegrationAdminWidget: React.FC<TwitterIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
}) => {
  const apiClient = useApiClient();
  const [handle, setHandle] = useState(account.socials?.twitterAccountName ?? '');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [ingestionBearerToken, setIngestionBearerToken] = useState('');
  const [authorizing, setAuthorizing] = useState(false);
  const [clearCredentials, setClearCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();
  const formDisabled = saving;
  const searchParams = useSearchParams();
  const authStatus = searchParams.get('twitterAuth');
  const authMessage = searchParams.get('message');
  const twitterConnected = Boolean(account.socials?.twitterConnected);

  useEffect(() => {
    setHandle(account.socials?.twitterAccountName ?? '');
  }, [account.socials?.twitterAccountName]);

  useEffect(() => {
    if (authStatus === 'success') {
      showNotification('Twitter authorization completed successfully.', 'success');
    } else if (authStatus === 'error') {
      const msg = authMessage
        ? `Twitter authorization failed: ${decodeURIComponent(authMessage)}. Please verify client credentials and try again.`
        : 'Twitter authorization failed. Please verify client credentials and try again.';
      showNotification(msg, 'error');
    }
  }, [authStatus, authMessage, showNotification]);

  const normalizedCurrentHandle = (account.socials?.twitterAccountName ?? '').trim();
  const hasPendingChanges =
    handle.trim() !== normalizedCurrentHandle ||
    clientId.trim().length > 0 ||
    clientSecret.trim().length > 0 ||
    ingestionBearerToken.trim().length > 0 ||
    clearCredentials;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    hideNotification();

    if (!hasPendingChanges) {
      showNotification('Update at least one field before saving.', 'error');
      return;
    }

    setSaving(true);

    try {
      const payload: AccountTwitterSettingsType = {};
      const normalizedHandle = handle.trim();
      const normalizedClientId = clientId.trim();
      const normalizedClientSecret = clientSecret.trim();
      const normalizedIngestionBearerToken = ingestionBearerToken.trim();

      if (normalizedHandle !== normalizedCurrentHandle) {
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

      showNotification(
        'Twitter settings saved. Secrets are encrypted and never shown here.',
        'success',
      );
      setClientId('');
      setClientSecret('');
      setIngestionBearerToken('');
      setClearCredentials(false);
    } catch (err) {
      console.error('Failed to save Twitter settings', err);
      showNotification('Unable to save Twitter settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startOAuthFlow = async () => {
    hideNotification();
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
      showNotification('Unable to start Twitter authorization. Please try again.', 'error');
    } finally {
      setAuthorizing(false);
    }
  };

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
                    : 'Starts the OAuth flow to grant tweet.write permissions for posting updates.'}
                </Typography>
              </Box>
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
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={hideNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
            {notification?.message}
          </Alert>
        </Snackbar>
      </form>
    </WidgetShell>
  );
};
