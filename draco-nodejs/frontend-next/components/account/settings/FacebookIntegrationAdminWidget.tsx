'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
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
  listAccountFacebookPages,
  saveAccountFacebookPage,
  upsertAccountFacebookCredentials,
} from '@draco/shared-api-client';

interface FacebookIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

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
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [pageConnected, setPageConnected] = useState(false);
  const [pageName, setPageName] = useState<string | null>(null);
  const [appConfigured, setAppConfigured] = useState(false);
  type FacebookStatusResponse = {
    appConfigured: boolean;
    pageConnected: boolean;
    pageId?: string | null;
    pageName?: string | null;
  };

  type FacebookPagesResponse = { pages?: Array<{ id: string; name: string }> };

  const authStatus = searchParams.get('facebookAuth');
  const authMessage = searchParams.get('message');

  const loadStatus = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setStatusLoading(true);
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
      setSelectedPageId(body.pageId ?? '');
    } catch (err) {
      console.error('Failed to load Facebook status', err);
      setError('Unable to load Facebook status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  }, [account.id, apiClient, token]);

  const loadPages = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setPagesLoading(true);
      const response = await listAccountFacebookPages({
        client: apiClient,
        path: { accountId: account.id },
        throwOnError: false,
      });
      const body = unwrapApiResult<FacebookPagesResponse>(
        response,
        'Unable to load Facebook Pages.',
      );
      setPages(body.pages ?? []);
      if (body.pages?.length && !selectedPageId) {
        setSelectedPageId(body.pages[0].id);
      }
    } catch (err) {
      console.error('Failed to load Facebook pages', err);
      setError('Unable to load Facebook Pages. Ensure Facebook is connected.');
    } finally {
      setPagesLoading(false);
    }
  }, [account.id, apiClient, selectedPageId, token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (authStatus === 'success') {
      setSuccess(authMessage || 'Facebook authorization completed. Select a Page to finish setup.');
      void loadPages();
      void loadStatus();
    } else if (authStatus === 'error') {
      setError(authMessage || 'Facebook authorization failed.');
    }
  }, [authMessage, authStatus, loadPages, loadStatus]);

  const hasPendingChanges = useMemo(
    () =>
      facebookAppId.trim().length > 0 || facebookAppSecret.trim().length > 0 || clearCredentials,
    [clearCredentials, facebookAppId, facebookAppSecret],
  );

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
      } catch (err) {
        console.error('Failed to save Facebook settings', err);
        setError('Unable to save Facebook settings. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      account,
      apiClient,
      clearCredentials,
      facebookAppId,
      facebookAppSecret,
      hasPendingChanges,
      onAccountUpdate,
    ],
  );

  const submitDisabled = saving || !hasPendingChanges;

  const handleConnect = useCallback(async () => {
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
  }, [account.id, apiClient, token]);

  const handleSavePage = useCallback(async () => {
    if (!token) {
      setError('You must be signed in to connect Facebook.');
      return;
    }
    if (!selectedPageId) {
      setError('Select a Facebook Page to complete connection.');
      return;
    }
    const selected = pages.find((page) => page.id === selectedPageId);
    if (!selected) {
      setError('Selected Facebook Page is not available.');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      await saveAccountFacebookPage({
        client: apiClient,
        path: { accountId: account.id },
        body: { pageId: selected.id, pageName: selected.name },
        throwOnError: false,
      });
      setSuccess(`Connected to Facebook Page: ${selected.name}`);
      setPageConnected(true);
      setPageName(selected.name);
    } catch (err) {
      console.error('Failed to save Facebook Page selection', err);
      setError('Unable to save Facebook Page selection.');
    }
  }, [account.id, apiClient, pages, selectedPageId, token]);

  const handleDisconnect = useCallback(async () => {
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
      setPages([]);
      setSelectedPageId('');
      setSuccess('Facebook integration disconnected.');
    } catch (err) {
      console.error('Failed to disconnect Facebook', err);
      setError('Unable to disconnect Facebook.');
    }
  }, [account.id, apiClient, token]);

  return (
    <WidgetShell
      title="Facebook Integration"
      subtitle="Connect the Meta App credentials required for Instagram and Facebook posting."
      accent="info"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Alert severity="info">
            Facebook credentials power both Instagram publishing and future Facebook posting.
            Provide your Meta App ID and App Secret from the{' '}
            <Link
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Meta App Dashboard in a new tab"
              style={{ fontWeight: 600, color: '#1976d2', textDecoration: 'underline' }}
            >
              Meta App Dashboard
            </Link>
            . Secrets are stored server-side and never displayed.
            <br />
            <strong>Where to find values:</strong> Meta App Dashboard → Basic → App ID / App Secret.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Facebook App ID"
              value={facebookAppId}
              onChange={(event) => setFacebookAppId(event.target.value)}
              placeholder="123456789012345"
              helperText="Meta App Dashboard → Basic → App ID."
              fullWidth
              autoComplete="off"
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
            <Button type="submit" variant="contained" color="primary" disabled={submitDisabled}>
              {saving ? 'Saving…' : 'Save Facebook settings'}
            </Button>
          </Box>

          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Status:{' '}
              {statusLoading ? 'Loading…' : appConfigured ? 'App configured' : 'App not configured'}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={handleConnect}
                disabled={!appConfigured || statusLoading}
              >
                Connect Facebook
              </Button>
              <Button variant="text" onClick={loadStatus} disabled={statusLoading}>
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

            {appConfigured && !pageConnected && (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Select a Facebook Page to complete the connection after authorizing.
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="facebook-page-select-label">Facebook Page</InputLabel>
                  <Select
                    labelId="facebook-page-select-label"
                    value={selectedPageId}
                    label="Facebook Page"
                    onOpen={() => {
                      if (!pages.length) {
                        void loadPages();
                      }
                    }}
                    onChange={(event) => setSelectedPageId(event.target.value)}
                    disabled={pagesLoading}
                  >
                    {pages.map((page) => (
                      <MenuItem key={page.id} value={page.id}>
                        {page.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={handleSavePage}
                    disabled={!selectedPageId || pagesLoading}
                  >
                    Save Page
                  </Button>
                  <Button variant="text" onClick={loadPages} disabled={pagesLoading}>
                    Refresh Pages
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        </Stack>
      </form>
    </WidgetShell>
  );
};

export default FacebookIntegrationAdminWidget;
