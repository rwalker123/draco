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
import type {
  AccountType,
  AccountSettingState,
  AccountInstagramSettingsType,
} from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

interface InstagramIntegrationAdminWidgetProps {
  account: AccountType;
  onAccountUpdate?: (account: AccountType) => void;
  syncToGallerySetting?: AccountSettingState;
  syncToGalleryUpdating?: boolean;
  onUpdateSyncToGallery?: (enabled: boolean) => Promise<void>;
}

export const InstagramIntegrationAdminWidget: React.FC<InstagramIntegrationAdminWidgetProps> = ({
  account,
  onAccountUpdate,
  syncToGallerySetting,
  syncToGalleryUpdating = false,
  onUpdateSyncToGallery,
}) => {
  const apiClient = useApiClient();

  const [instagramUserId, setInstagramUserId] = useState('');
  const [instagramUsername, setInstagramUsername] = useState(
    account.socials?.instagramHandle ?? '',
  );
  const [syncToGallery, setSyncToGallery] = useState(
    Boolean(syncToGallerySetting?.effectiveValue ?? syncToGallerySetting?.value ?? false),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setInstagramUsername(account.socials?.instagramHandle ?? '');
    setSyncToGallery(
      Boolean(syncToGallerySetting?.effectiveValue ?? syncToGallerySetting?.value ?? false),
    );
  }, [
    account.socials?.instagramHandle,
    syncToGallerySetting?.effectiveValue,
    syncToGallerySetting?.value,
  ]);

  const [clearCredentials, setClearCredentials] = useState(false);

  const hasPendingChanges = useMemo(() => {
    const normalizedHandle = (account.socials?.instagramHandle ?? '').trim();
    return (
      instagramUserId.trim().length > 0 ||
      instagramUsername.trim() !== normalizedHandle ||
      clearCredentials ||
      syncToGallery !== Boolean(syncToGallerySetting?.effectiveValue ?? syncToGallerySetting?.value)
    );
  }, [
    account.socials?.instagramHandle,
    clearCredentials,
    instagramUserId,
    instagramUsername,
    syncToGallery,
    syncToGallerySetting?.effectiveValue,
    syncToGallerySetting?.value,
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
        const payload: AccountInstagramSettingsType = {};
        const normalizedUserId = instagramUserId.trim();
        const normalizedUsername = instagramUsername.trim();
        const currentHandle = (account.socials?.instagramHandle ?? '').trim();

        if (normalizedUserId) {
          payload.instagramUserId = normalizedUserId;
        }

        if (normalizedUsername !== currentHandle) {
          payload.instagramUsername = normalizedUsername;
        }

        if (clearCredentials) {
          payload.instagramAppId = '';
          payload.instagramAppSecret = '';
        }

        if (Object.keys(payload).length > 0) {
          const result = await apiClient.put({
            url: `/api/accounts/${account.id}/instagram`,
            body: payload,
            throwOnError: false,
          });
          const updated = unwrapApiResult(
            result,
            'Unable to save Instagram settings',
          ) as AccountType;
          onAccountUpdate?.(updated);
        }

        if (
          syncToGallery !==
          Boolean(syncToGallerySetting?.effectiveValue ?? syncToGallerySetting?.value)
        ) {
          if (!onUpdateSyncToGallery) {
            throw new Error('Sync to gallery setting handler is not available.');
          }
          await onUpdateSyncToGallery(syncToGallery);
        }

        setSuccess('Instagram settings saved.');
        setInstagramUserId('');
        setClearCredentials(false);
      } catch (err) {
        console.error('Failed to save Instagram settings', err);
        setError('Unable to save Instagram settings. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      account.id,
      account.socials?.instagramHandle,
      apiClient,
      hasPendingChanges,
      instagramUserId,
      instagramUsername,
      onAccountUpdate,
      onUpdateSyncToGallery,
      syncToGallery,
      syncToGallerySetting?.effectiveValue,
      syncToGallerySetting?.value,
    ],
  );

  return (
    <WidgetShell
      title="Instagram Integration"
      subtitle="Store Instagram Business credentials and enable gallery sync."
      accent="info"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Alert severity="info">
            Instagram setup requires a Business/Creator account connected to a Facebook App. Provide
            the Business Instagram User ID and username; App credentials are configured in the
            Facebook Integration widget. Secrets are stored server-side and never shown.
            <br />
            <strong>Where to find values:</strong> Business Manager → Instagram Accounts → copy the
            Instagram User ID; Instagram username is your @ handle.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Instagram Business User ID"
              value={instagramUserId}
              onChange={(event) => setInstagramUserId(event.target.value)}
              placeholder="1789xxxxxxxxxxxx"
              helperText="From Meta Business Manager → Accounts → Instagram Accounts → Details → Instagram User ID."
              fullWidth
            />

            <TextField
              label="Instagram username"
              value={instagramUsername}
              onChange={(event) => setInstagramUsername(event.target.value)}
              placeholder="@draco"
              helperText="Public @username for the Instagram account."
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={syncToGallery}
                  onChange={(event) => setSyncToGallery(event.target.checked)}
                  disabled={saving || syncToGalleryUpdating}
                />
              }
              label="Sync new Instagram photos to the Photo Gallery"
            />
            <Typography variant="body2" color="text.secondary">
              When enabled, newly ingested Instagram media will be added to your Photo Gallery
              Instagram album.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={clearCredentials}
                  onChange={(event) => setClearCredentials(event.target.checked)}
                  disabled={saving}
                />
              }
              label="Clear stored Instagram tokens"
            />
            <Typography variant="body2" color="text.secondary">
              Use this to revoke existing Instagram access/refresh tokens. Tokens will be cleared
              server-side when you save.
            </Typography>
          </Stack>

          <Box display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving || syncToGalleryUpdating}
            >
              {saving ? 'Saving…' : 'Save Instagram settings'}
            </Button>
          </Box>
        </Stack>
      </form>
    </WidgetShell>
  );
};

export default InstagramIntegrationAdminWidget;
