'use client';

import React, { useEffect, useState, Suspense } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ValidateSuccessResponse {
  rid: string;
  client_name: string;
  scopes_human: string[];
}

interface RedirectResponse {
  redirect_to: string;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

type ValidateResponse = ValidateSuccessResponse | RedirectResponse | ErrorResponse;

interface DecisionResponse {
  redirect_to?: string;
  error?: string;
  error_description?: string;
}

interface OAuthErrorStateProps {
  error: string;
  errorDescription?: string;
}

function OAuthErrorState({ error, errorDescription }: OAuthErrorStateProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 480 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Authorization request failed
          </Typography>
          <Alert severity="error">{errorDescription ?? 'Unknown error'}</Alert>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {error}
          </Typography>
          <MuiLink component={NextLink} href="/" underline="hover">
            Return to Draco
          </MuiLink>
        </Stack>
      </Paper>
    </Box>
  );
}

function OAuthAuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, initialized: authInitialized, loading: authLoading } = useAuth();

  const [validateResult, setValidateResult] = useState<ValidateSuccessResponse | null>(null);
  const [validateError, setValidateError] = useState<{
    error: string;
    error_description?: string;
  } | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<{
    error: string;
    error_description?: string;
  } | null>(null);

  const response_type = searchParams.get('response_type') ?? '';
  const client_id = searchParams.get('client_id') ?? '';
  const redirect_uri = searchParams.get('redirect_uri') ?? '';
  const scope = searchParams.get('scope') ?? '';
  const state = searchParams.get('state') ?? undefined;
  const code_challenge = searchParams.get('code_challenge') ?? '';
  const code_challenge_method = searchParams.get('code_challenge_method') ?? '';
  const resource = searchParams.get('resource') ?? undefined;

  useEffect(() => {
    if (!authInitialized || authLoading) return;

    if (!user || !token) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?next=${next}`);
      return;
    }

    const controller = new AbortController();

    const runValidate = async () => {
      setValidateLoading(true);
      setValidateError(null);

      try {
        const body: Record<string, string | undefined> = {
          response_type,
          client_id,
          redirect_uri,
          scope,
          code_challenge,
          code_challenge_method,
        };
        if (state !== undefined) body.state = state;
        if (resource !== undefined) body.resource = resource;

        const response = await fetch('/api/oauth/authorize/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const data = (await response.json()) as ValidateResponse;

        if (controller.signal.aborted) return;

        if (!response.ok) {
          const err = data as ErrorResponse;
          setValidateError({ error: err.error, error_description: err.error_description });
          return;
        }

        if ('redirect_to' in data) {
          window.location.replace((data as RedirectResponse).redirect_to);
          return;
        }

        setValidateResult(data as ValidateSuccessResponse);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setValidateError({
          error: 'request_failed',
          error_description:
            err instanceof Error ? err.message : 'Failed to validate authorization request',
        });
      } finally {
        if (!controller.signal.aborted) {
          setValidateLoading(false);
        }
      }
    };

    void runValidate();

    return () => {
      controller.abort();
    };
  }, [
    authInitialized,
    authLoading,
    user,
    token,
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    resource,
    router,
  ]);

  const handleDecision = async (decision: 'approve' | 'deny') => {
    if (!validateResult) return;

    setDecisionLoading(true);
    setDecisionError(null);

    try {
      const response = await fetch('/api/oauth/authorize/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rid: validateResult.rid, decision }),
      });

      const data = (await response.json()) as DecisionResponse;

      if (!response.ok) {
        setDecisionError({
          error: data.error ?? 'request_failed',
          error_description: data.error_description,
        });
        return;
      }

      if (data.redirect_to) {
        window.location.replace(data.redirect_to);
      }
    } catch (err: unknown) {
      setDecisionError({
        error: 'request_failed',
        error_description: err instanceof Error ? err.message : 'Failed to process your decision',
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  if (!authInitialized || authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !token) {
    return null;
  }

  if (validateLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Verifying request...</Typography>
      </Box>
    );
  }

  if (validateError) {
    return (
      <OAuthErrorState
        error={validateError.error}
        errorDescription={validateError.error_description}
      />
    );
  }

  if (decisionError) {
    return (
      <OAuthErrorState
        error={decisionError.error}
        errorDescription={decisionError.error_description}
      />
    );
  }

  if (!validateResult) {
    return null;
  }

  const displayName = user.contact?.email ?? user.contact?.loginEmail ?? user.userName;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 480 }}>
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {validateResult.client_name} wants to connect to your Draco account
          </Typography>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              This will let it read the following:
            </Typography>
            <List dense disablePadding>
              {validateResult.scopes_human.map((scope) => (
                <ListItem key={scope} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText primary={scope} slotProps={{ primary: { variant: 'body2' } }} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {validateResult.client_name} cannot make changes — this access is read-only.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={decisionLoading}
              onClick={() => handleDecision('approve')}
            >
              {decisionLoading ? <CircularProgress size={20} /> : 'Approve'}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              disabled={decisionLoading}
              onClick={() => handleDecision('deny')}
            >
              Deny
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Logged in as {displayName}.{' '}
            <MuiLink
              component={NextLink}
              href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/oauth/authorize')}`}
              underline="hover"
            >
              Not you?
            </MuiLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <OAuthAuthorizeContent />
    </Suspense>
  );
}
