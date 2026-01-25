'use client';

import { useState } from 'react';
import { TeamSeasonType } from '@draco/shared-schemas';
import { addCacheBuster } from '../config/teams';
import { useAuth } from '../context/AuthContext';
import { TeamManagementService } from '../services/teamManagementService';
import { useApiClient } from './useApiClient';

interface UseTeamManagementOptions {
  accountId: string;
  seasonId: string;
}

export interface UpdateTeamMetadataParams {
  teamSeasonId: string;
  name: string;
  logoFile?: File | null;
}

export interface UpdateTeamMetadataResult {
  message: string;
  teamSeason: TeamSeasonType;
}

export function useTeamManagement({ accountId, seasonId }: UseTeamManagementOptions) {
  const { token } = useAuth();
  const apiClient = useApiClient();

  const service = new TeamManagementService(token, apiClient);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTeamMetadata = async (
    params: UpdateTeamMetadataParams,
  ): Promise<UpdateTeamMetadataResult> => {
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const trimmedName = params.name.trim();
      if (!trimmedName) {
        throw new Error('Team name is required');
      }

      const teamSeason = await service.updateTeamMetadata(
        { accountId, seasonId, teamSeasonId: params.teamSeasonId },
        {
          name: trimmedName,
          logoFile: params.logoFile ?? undefined,
        },
      );

      const logoUrlWithCache = teamSeason.team?.logoUrl
        ? addCacheBuster(teamSeason.team.logoUrl, Date.now())
        : teamSeason.team?.logoUrl;

      const normalizedTeamSeason: TeamSeasonType = {
        ...teamSeason,
        name: trimmedName,
        team: {
          ...teamSeason.team,
          ...(logoUrlWithCache !== undefined ? { logoUrl: logoUrlWithCache } : {}),
        },
      };

      return {
        message: 'Team updated successfully',
        teamSeason: normalizedTeamSeason,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    updateTeamMetadata,
    loading,
    error,
    clearError,
  };
}
