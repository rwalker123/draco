'use client';
import { useMemo } from 'react';
import { createClient, createConfig } from '@draco/shared-api-client/generated/client';
import { useAuth } from '../context/AuthContext';

export const useApiClient = () => {
  const { token } = useAuth();

  const apiClient = useMemo(() => {
    return createClient(
      createConfig({
        auth: () => token || '',
        baseUrl: '',
      }),
    );
  }, [token]);

  return apiClient;
};
