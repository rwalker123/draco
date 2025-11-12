'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useDiscordIntegration } from '@/hooks/useDiscordIntegration';
import { DISCORD_LINK_ACCOUNT_STORAGE_KEY } from '@/constants/storageKeys';

const DiscordOAuthCallbackPageClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeLink } = useDiscordIntegration();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Finalizing your Discord link…');
  const [error, setError] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const accountIdParam = searchParams.get('accountId');

  useEffect(() => {
    let cancelled = false;

    const finishWithError = (details: string) => {
      if (cancelled) {
        return;
      }
      setStatus('error');
      setError(details);
      setMessage('Discord linking could not be completed.');
    };

    if (oauthError) {
      finishWithError('Discord authorization was cancelled or denied. Please try again.');
      return () => {
        cancelled = true;
        if (redirectTimeoutRef.current) {
          window.clearTimeout(redirectTimeoutRef.current);
        }
      };
    }

    if (!code || !state) {
      finishWithError('Missing authorization details from Discord. Please restart the process.');
      return () => {
        cancelled = true;
        if (redirectTimeoutRef.current) {
          window.clearTimeout(redirectTimeoutRef.current);
        }
      };
    }

    const complete = async () => {
      const storedAccountId =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem(DISCORD_LINK_ACCOUNT_STORAGE_KEY)
          : null;
      const accountId = accountIdParam ?? storedAccountId;

      if (!accountId) {
        finishWithError('Unable to determine which organization initiated the Discord link.');
        return;
      }

      if (storedAccountId) {
        window.sessionStorage.removeItem(DISCORD_LINK_ACCOUNT_STORAGE_KEY);
      }

      try {
        await completeLink(accountId, { code, state });
        if (cancelled) {
          return;
        }
        setStatus('success');
        setError(null);
        setMessage('Discord account linked successfully. Redirecting to your profile…');
        redirectTimeoutRef.current = window.setTimeout(() => {
          router.replace('/profile');
        }, 1500);
      } catch (err) {
        const details =
          err instanceof Error ? err.message : 'Failed to complete Discord linking. Please retry.';
        finishWithError(details);
      }
    };

    void complete();

    return () => {
      cancelled = true;
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [accountIdParam, code, state, oauthError, completeLink, router]);

  const showSpinner = status === 'pending';

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 480 }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Discord Linking
          </Typography>

          {showSpinner && <CircularProgress size={32} />}

          <Typography align="center" color="text.secondary">
            {message}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          {status !== 'pending' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => router.push('/profile')}
              >
                Return to Profile
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push('/profile')}
                disabled={status === 'success'}
              >
                Try Again
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default DiscordOAuthCallbackPageClient;
