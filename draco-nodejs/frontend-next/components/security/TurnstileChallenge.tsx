'use client';

import React from 'react';
import { Box, Alert, Button } from '@mui/material';

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileWidgetHandle = string | null;

interface TurnstileChallengeProps {
  onTokenChange: (token: string | null) => void;
  resetSignal?: number;
  size?: 'normal' | 'compact';
  theme?: 'auto' | 'light' | 'dark';
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const TurnstileChallenge: React.FC<TurnstileChallengeProps> = ({
  onTokenChange,
  resetSignal = 0,
  size = 'normal',
  theme = 'light',
  loading = false,
  error = null,
  onRetry,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<TurnstileWidgetHandle>(null);
  const onTokenChangeRef = React.useRef(onTokenChange);

  React.useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  React.useEffect(() => {
    onTokenChangeRef.current(null);

    if (!SITE_KEY) {
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) {
        return;
      }

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        size,
        theme,
        callback: (token: string) => {
          onTokenChangeRef.current(token);
        },
        'expired-callback': () => {
          onTokenChangeRef.current(null);
        },
        'error-callback': () => {
          onTokenChangeRef.current(null);
        },
        'timeout-callback': () => {
          onTokenChangeRef.current(null);
        },
      });
    };

    const handleScriptLoad = () => {
      renderWidget();
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener('load', handleScriptLoad);
      }
    } else {
      const script = document.createElement('script');
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleScriptLoad);
      document.body.appendChild(script);
    }

    return () => {
      const script = document.getElementById(TURNSTILE_SCRIPT_ID);
      script?.removeEventListener('load', handleScriptLoad);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [resetSignal, size, theme]);

  if (!SITE_KEY) {
    return (
      <Alert severity="warning">
        Human verification is not configured. Please set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
      </Alert>
    );
  }

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry} disabled={loading}>
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      )}
      <Box ref={containerRef} sx={{ minHeight: size === 'compact' ? 68 : 80 }} />
    </Box>
  );
};

export default TurnstileChallenge;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          size?: 'normal' | 'compact';
          theme?: 'auto' | 'light' | 'dark';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}
