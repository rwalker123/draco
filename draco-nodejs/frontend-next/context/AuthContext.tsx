'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SignInCredentialsType } from '@draco/shared-schemas';
import {
  login as loginApi,
  getAuthenticatedUser,
  logout as logoutApi,
} from '@draco/shared-api-client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult, getApiErrorMessage } from '../utils/apiResult';

const LOGIN_ERROR_MESSAGE =
  'Invalid username or password. If you forgot your password, click the "Forgot your password?" link to reset it.';

interface User {
  id: string;
  username: string;
  email?: string;
  firstname?: string;
  lastname?: string;
}

interface AuthenticatedUserDetails {
  id?: string;
  userId?: string;
  username?: string;
  userName?: string;
  email?: string | null;
  firstname?: string | null;
  firstName?: string | null;
  lastname?: string | null;
  lastName?: string | null;
}

type AuthenticatedUserResponse = AuthenticatedUserDetails & {
  user?: AuthenticatedUserDetails;
};

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  login: (creds: SignInCredentialsType) => Promise<boolean>;
  logout: (refreshPage?: boolean) => void;
  fetchUser: (overrideToken?: string) => Promise<void>;
  setAuthToken: (newToken: string) => void;
  clearAllContexts: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Initialize loading as false to prevent server/client hydration mismatch
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setInitialized(true);
    }
    // eslint-disable-next-line
  }, [token]);

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
      await fetchUser(newToken);
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

  const fetchUser = async (overrideToken?: string): Promise<void> => {
    const authToken = overrideToken || token;
    if (!authToken) {
      setUser(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Set loading true when fetching user data
    if (!overrideToken) {
      setLoading(true);
    }

    try {
      const client = createApiClient({ token: authToken });
      const result = await getAuthenticatedUser({
        client,
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load current user');

      const envelope = data as AuthenticatedUserResponse;
      const payload = envelope.user ?? envelope;

      if (payload && (payload.id || payload.userId)) {
        setUser({
          id: payload.id ?? payload.userId ?? '',
          username: payload.username ?? payload.userName ?? '',
          email: payload.email ?? undefined,
          firstname: payload.firstname ?? payload.firstName ?? undefined,
          lastname: payload.lastname ?? payload.lastName ?? undefined,
        });
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('jwtToken');
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to load current user');
      console.error('Failed to fetch authenticated user:', err);
      setError(message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwtToken');
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
