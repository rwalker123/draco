/**
 * Context Data Service
 * Centralized API service functions for fetching context data (leagues, teams) for role assignment
 */

import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';
import {
  mapLeagueSetup,
  type LeagueSeasonSummary,
  type LeagueSeasonDivision,
  type LeagueSeasonTeam,
} from '../utils/leagueSeasonMapper';

export type LeagueSeason = LeagueSeasonSummary;
export type Division = LeagueSeasonDivision;
export type Team = LeagueSeasonTeam;

export interface League {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
}

export interface ContextDataResponse {
  leagueSeasons: LeagueSeason[];
  season: {
    id: string;
    name: string;
    accountId: string;
  } | null;
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
  async fetchLeaguesAndTeams(accountId: string, seasonId: string): Promise<ContextDataResponse> {
    const result = await listSeasonLeagueSeasons({
      client: this.client,
      path: { accountId, seasonId },
      query: { includeTeams: true, includeUnassignedTeams: true },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load leagues and teams');
    const mapped = mapLeagueSetup(data, accountId);

    return {
      season: mapped.season,
      leagueSeasons: mapped.leagueSeasons,
    };
  }

  /**
   * Get all leagues for a season (without teams data)
   */
  async fetchLeagues(accountId: string, seasonId: string): Promise<League[]> {
    const result = await listSeasonLeagueSeasons({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load leagues');
    const mapped = mapLeagueSetup(data, accountId);

    return mapped.leagueSeasons.map((ls) => ({
      id: ls.id,
      leagueId: ls.leagueId,
      leagueName: ls.leagueName,
      accountId: ls.accountId,
    }));
  }

  /**
   * Get all teams for a season (flattened from all leagues and divisions)
   */
  async fetchTeams(accountId: string, seasonId: string): Promise<Team[]> {
    const contextData = await this.fetchLeaguesAndTeams(accountId, seasonId);

    const allTeams: Team[] = [];

    // Add teams from divisions
    contextData.leagueSeasons.forEach((leagueSeason) => {
      if (leagueSeason.divisions) {
        leagueSeason.divisions.forEach((division) => {
          allTeams.push(...division.teams);
        });
      }
    });

    // Add unassigned teams
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
