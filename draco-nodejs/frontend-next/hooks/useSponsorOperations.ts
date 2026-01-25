'use client';

import { useState } from 'react';
import { SponsorType } from '@draco/shared-schemas';
import { SponsorInput, SponsorService } from '../services/sponsorService';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { addCacheBuster } from '../utils/addCacheBuster';

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

export type SponsorFormValues = SponsorInput;

export function useSponsorOperations(scope: SponsorScope) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const service = new SponsorService(token, apiClient);
  const { type, accountId } = scope;
  const seasonId = scope.type === 'team' ? scope.seasonId : null;
  const teamSeasonId = scope.type === 'team' ? scope.teamSeasonId : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listSponsors = async (): Promise<SponsorType[]> => {
    if (type === 'account') {
      return service.listAccountSponsors(accountId);
    }

    if (!seasonId || !teamSeasonId) {
      throw new Error('Team scope identifiers are missing');
    }

    return service.listTeamSponsors(accountId, seasonId, teamSeasonId);
  };

  const createSponsor = async (input: SponsorFormValues): Promise<SponsorType> => {
    setLoading(true);
    setError(null);

    try {
      let sponsor: SponsorType;

      if (type === 'account') {
        sponsor = await service.createAccountSponsor(accountId, input);
      } else {
        if (!seasonId || !teamSeasonId) {
          throw new Error('Team scope identifiers are missing');
        }
        sponsor = await service.createTeamSponsor(accountId, seasonId, teamSeasonId, input);
      }

      return {
        ...sponsor,
        photoUrl: sponsor.photoUrl
          ? (addCacheBuster(sponsor.photoUrl, Date.now()) ?? undefined)
          : undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create sponsor';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateSponsor = async (
    sponsorId: string,
    input: SponsorFormValues,
  ): Promise<SponsorType> => {
    setLoading(true);
    setError(null);

    try {
      let sponsor: SponsorType;

      if (type === 'account') {
        sponsor = await service.updateAccountSponsor(accountId, sponsorId, input);
      } else {
        if (!seasonId || !teamSeasonId) {
          throw new Error('Team scope identifiers are missing');
        }
        sponsor = await service.updateTeamSponsor(
          accountId,
          seasonId,
          teamSeasonId,
          sponsorId,
          input,
        );
      }

      return {
        ...sponsor,
        photoUrl: sponsor.photoUrl
          ? (addCacheBuster(sponsor.photoUrl, Date.now()) ?? undefined)
          : undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update sponsor';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSponsor = async (sponsorId: string): Promise<void> => {
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
  };

  const clearError = () => setError(null);

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
