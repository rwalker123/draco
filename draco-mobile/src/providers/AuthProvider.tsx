import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { AuthSession, LoginPayload } from '../types/auth';
import { login as loginRequest, refresh as refreshRequest } from '../services/auth/authApi';
import {
  clearSession as clearStoredSession,
  loadSession,
  saveSession,
  type StoredAuthSession
} from '../storage/authStorage';

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  error: string | null;
};

const REFRESH_INTERVAL_MS = 1000 * 60 * 30; // 30 minutes

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const persistSession = useCallback(async (next: AuthSession) => {
    await saveSession(next);
    setSession(next);
    setStatus('authenticated');
    setError(null);
  }, []);

  const hydrateSession = useCallback(async () => {
    setStatus('loading');
    const stored = await loadSession();

    if (!stored) {
      setStatus('unauthenticated');
      setSession(null);
      clearRefreshTimer();
      setError(null);
      return;
    }

    const restoredSession = extractAuthSession(stored);
    setSession(restoredSession);
    setStatus('authenticated');
    setError(null);
  }, [clearRefreshTimer]);

  useEffect(() => {
    void hydrateSession();
    return clearRefreshTimer;
  }, [clearRefreshTimer, hydrateSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setError(null);
      setStatus('loading');
      try {
        const result = await loginRequest(payload);
        await persistSession(result);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Login failed.';
        setError(message);
        setStatus('unauthenticated');
        throw requestError;
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    clearRefreshTimer();
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
    await clearStoredSession();
  }, [clearRefreshTimer]);

  const refreshSession = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      const refreshed = await refreshRequest(session.token);
      await persistSession(refreshed);
    } catch {
      await logout();
    }
  }, [logout, persistSession, session]);

  useEffect(() => {
    clearRefreshTimer();
    if (status !== 'authenticated' || !session) {
      return;
    }

    refreshTimer.current = setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return clearRefreshTimer;
  }, [clearRefreshTimer, refreshSession, session, status]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, login, logout, refreshSession, error }),
    [error, login, logout, refreshSession, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function extractAuthSession(stored: StoredAuthSession): AuthSession {
  return {
    token: stored.token,
    user: stored.user
  };
}
