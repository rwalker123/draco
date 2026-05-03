'use client';

import { useState } from 'react';

interface UseApiOperationResult<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useApiOperation = <TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
): UseApiOperationResult<TArgs, TResult> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: TArgs): Promise<TResult> => {
    setLoading(true);
    setError(null);
    try {
      return await operation(...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { execute, loading, error, clearError };
};
