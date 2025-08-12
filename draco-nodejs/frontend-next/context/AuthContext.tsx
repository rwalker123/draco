'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email?: string;
  firstname?: string;
  lastname?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: (refreshPage?: boolean) => void;
  fetchUser: (overrideToken?: string) => Promise<void>;
  setAuthToken: (newToken: string) => void;
  clearAllContexts: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Initialize loading as true when in browser to wait for localStorage check
  const [loading, setLoading] = useState(typeof window !== 'undefined');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('jwtToken');
      setToken(storedToken);
      // Only set loading to false after we've checked localStorage
      if (!storedToken) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
    }
    // eslint-disable-next-line
  }, [token]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      if (response.data.success && response.data.token) {
        setToken(response.data.token);
        localStorage.setItem('jwtToken', response.data.token);
        await fetchUser(response.data.token);
        setLoading(false);
        return true;
      } else {
        setError(response.data.message || 'Sign in failed');
        setLoading(false);
        return false;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
      return false;
    }
  };

  const logout = (refreshPage: boolean = false) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwtToken');

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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
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
