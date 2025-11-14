'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { AccountType, TeamSeasonType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { useYouTubeChannelAdmin } from '@/hooks/useYouTubeChannelAdmin';

interface BasePanelProps {
  context: 'account' | 'team';
  accountId: string;
  currentChannelId?: string | null;
  title: string;
  subtitle?: string;
  description?: React.ReactNode;
}

interface AccountPanelProps extends BasePanelProps {
  context: 'account';
  onAccountUpdated?: (account: AccountType) => void;
}

interface TeamPanelProps extends BasePanelProps {
  context: 'team';
  seasonId: string;
  teamSeasonId: string;
  onTeamSeasonUpdated?: (teamSeason: TeamSeasonType) => void;
}

export type YouTubeChannelAdminPanelProps = AccountPanelProps | TeamPanelProps;

const isChannelId = (value: string) => /^UC[0-9A-Za-z_-]{22}$/.test(value);

const extractChannelId = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error('Enter the channel ID or a URL that includes it.');
  }

  if (isChannelId(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const channelIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === 'channel');
    if (channelIndex >= 0 && channelIndex + 1 < pathSegments.length) {
      const candidate = pathSegments[channelIndex + 1];
      if (isChannelId(candidate)) {
        return candidate;
      }
    }

    const queryChannelId = url.searchParams.get('channelId');
    if (queryChannelId && isChannelId(queryChannelId)) {
      return queryChannelId;
    }
  } catch (error) {
    // Not a valid URL, fall through to general matching
  }

  const fallback = trimmed.match(/UC[0-9A-Za-z_-]{22}/);
  if (fallback) {
    return fallback[0];
  }

  throw new Error('Unable to parse the channel ID. Use the 24-character ID that begins with "UC".');
};

const YouTubeChannelAdminPanel: React.FC<YouTubeChannelAdminPanelProps> = (props) => {
  const { context, accountId, currentChannelId, title, subtitle, description } = props;

  const hookOptions =
    context === 'account'
      ? { context, accountId }
      : { context, accountId, seasonId: props.seasonId, teamSeasonId: props.teamSeasonId };

  const { saveChannel, loading, error, clearError } = useYouTubeChannelAdmin(hookOptions);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(currentChannelId ?? '');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!dialogOpen) {
      setInputValue(currentChannelId ?? '');
      setFormError(null);
      clearError();
    }
  }, [dialogOpen, currentChannelId, clearError]);

  const handleOpenDialog = React.useCallback(() => {
    setDialogOpen(true);
    setFormError(null);
    clearError();
  }, [clearError]);

  const handleCloseDialog = React.useCallback(() => {
    if (loading) {
      return;
    }
    setDialogOpen(false);
    setFormError(null);
    clearError();
  }, [clearError, loading]);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedValue = inputValue.trim();
      let normalized: string | null = null;

      if (trimmedValue) {
        try {
          normalized = extractChannelId(trimmedValue);
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Invalid YouTube channel input.');
          return;
        }
      }

      try {
        const result = await saveChannel(normalized);
        if (result.context === 'account') {
          props.context === 'account' && props.onAccountUpdated?.(result.account);
        } else {
          props.context === 'team' && props.onTeamSeasonUpdated?.(result.teamSeason);
        }

        setSuccessMessage(
          normalized
            ? 'YouTube channel saved. Social videos will start appearing shortly.'
            : 'The YouTube channel has been disconnected.',
        );
        setDialogOpen(false);
        setFormError(null);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to save the YouTube channel.');
      }
    },
    [inputValue, props, saveChannel],
  );

  const handleRemove = React.useCallback(async () => {
    try {
      const result = await saveChannel(null);
      if (result.context === 'account') {
        props.context === 'account' && props.onAccountUpdated?.(result.account);
      } else {
        props.context === 'team' && props.onTeamSeasonUpdated?.(result.teamSeason);
      }

      setSuccessMessage('The YouTube channel has been disconnected.');
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to remove the YouTube channel.');
    }
  }, [props, saveChannel]);

  const channelLink =
    currentChannelId && isChannelId(currentChannelId)
      ? `https://www.youtube.com/channel/${currentChannelId}`
      : null;

  const showRemoveButton = Boolean(currentChannelId);

  return (
    <WidgetShell title={title} subtitle={subtitle} accent="info">
      <Stack spacing={3}>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}

        {successMessage ? (
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2">Configured Channel</Typography>
            {currentChannelId ? (
              channelLink ? (
                <MuiLink href={channelLink} target="_blank" rel="noreferrer">
                  {currentChannelId}
                </MuiLink>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {currentChannelId}
                </Typography>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">
                Not configured
              </Typography>
            )}
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button variant="contained" onClick={handleOpenDialog} disabled={loading}>
              Configure
            </Button>
            {showRemoveButton ? (
              <Button variant="outlined" color="error" onClick={handleRemove} disabled={loading}>
                Remove
              </Button>
            ) : null}
          </Stack>
        </Box>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <form onSubmit={handleSubmit}>
            <DialogTitle>Configure YouTube Channel</DialogTitle>
            <DialogContent dividers>
              {formError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              ) : null}
              {error && !formError ? (
                <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                  {error}
                </Alert>
              ) : null}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Paste the 24-character channel ID (starts with <code>UC</code>) or a full YouTube
                channel URL that includes it. We currently support standard channel IDs.
              </Typography>
              <TextField
                fullWidth
                label="YouTube Channel ID"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                helperText="Leave blank to disconnect the channel."
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={18} /> : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Stack>
    </WidgetShell>
  );
};

export default YouTubeChannelAdminPanel;
