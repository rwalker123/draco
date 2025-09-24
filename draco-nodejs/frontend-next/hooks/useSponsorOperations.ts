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
  const { type, accountId } = scope;
  const seasonId = scope.type === 'team' ? scope.seasonId : null;
  const teamSeasonId = scope.type === 'team' ? scope.teamSeasonId : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listSponsors = useCallback(async (): Promise<SponsorType[]> => {
    if (type === 'account') {
      return service.listAccountSponsors(accountId);
    }

    if (!seasonId || !teamSeasonId) {
      throw new Error('Team scope identifiers are missing');
    }

    return service.listTeamSponsors(accountId, seasonId, teamSeasonId);
  }, [type, accountId, seasonId, teamSeasonId, service]);

  const createSponsor = useCallback(
    async (input: SponsorFormValues): Promise<SponsorType> => {
      setLoading(true);
      setError(null);

      try {
        if (type === 'account') {
          return await service.createAccountSponsor(accountId, input);
        }

        if (!seasonId || !teamSeasonId) {
          throw new Error('Team scope identifiers are missing');
        }

        return await service.createTeamSponsor(accountId, seasonId, teamSeasonId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create sponsor';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [type, accountId, seasonId, teamSeasonId, service],
  );

  const updateSponsor = useCallback(
    async (sponsorId: string, input: SponsorFormValues): Promise<SponsorType> => {
      setLoading(true);
      setError(null);

      try {
        if (type === 'account') {
          return await service.updateAccountSponsor(accountId, sponsorId, input);
        }

        if (!seasonId || !teamSeasonId) {
          throw new Error('Team scope identifiers are missing');
        }

        return await service.updateTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update sponsor';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [type, accountId, seasonId, teamSeasonId, service],
  );

  const deleteSponsor = useCallback(
    async (sponsorId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        if (type === 'account') {
          await service.deleteAccountSponsor(accountId, sponsorId);
        } else {
          if (!seasonId || !teamSeasonId) {
            throw new Error('Team scope identifiers are missing');
          }

          await service.deleteTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete sponsor';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [type, accountId, seasonId, teamSeasonId, service],
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
