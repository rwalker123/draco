'use client';
import { useAuth } from '../context/AuthContext';
import { createApiClient } from '../lib/apiClientFactory';

export const useApiClient = () => {
  const { token } = useAuth();

  // createApiClient caches by token, so this returns the same instance
  return createApiClient({ token: token || undefined });
};
