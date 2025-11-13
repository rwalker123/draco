'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';

const DiscordOAuthCallbackPageClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Finalizing your Discord link…');
  const redirectTimeoutRef = useRef<number | null>(null);

  const statusParam = searchParams.get('status');
  const messageParam = searchParams.get('message');

  useEffect(() => {
    if (statusParam === 'success') {
      setStatus('success');
      setMessage('Discord account linked successfully. Redirecting to your profile…');
      redirectTimeoutRef.current = window.setTimeout(() => {
        router.replace('/profile');
      }, 1500);

      return () => {
        if (redirectTimeoutRef.current) {
          window.clearTimeout(redirectTimeoutRef.current);
        }
      };
    }

    setStatus('error');
    setMessage(messageParam || 'Discord linking could not be completed.');
    return undefined;
  }, [messageParam, router, statusParam]);

  const showSpinner = status === 'pending';
  const isError = status === 'error';

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

          {isError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {message}
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
              {isError && (
                <Button fullWidth variant="outlined" onClick={() => router.push('/profile')}>
                  Try Again
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default DiscordOAuthCallbackPageClient;
