'use client';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { createApiClient } from '../lib/apiClientFactory';

export const useApiClient = () => {
  const { token } = useAuth();

  const apiClient = useMemo(() => {
    return createApiClient({
      token: token || undefined,
    });
  }, [token]);

  return apiClient;
};
