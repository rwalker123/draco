/**
 * Context Data Service
 * Centralized API service functions for fetching context data (leagues, teams) for role assignment
 */

import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';
import { mapLeagueSetup } from '../utils/leagueSeasonMapper';
import {
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  SeasonType,
  TeamSeasonWithPlayerCountType,
} from '@draco/shared-schemas';

export interface ContextDataResponse {
  leagueSeasons: LeagueSeasonWithDivisionTeamsAndUnassignedType[];
  season: SeasonType;
}

/**
 * Context Data Service
 * Centralized API service functions for context data operations
 */
export class ContextDataService {
  private client: Client;

  constructor(token: string) {
    this.client = createApiClient({ token: token || undefined });
  }

  /**
   * Fetch leagues and teams for a specific season
   * This single call provides all the data needed for both league and team selection
   */
  async fetchLeaguesAndTeams(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<ContextDataResponse> {
    const result = await listSeasonLeagueSeasons({
      client: this.client,
      path: { accountId, seasonId },
      query: { includeTeams: true, includeUnassignedTeams: true },
      signal,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load leagues and teams');
    const mapped = mapLeagueSetup(data);

    return {
      season: mapped.season!,
      leagueSeasons: mapped.leagueSeasons,
    };
  }

  /**
   * Get all leagues for a season (without teams data)
   */
  async fetchLeagues(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<LeagueSeasonWithDivisionTeamsAndUnassignedType[]> {
    const result = await listSeasonLeagueSeasons({
      client: this.client,
      path: { accountId, seasonId },
      signal,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load leagues');
    const mapped = mapLeagueSetup(data);

    return mapped.leagueSeasons;
  }

  /**
   * Get all teams for a season (flattened from all leagues and divisions)
   */
  async fetchTeams(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<TeamSeasonWithPlayerCountType[]> {
    const contextData = await this.fetchLeaguesAndTeams(accountId, seasonId, signal);

    const allTeams: TeamSeasonWithPlayerCountType[] = [];

    contextData.leagueSeasons.forEach((leagueSeason) => {
      if (leagueSeason.divisions) {
        leagueSeason.divisions.forEach((division) => {
          allTeams.push(...division.teams);
        });
      }
    });

    contextData.leagueSeasons.forEach((leagueSeason) => {
      if (leagueSeason.unassignedTeams) {
        allTeams.push(...leagueSeason.unassignedTeams);
      }
    });

    return allTeams;
  }
}

/**
 * Create a ContextDataService instance
 */
export const createContextDataService = (token: string): ContextDataService => {
  return new ContextDataService(token);
};
