'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { SignInCredentialsType } from '@draco/shared-schemas';

const LOGIN_ERROR_MESSAGE =
  'Invalid username or password. If you forgot your password, click the "Forgot your password?" link to reset it.';

interface User {
  id: string;
  username: string;
  email?: string;
  firstname?: string;
  lastname?: string;
}

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
      const response = await axios.post('/api/auth/login', {
        userName: creds.userName,
        password: creds.password,
      });
      if (response.data && response.data.token) {
        setToken(response.data.token);
        localStorage.setItem('jwtToken', response.data.token);
        await fetchUser(response.data.token);
        setLoading(false);
        return true;
      } else {
        setError(LOGIN_ERROR_MESSAGE);
        setLoading(false);
        return false;
      }
    } catch (err: unknown) {
      setError(LOGIN_ERROR_MESSAGE);
      setLoading(false);
      return false;
    }
  };

  const logout = (refreshPage: boolean = false) => {
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
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
        // Clear invalid token
        setToken(null);
        localStorage.removeItem('jwtToken');
      }
    } catch {
      setUser(null);
      // Clear invalid token
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
