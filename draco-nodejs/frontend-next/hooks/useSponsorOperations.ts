'use client';

import { useCallback, useMemo, useState } from 'react';
import { SponsorType } from '@draco/shared-schemas';
import { SponsorInput, SponsorService } from '../services/sponsorService';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';

export type SponsorScope =
  | {
      type: 'account';
      accountId: string;
    }
  | {
      type: 'team';
      accountId: string;
      seasonId: string;
      teamSeasonId: string;
    };

export interface SponsorFormValues extends SponsorInput {}

export function useSponsorOperations(scope: SponsorScope) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const service = useMemo(() => new SponsorService(token, apiClient), [token, apiClient]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listSponsors = useCallback(async (): Promise<SponsorType[]> => {
    if (scope.type === 'account') {
      return service.listAccountSponsors(scope.accountId);
    }

    return service.listTeamSponsors(scope.accountId, scope.seasonId, scope.teamSeasonId);
  }, [scope, service]);

  const createSponsor = useCallback(
    async (input: SponsorFormValues): Promise<SponsorType> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'account') {
          return await service.createAccountSponsor(scope.accountId, input);
        }

        return await service.createTeamSponsor(
          scope.accountId,
          scope.seasonId,
          scope.teamSeasonId,
          input,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create sponsor';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const updateSponsor = useCallback(
    async (sponsorId: string, input: SponsorFormValues): Promise<SponsorType> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'account') {
          return await service.updateAccountSponsor(scope.accountId, sponsorId, input);
        }

        return await service.updateTeamSponsor(
          scope.accountId,
          scope.seasonId,
          scope.teamSeasonId,
          sponsorId,
          input,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update sponsor';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const deleteSponsor = useCallback(
    async (sponsorId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'account') {
          await service.deleteAccountSponsor(scope.accountId, sponsorId);
        } else {
          await service.deleteTeamSponsor(
            scope.accountId,
            scope.seasonId,
            scope.teamSeasonId,
            sponsorId,
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete sponsor';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    listSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    loading,
    error,
    clearError,
  };
}
