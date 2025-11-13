'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import type { DiscordLinkStatusType } from '@draco/shared-schemas';
import { useDiscordIntegration } from '@/hooks/useDiscordIntegration';
import WidgetShell from '@/components/ui/WidgetShell';

interface DiscordIntegrationCardProps {
  accountId: string | null;
}

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not yet synced';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not yet synced';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const DiscordIntegrationCard: React.FC<DiscordIntegrationCardProps> = ({ accountId }) => {
  const { getLinkStatus, startLink, unlinkDiscord } = useDiscordIntegration();
  const [status, setStatus] = useState<DiscordLinkStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'connect' | 'unlink' | 'refresh' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLinked = Boolean(status?.linked);
  const disableActions = !accountId || action !== null;

  const loadStatus = useCallback(async () => {
    if (!accountId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await getLinkStatus(accountId);
      setStatus(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while loading Discord status.';
      setError(message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, getLinkStatus]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setAction('connect');
    setError(null);

    try {
      const { authorizationUrl } = await startLink(accountId);
      window.location.href = authorizationUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to start the Discord linking process.';
      setError(message);
    } finally {
      setAction(null);
    }
  }, [accountId, startLink]);

  const handleUnlink = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setAction('unlink');
    setError(null);

    try {
      const payload = await unlinkDiscord(accountId);
      setStatus(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to unlink the Discord account.';
      setError(message);
    } finally {
      setAction(null);
    }
  }, [accountId, unlinkDiscord]);

  const handleRefresh = useCallback(async () => {
    setAction('refresh');
    try {
      await loadStatus();
    } finally {
      setAction(null);
    }
  }, [loadStatus]);

  const displayName = useMemo(() => {
    if (!status?.username) {
      return null;
    }

    return status.discriminator ? `${status.username}#${status.discriminator}` : status.username;
  }, [status]);

  if (!accountId) {
    return (
      <WidgetShell
        title="Discord Connection"
        subtitle="Select an organization to manage Discord chat access."
        accent="info"
      >
        <Alert severity="info">
          Select an organization to manage Discord connections for your profile.
        </Alert>
      </WidgetShell>
    );
  }

  const linkingEnabled = status?.linkingEnabled ?? false;
  if (!linkingEnabled) {
    return null;
  }

  return (
    <WidgetShell
      title="Discord Connection"
      subtitle="Link your Discord identity to access live chat and announcements."
      accent={isLinked ? 'success' : 'info'}
    >
      <Stack spacing={2}>
        <Box display="flex" justifyContent="flex-end">
          <Chip
            label={isLinked ? 'Connected' : 'Not Connected'}
            color={isLinked ? 'success' : 'default'}
            size="small"
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {isLinked
                ? 'Your Discord identity is connected to this organization.'
                : 'Connect your Discord account to join live chat, receive announcements, and access exclusive channels.'}
            </Typography>

            {isLinked && (
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Connected as
                </Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  {displayName ?? 'Discord user'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last synced: {formatTimestamp(status?.lastSyncedAt)}
                </Typography>
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              {isLinked ? (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleUnlink}
                    disabled={disableActions}
                    startIcon={action === 'unlink' ? <CircularProgress size={16} /> : undefined}
                  >
                    Unlink Discord
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleRefresh}
                    disabled={disableActions}
                    startIcon={action === 'refresh' ? <CircularProgress size={16} /> : undefined}
                  >
                    Refresh Status
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={disableActions}
                    startIcon={action === 'connect' ? <CircularProgress size={16} /> : undefined}
                  >
                    Connect Discord
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleRefresh}
                    disabled={disableActions}
                    startIcon={action === 'refresh' ? <CircularProgress size={16} /> : undefined}
                  >
                    Refresh Status
                  </Button>
                </>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </WidgetShell>
  );
};

export default DiscordIntegrationCard;
