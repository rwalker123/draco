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
  Typography,
} from '@mui/material';
import Link from 'next/link';
import type { AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { useSearchParams } from 'next/navigation';
import { assertNoApiError, unwrapApiResult } from '@/utils/apiResult';
import { useAuth } from '@/context/AuthContext';
import {
  createFacebookAuthorizationUrl,
  disconnectAccountFacebook,
  getAccountFacebookStatus,
  upsertAccountFacebookCredentials,
} from '@draco/shared-api-client';

interface FacebookIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

type FacebookStatusResponse = {
  appConfigured: boolean;
  pageConnected: boolean;
  pageId?: string | null;
  pageName?: string | null;
  pageHandle?: string | null;
  userTokenPresent?: boolean;
};

export const FacebookIntegrationAdminWidget: React.FC<FacebookIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
}) => {
  const apiClient = useApiClient();
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [facebookAppId, setFacebookAppId] = useState('');
  const [facebookAppSecret, setFacebookAppSecret] = useState('');
  const [clearCredentials, setClearCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pageHandle, setPageHandle] = useState('');
  const [savedPageHandle, setSavedPageHandle] = useState<string | null>(null);
  const [savingPageHandle, setSavingPageHandle] = useState(false);
  const [pageConnected, setPageConnected] = useState(false);
  const [pageName, setPageName] = useState<string | null>(null);
  const [appConfigured, setAppConfigured] = useState(false);
  const [userTokenPresent, setUserTokenPresent] = useState(false);
  const pageHandleDirty = pageHandle.trim() !== (savedPageHandle ?? '');

  const authStatus = searchParams.get('facebookAuth');
  const authMessage = searchParams.get('message');

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    const loadStatus = async () => {
      setStatusLoading(true);
      try {
        const response = await getAccountFacebookStatus({
          client: apiClient,
          path: { accountId: account.id },
          throwOnError: false,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const body = unwrapApiResult<FacebookStatusResponse>(
          response,
          'Unable to load Facebook status.',
        );
        setAppConfigured(Boolean(body.appConfigured));
        setPageConnected(Boolean(body.pageConnected));
        setPageName(body.pageName ?? null);
        setPageHandle(body.pageHandle ?? '');
        setSavedPageHandle(body.pageHandle ?? null);
        setUserTokenPresent(Boolean(body.userTokenPresent));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load Facebook status', err);
        setError('Unable to load Facebook status. Please try again.');
      } finally {
        if (!controller.signal.aborted) {
          setStatusLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      controller.abort();
    };
  }, [account.id, apiClient, token]);

  useEffect(() => {
    if (!authStatus) return;

    if (authStatus === 'error') {
      setError(authMessage || 'Facebook authorization failed.');
      return;
    }

    if (authStatus !== 'success') return;

    setSuccess(
      authMessage || 'Facebook authorization completed. Enter your Page handle to finish setup.',
    );

    if (!token) return;

    const controller = new AbortController();

    const loadStatus = async () => {
      setStatusLoading(true);
      try {
        const response = await getAccountFacebookStatus({
          client: apiClient,
          path: { accountId: account.id },
          throwOnError: false,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const body = unwrapApiResult<FacebookStatusResponse>(
          response,
          'Unable to load Facebook status.',
        );
        setAppConfigured(Boolean(body.appConfigured));
        setPageConnected(Boolean(body.pageConnected));
        setPageName(body.pageName ?? null);
        setPageHandle(body.pageHandle ?? '');
        setSavedPageHandle(body.pageHandle ?? null);
        setUserTokenPresent(Boolean(body.userTokenPresent));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load Facebook status', err);
        setError('Unable to load Facebook status. Please try again.');
      } finally {
        if (!controller.signal.aborted) {
          setStatusLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      controller.abort();
    };
  }, [account.id, apiClient, authMessage, authStatus, token]);

  const hasPendingChanges =
    facebookAppId.trim().length > 0 || facebookAppSecret.trim().length > 0 || clearCredentials;

  const submitDisabled = saving || !hasPendingChanges;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasPendingChanges) {
      setError('Update at least one field before saving.');
      return;
    }

    setSaving(true);

    try {
      const normalizedAppId = facebookAppId.trim();
      const normalizedAppSecret = facebookAppSecret.trim();

      const payload = {
        appId: normalizedAppId || undefined,
        appSecret: normalizedAppSecret || undefined,
        clearCredentials,
      };

      const result = await upsertAccountFacebookCredentials({
        client: apiClient,
        path: { accountId: account.id },
        body: payload,
        throwOnError: false,
      });
      assertNoApiError(result, 'Unable to save Facebook settings');
      onAccountUpdate?.(account);

      setSuccess('Facebook settings saved. Secrets are encrypted and never shown here.');
      setFacebookAppId('');
      setFacebookAppSecret('');
      setClearCredentials(false);

      if (token) {
        setStatusLoading(true);
        try {
          const response = await getAccountFacebookStatus({
            client: apiClient,
            path: { accountId: account.id },
            throwOnError: false,
          });
          const body = unwrapApiResult<FacebookStatusResponse>(
            response,
            'Unable to load Facebook status.',
          );
          setAppConfigured(Boolean(body.appConfigured));
          setPageConnected(Boolean(body.pageConnected));
          setPageName(body.pageName ?? null);
          setPageHandle(body.pageHandle ?? '');
          setSavedPageHandle(body.pageHandle ?? null);
          setUserTokenPresent(Boolean(body.userTokenPresent));
        } catch (statusErr) {
          console.error('Failed to load Facebook status', statusErr);
        } finally {
          setStatusLoading(false);
        }
      }
    } catch (err) {
      console.error('Failed to save Facebook settings', err);
      setError('Unable to save Facebook settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!token) {
      setError('You must be signed in to connect Facebook.');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      const result = await createFacebookAuthorizationUrl({
        client: apiClient,
        path: { accountId: account.id },
        body: { returnUrl: typeof window !== 'undefined' ? window.location.href : undefined },
        throwOnError: false,
      });
      const { authorizationUrl } = unwrapApiResult(
        result,
        'Unable to create Facebook authorization URL',
      ) as { authorizationUrl?: string };
      if (!authorizationUrl) {
        throw new Error('Authorization URL not returned');
      }
      window.location.href = authorizationUrl;
    } catch (err) {
      console.error('Failed to start Facebook authorization', err);
      setError('Unable to start Facebook authorization. Check app credentials and try again.');
    }
  };

  const handleSavePageHandle = async () => {
    if (!token) {
      setError('You must be signed in to connect Facebook.');
      return;
    }
    const normalizedHandle = pageHandle.trim();
    if (!normalizedHandle) {
      setError('Enter a Facebook Page handle before saving.');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      setSavingPageHandle(true);
      const result = await upsertAccountFacebookCredentials({
        client: apiClient,
        path: { accountId: account.id },
        body: { pageHandle: normalizedHandle },
        throwOnError: false,
      });
      assertNoApiError(result, 'Unable to save Facebook Page handle.');
      setSuccess('Facebook Page handle saved.');
      setSavedPageHandle(normalizedHandle);

      setStatusLoading(true);
      try {
        const response = await getAccountFacebookStatus({
          client: apiClient,
          path: { accountId: account.id },
          throwOnError: false,
        });
        const body = unwrapApiResult<FacebookStatusResponse>(
          response,
          'Unable to load Facebook status.',
        );
        setAppConfigured(Boolean(body.appConfigured));
        setPageConnected(Boolean(body.pageConnected));
        setPageName(body.pageName ?? null);
        setPageHandle(body.pageHandle ?? '');
        setSavedPageHandle(body.pageHandle ?? null);
        setUserTokenPresent(Boolean(body.userTokenPresent));
      } catch (statusErr) {
        console.error('Failed to load Facebook status', statusErr);
      } finally {
        setStatusLoading(false);
      }
    } catch (err) {
      console.error('Failed to save Facebook Page handle', err);
      setError('Unable to save Facebook Page handle. Confirm Facebook is connected and try again.');
    } finally {
      setSavingPageHandle(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) {
      setError('You must be signed in to disconnect Facebook.');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      const result = await disconnectAccountFacebook({
        client: apiClient,
        path: { accountId: account.id },
        throwOnError: false,
      });
      assertNoApiError(result, 'Unable to disconnect Facebook.');
      setPageConnected(false);
      setPageName(null);
      setPageHandle('');
      setSavedPageHandle(null);
      setUserTokenPresent(false);
      setSuccess('Facebook integration disconnected.');

      setStatusLoading(true);
      try {
        const response = await getAccountFacebookStatus({
          client: apiClient,
          path: { accountId: account.id },
          throwOnError: false,
        });
        const body = unwrapApiResult<FacebookStatusResponse>(
          response,
          'Unable to load Facebook status.',
        );
        setAppConfigured(Boolean(body.appConfigured));
        setPageConnected(Boolean(body.pageConnected));
        setPageName(body.pageName ?? null);
        setPageHandle(body.pageHandle ?? '');
        setSavedPageHandle(body.pageHandle ?? null);
        setUserTokenPresent(Boolean(body.userTokenPresent));
      } catch (statusErr) {
        console.error('Failed to load Facebook status', statusErr);
      } finally {
        setStatusLoading(false);
      }
    } catch (err) {
      console.error('Failed to disconnect Facebook', err);
      setError('Unable to disconnect Facebook.');
    }
  };

  const handleRefreshStatus = async () => {
    if (!token) return;
    setStatusLoading(true);
    try {
      const response = await getAccountFacebookStatus({
        client: apiClient,
        path: { accountId: account.id },
        throwOnError: false,
      });
      const body = unwrapApiResult<FacebookStatusResponse>(
        response,
        'Unable to load Facebook status.',
      );
      setAppConfigured(Boolean(body.appConfigured));
      setPageConnected(Boolean(body.pageConnected));
      setPageName(body.pageName ?? null);
      setPageHandle(body.pageHandle ?? '');
      setSavedPageHandle(body.pageHandle ?? null);
      setUserTokenPresent(Boolean(body.userTokenPresent));
    } catch (err) {
      console.error('Failed to load Facebook status', err);
      setError('Unable to load Facebook status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <>
      <WidgetShell
        title="Facebook Integration"
        subtitle="Connect the Meta App credentials required for Facebook Page posting."
        accent="info"
      >
        <form onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" data-1p-ignore="true">
          <Stack spacing={3}>
            <Alert severity="info">
              Facebook credentials power Facebook Page posting. Provide your Meta App ID and App
              Secret from the{' '}
              <Link
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Meta App Dashboard in a new tab"
                style={{ fontWeight: 600, color: '#1976d2', textDecoration: 'underline' }}
              >
                Meta App Dashboard
              </Link>
              . After connecting Facebook, save your Page handle to refresh the Page token. Secrets
              are stored server-side and never displayed.
              <br />
              <strong>Where to find values:</strong> Meta App Dashboard → Basic → App ID / App
              Secret.
            </Alert>

            <Stack spacing={1.5}>
              <TextField
                label="Facebook Page handle"
                value={pageHandle}
                onChange={(event) => setPageHandle(event.target.value)}
                placeholder="YourPageName"
                helperText={
                  savedPageHandle
                    ? `Current saved handle: ${savedPageHandle}`
                    : 'Enter the Page handle (username) shown in the Page URL.'
                }
                fullWidth
                autoComplete="off"
                name="facebook-page-handle"
                inputProps={{
                  'data-lpignore': 'true',
                  'data-1p-ignore': 'true',
                  autoCapitalize: 'none',
                  spellCheck: false,
                }}
                disabled={savingPageHandle || statusLoading}
              />
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  onClick={handleSavePageHandle}
                  disabled={
                    savingPageHandle ||
                    statusLoading ||
                    pageHandle.trim().length === 0 ||
                    !pageHandleDirty
                  }
                >
                  {savingPageHandle ? 'Saving…' : 'Save Page handle'}
                </Button>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <TextField
                label="Facebook App ID"
                value={facebookAppId}
                onChange={(event) => setFacebookAppId(event.target.value)}
                placeholder="123456789012345"
                helperText="Meta App Dashboard → Basic → App ID."
                fullWidth
                autoComplete="off"
                name="facebook-app-id"
                inputProps={{ 'data-lpignore': 'true', 'data-1p-ignore': 'true' }}
                disabled={saving}
              />

              <TextField
                label="Facebook App Secret"
                type="password"
                value={facebookAppSecret}
                onChange={(event) => setFacebookAppSecret(event.target.value)}
                helperText="Meta App Dashboard → Basic → App Secret."
                fullWidth
                autoComplete="off"
                name="facebook-app-secret"
                inputProps={{ 'data-lpignore': 'true', 'data-1p-ignore': 'true' }}
                disabled={saving}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={clearCredentials}
                    onChange={(event) => setClearCredentials(event.target.checked)}
                    disabled={saving}
                  />
                }
                label="Clear stored Facebook App credentials"
              />
            </Stack>

            <Box display="flex" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitDisabled}
                data-lpignore="true"
                data-1p-ignore="true"
              >
                {saving ? 'Saving…' : 'Save Facebook settings'}
              </Button>
            </Box>

            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Status:{' '}
                {statusLoading
                  ? 'Loading…'
                  : appConfigured
                    ? 'App configured'
                    : 'App not configured'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facebook user token: {userTokenPresent ? 'Connected' : 'Not connected'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Page handle: {savedPageHandle || 'Not saved'}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={handleConnect}
                  disabled={!appConfigured || statusLoading}
                >
                  Connect Facebook
                </Button>
                <Button variant="text" onClick={handleRefreshStatus} disabled={statusLoading}>
                  Refresh status
                </Button>
              </Box>

              {pageConnected && (
                <Alert severity="success">
                  Connected Page: {pageName || 'Unknown'}
                  <Box component="span" ml={2}>
                    <Button color="inherit" size="small" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </Box>
                </Alert>
              )}

              {appConfigured && userTokenPresent && !pageConnected && (
                <Alert severity="info">
                  Facebook is authorized. Save the Page handle above to refresh the Page token and
                  finish connecting.
                </Alert>
              )}

              {appConfigured && !userTokenPresent && !pageConnected && (
                <Alert severity="warning">
                  Connect Facebook to obtain a user token, then save your Page handle to finish
                  setup.
                </Alert>
              )}
            </Stack>
          </Stack>
        </form>
      </WidgetShell>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FacebookIntegrationAdminWidget;
