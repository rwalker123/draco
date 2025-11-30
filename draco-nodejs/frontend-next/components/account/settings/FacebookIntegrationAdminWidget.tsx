'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Box, Button, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import type { AccountInstagramSettingsType, AccountType } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

interface FacebookIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
}

export const FacebookIntegrationAdminWidget: React.FC<FacebookIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
}) => {
  const apiClient = useApiClient();
  const [facebookAppId, setFacebookAppId] = useState('');
  const [facebookAppSecret, setFacebookAppSecret] = useState('');
  const [clearCredentials, setClearCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        const payload: AccountInstagramSettingsType = {};
        const normalizedAppId = facebookAppId.trim();
        const normalizedAppSecret = facebookAppSecret.trim();

        if (clearCredentials) {
          payload.instagramAppId = '';
          payload.instagramAppSecret = '';
        } else {
          if (normalizedAppId) {
            payload.instagramAppId = normalizedAppId;
          }
          if (normalizedAppSecret) {
            payload.instagramAppSecret = normalizedAppSecret;
          }
        }

        if (Object.keys(payload).length > 0) {
          const result = await apiClient.put({
            url: `/api/accounts/${account.id}/instagram`,
            body: payload,
            throwOnError: false,
          });
          const updated = unwrapApiResult(
            result,
            'Unable to save Facebook settings',
          ) as AccountType;
          onAccountUpdate?.(updated);
        }

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
      account.id,
      apiClient,
      clearCredentials,
      facebookAppId,
      facebookAppSecret,
      hasPendingChanges,
      onAccountUpdate,
    ],
  );

  const submitDisabled = saving || !hasPendingChanges;

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
            Provide your Meta App ID and App Secret from the Meta App Dashboard. Secrets are stored
            server-side and never displayed.
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
        </Stack>
      </form>
    </WidgetShell>
  );
};

export default FacebookIntegrationAdminWidget;
