'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { getAccountFacebookStatus, updateAccount } from '@draco/shared-api-client';
import { AccountSchema, type AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { useAuth } from '@/context/AuthContext';

interface FacebookFanPageWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

export const FacebookFanPageWidget: React.FC<FacebookFanPageWidgetProps> = ({
  account,
  onAccountUpdate,
}) => {
  const apiClient = useApiClient();
  const { token } = useAuth();

  const [pageUrl, setPageUrl] = useState(account.socials?.facebookFanPage ?? '');
  const [pageConnected, setPageConnected] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setPageUrl(account.socials?.facebookFanPage ?? '');
  }, [account.socials?.facebookFanPage]);

  const loadStatus = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setLoadingStatus(true);
      const response = await getAccountFacebookStatus({
        client: apiClient,
        path: { accountId: account.id },
        throwOnError: false,
      });
      const body = unwrapApiResult<{
        appConfigured: boolean;
        pageConnected: boolean;
      }>(response, 'Unable to load Facebook connection status.');
      setPageConnected(Boolean(body.pageConnected));
    } catch (err) {
      console.error('Failed to load Facebook connection status', err);
      setError('Unable to load Facebook connection status.');
    } finally {
      setLoadingStatus(false);
    }
  }, [account.id, apiClient, token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const hasChanges = useMemo(() => {
    const current = (account.socials?.facebookFanPage ?? '').trim();
    return pageUrl.trim() !== current;
  }, [account.socials?.facebookFanPage, pageUrl]);

  const handleSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (!pageConnected) {
        setError('Connect Facebook before adding a Page link.');
        return;
      }

      const raw = pageUrl.trim();
      const strippedHandle = raw.replace(/^@+/, '');

      const payloadValue =
        strippedHandle.length === 0
          ? null
          : /^https?:\/\//i.test(strippedHandle)
            ? strippedHandle
            : `https://www.facebook.com/${strippedHandle}`;

      setSaving(true);
      try {
        const result = await updateAccount({
          client: apiClient,
          path: { accountId: account.id },
          body: {
            socials: { facebookFanPage: payloadValue ?? undefined },
          },
          throwOnError: false,
        });
        const updated = AccountSchema.parse(
          unwrapApiResult(result, 'Unable to save Facebook Page URL.'),
        );
        onAccountUpdate?.(updated);
        setSuccess(payloadValue ? 'Facebook Page saved.' : 'Facebook Page removed.');
      } catch (err) {
        console.error('Failed to save Facebook Page URL', err);
        setError('Unable to save Facebook Page URL.');
      } finally {
        setSaving(false);
      }
    },
    [account.id, apiClient, onAccountUpdate, pageConnected, pageUrl],
  );

  return (
    <WidgetShell
      title="Facebook Page"
      subtitle="Surface your official Facebook Page link once Facebook is connected."
      accent="info"
    >
      <form onSubmit={handleSave}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Add your Facebook Page URL or handle to feature it across your public pages. This field
            is enabled after you connect a Facebook Page.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {!pageConnected && (
            <Alert severity="info">Connect a Facebook Page above to edit this setting.</Alert>
          )}

          <TextField
            label="Facebook Page URL or handle"
            value={pageUrl}
            onChange={(event) => setPageUrl(event.target.value)}
            placeholder="https://www.facebook.com/YourLeague or YourLeague"
            fullWidth
            disabled={saving || !pageConnected || loadingStatus}
          />

          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="text"
              onClick={() => {
                setPageUrl(account.socials?.facebookFanPage ?? '');
                setError(null);
                setSuccess(null);
              }}
              disabled={saving || (!hasChanges && !error && !success)}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || !hasChanges || !pageConnected || loadingStatus}
            >
              {saving ? 'Saving…' : 'Save Page Link'}
            </Button>
          </Box>
        </Stack>
      </form>
    </WidgetShell>
  );
};

export default FacebookFanPageWidget;
