'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useParams } from 'next/navigation';
import { ACCOUNT_STORAGE_KEY } from './AccountContext';
import { RegisteredUserType, SignInCredentialsType } from '@draco/shared-schemas';
import {
  login as loginApi,
  getAuthenticatedUser,
  logout as logoutApi,
} from '@draco/shared-api-client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

const LOGIN_ERROR_MESSAGE =
  'Invalid username or password. If you forgot your password, click the "Forgot your password?" link to reset it.';

export interface AuthContextType {
  user: RegisteredUserType | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  login: (creds: SignInCredentialsType) => Promise<boolean>;
  logout: (refreshPage?: boolean) => void;
  fetchUser: (overrideToken?: string, accountIdOverride?: string | null) => Promise<void>;
  setAuthToken: (newToken: string) => void;
  clearAllContexts: () => void;
  accountIdFromPath: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<RegisteredUserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Initialize loading as false to prevent server/client hydration mismatch
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAccountId, setLastFetchedAccountId] = useState<string | null>(null);
  const params = useParams<{ accountId?: string | string[] }>();
  const accountIdFromPath = params?.accountId
    ? Array.isArray(params.accountId)
      ? params.accountId[0]
      : params.accountId
    : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoading(true); // Set loading when we start checking localStorage
      const storedToken = localStorage.getItem('jwtToken');
      setToken(storedToken);
      // If no token, set loading to false immediately
      if (!storedToken) {
        setLoading(false);
        setInitialized(true);
      }
      // If there is a token, loading will be set to false by fetchUser
    } else {
      setInitialized(true);
    }
  }, []);

  const resolvePersistedAccountId = useCallback((): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as { id?: string | null } | null;
      return parsed && typeof parsed.id === 'string' ? parsed.id : null;
    } catch {
      return null;
    }
  }, []);

  const resolveAccountId = useCallback(
    (accountIdOverride?: string | null) => {
      if (accountIdOverride !== undefined) {
        return accountIdOverride;
      }

      if (accountIdFromPath) {
        return accountIdFromPath;
      }

      return resolvePersistedAccountId();
    },
    [accountIdFromPath, resolvePersistedAccountId],
  );

  useEffect(() => {
    if (token) {
      const effectiveAccountId = resolveAccountId();

      if (lastFetchedAccountId !== effectiveAccountId) {
        fetchUser(undefined, effectiveAccountId);
      } else {
        fetchUser();
      }
    } else {
      setUser(null);
      setInitialized(true);
      setLastFetchedAccountId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, accountIdFromPath, resolveAccountId]);

  const login = async (creds: SignInCredentialsType) => {
    setLoading(true);
    setError(null);
    try {
      const client = createApiClient();
      const result = await loginApi({
        client,
        body: {
          userName: creds.userName,
          password: creds.password,
          ...(accountIdFromPath ? { accountId: accountIdFromPath } : {}),
        },
        throwOnError: false,
      });

      const loginResponse = unwrapApiResult(result, LOGIN_ERROR_MESSAGE);

      const newToken = loginResponse.token;

      if (!newToken) {
        setError(LOGIN_ERROR_MESSAGE);
        setLoading(false);
        return false;
      }

      setToken(newToken);
      localStorage.setItem('jwtToken', newToken);
      setUser(loginResponse as RegisteredUserType);
      setLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : LOGIN_ERROR_MESSAGE;
      setError(message || LOGIN_ERROR_MESSAGE);
      setLoading(false);
      return false;
    }
  };

  const logout = (refreshPage: boolean = false) => {
    const authToken = token;
    if (authToken) {
      const client = createApiClient({ token: authToken });
      logoutApi({ client, throwOnError: false }).catch(() => undefined);
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem('jwtToken');
    setInitialized(true);

    if (refreshPage) {
      // Refresh the current page to update all components and access controls
      window.location.reload();
    }
  };

  const clearAllContexts = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('jwtToken');
    setInitialized(true);
  };

  const setAuthToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('jwtToken', newToken);
  };

  const fetchUser = async (
    overrideToken?: string,
    accountIdOverride?: string | null,
  ): Promise<void> => {
    const authToken = overrideToken || token;
    if (!authToken) {
      setUser(null);
      setLoading(false);
      setInitialized(true);
      setLastFetchedAccountId(null);
      return;
    }

    // Set loading true when fetching user data
    if (!overrideToken) {
      setLoading(true);
    }

    const effectiveAccountId = resolveAccountId(accountIdOverride);

    try {
      const client = createApiClient({ token: authToken });
      const result = await getAuthenticatedUser({
        client,
        query: {
          accountId: effectiveAccountId || undefined,
        },
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load current user');

      setUser(payload as RegisteredUserType);
      setLastFetchedAccountId(effectiveAccountId ?? null);
    } catch {
      //const message = getApiErrorMessage(err, 'Failed to load current user');
      //console.error('Failed to fetch authenticated user:', err);
      //setError(message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwtToken');
      setLastFetchedAccountId(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initialized,
        error,
        login,
        logout,
        fetchUser,
        setAuthToken,
        clearAllContexts,
        accountIdFromPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
