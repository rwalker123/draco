import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: (refreshPage?: boolean) => void;
  fetchUser: () => Promise<void>;
  clearAllContexts: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwtToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      if (response.data.success && response.data.token) {
        setToken(response.data.token);
        localStorage.setItem('jwtToken', response.data.token);
        await fetchUser(response.data.token);
        setLoading(false);
        return true;
      } else {
        setError(response.data.message || 'Login failed');
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
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

  const fetchUser = async (overrideToken?: string) => {
    const authToken = overrideToken || token;
    if (!authToken) {
      setUser(null);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, fetchUser, clearAllContexts }}>
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