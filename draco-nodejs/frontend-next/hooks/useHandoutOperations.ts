'use client';

import { useState, useEffect, useRef } from 'react';
import { HandoutType } from '@draco/shared-schemas';
import { HandoutInput, HandoutService } from '../services/handoutService';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';

export type HandoutScope =
  | {
      type: 'account';
      accountId: string;
    }
  | {
      type: 'team';
      accountId: string;
      teamId: string;
    };

export function useHandoutOperations(scope: HandoutScope) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const serviceRef = useRef<HandoutService | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      serviceRef.current = new HandoutService(token, apiClient);
    } else {
      serviceRef.current = null;
    }
  }, [token, apiClient]);
  const [error, setError] = useState<string | null>(null);

  const listHandouts = async (): Promise<HandoutType[]> => {
    const service = serviceRef.current;
    if (!service) return [];

    if (scope.type === 'team') {
      return service.listTeamHandouts({ accountId: scope.accountId, teamId: scope.teamId });
    }

    return service.listAccountHandouts(scope.accountId);
  };

  const createHandout = async (input: HandoutInput): Promise<HandoutType> => {
    const service = serviceRef.current;
    if (!service) throw new Error('Service not initialized');

    setLoading(true);
    setError(null);

    try {
      if (scope.type === 'team') {
        return await service.createTeamHandout(
          { accountId: scope.accountId, teamId: scope.teamId },
          input,
        );
      }

      return await service.createAccountHandout(scope.accountId, input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create handout';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateHandout = async (handoutId: string, input: HandoutInput): Promise<HandoutType> => {
    const service = serviceRef.current;
    if (!service) throw new Error('Service not initialized');

    setLoading(true);
    setError(null);

    try {
      if (scope.type === 'team') {
        return await service.updateTeamHandout(
          { accountId: scope.accountId, teamId: scope.teamId },
          handoutId,
          input,
        );
      }

      return await service.updateAccountHandout(scope.accountId, handoutId, input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update handout';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteHandout = async (handoutId: string): Promise<void> => {
    const service = serviceRef.current;
    if (!service) throw new Error('Service not initialized');

    setLoading(true);
    setError(null);

    try {
      if (scope.type === 'team') {
        await service.deleteTeamHandout(
          { accountId: scope.accountId, teamId: scope.teamId },
          handoutId,
        );
      } else {
        await service.deleteAccountHandout(scope.accountId, handoutId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete handout';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    listHandouts,
    createHandout,
    updateHandout,
    deleteHandout,
    loading,
    error,
    clearError,
  };
}
