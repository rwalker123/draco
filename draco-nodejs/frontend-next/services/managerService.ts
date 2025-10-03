import {
  listSeasonManagers as apiListSeasonManagers,
  type ListSeasonManagersData,
  type SeasonManagerList,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';
import { ManagerInfo, LeagueNames, TeamNames } from '../types/emails/recipients';

/**
 * Manager Service - Handles manager data fetching and transformation
 * Follows the same patterns as other services in the project
 */
export interface ManagerService {
  /**
   * Fetch all managers for the current season
   */
  fetchManagers(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;

  /**
   * Fetch managers filtered by league
   */
  fetchManagersByLeague(
    accountId: string,
    seasonId: string,
    leagueId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;

  /**
   * Fetch managers filtered by team
   */
  fetchManagersByTeam(
    accountId: string,
    seasonId: string,
    teamId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;

  /**
   * Search managers by name or email
   */
  searchManagers(
    accountId: string,
    seasonId: string,
    query: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;
}

/**
 * Manager service implementation
 */
class ManagerServiceImpl implements ManagerService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Fetch all managers for the current season
   */
  async fetchManagers(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      return await this.fetchSeasonManagers(accountId, seasonId, undefined, signal);
    } catch (error) {
      throw this.toServiceError(error, 'Failed to fetch managers');
    }
  }

  /**
   * Fetch managers filtered by league
   */
  async fetchManagersByLeague(
    accountId: string,
    seasonId: string,
    leagueId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      return await this.fetchSeasonManagers(
        accountId,
        seasonId,
        { leagueSeasonId: leagueId },
        signal,
      );
    } catch (error) {
      throw this.toServiceError(error, 'Failed to fetch managers by league');
    }
  }

  /**
   * Fetch managers filtered by team
   */
  async fetchManagersByTeam(
    accountId: string,
    seasonId: string,
    teamId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      return await this.fetchSeasonManagers(accountId, seasonId, { teamSeasonId: teamId }, signal);
    } catch (error) {
      throw this.toServiceError(error, 'Failed to fetch managers by team');
    }
  }

  /**
   * Search managers by name or email
   */
  async searchManagers(
    accountId: string,
    seasonId: string,
    query: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      return await this.fetchSeasonManagers(accountId, seasonId, { search: query }, signal);
    } catch (error) {
      throw this.toServiceError(error, 'Failed to search managers');
    }
  }

  /**
   * Execute the listSeasonManagers request and transform the response.
   */
  private async fetchSeasonManagers(
    accountId: string,
    seasonId: string,
    query?: ListSeasonManagersData['query'],
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    const options: Parameters<typeof apiListSeasonManagers>[0] = {
      client: this.client,
      throwOnError: false,
      path: { accountId, seasonId },
    };

    if (query && Object.keys(query).length > 0) {
      options.query = query;
    }

    if (signal) {
      options.signal = signal;
    }

    const result = await apiListSeasonManagers(options);
    const payload = unwrapApiResult(result, 'Failed to fetch season managers');

    return this.transformSeasonManagerList(payload);
  }

  private transformSeasonManagerList(data: SeasonManagerList) {
    return {
      managers: data.managers.map((manager) => this.transformSeasonManager(manager)),
      leagueNames: this.toNameRecord(data.leagueNames),
      teamNames: this.toNameRecord(data.teamNames),
    };
  }

  private transformSeasonManager(manager: SeasonManagerList['managers'][number]): ManagerInfo {
    const { contact, hasValidEmail, allTeams } = manager;
    const nameSegments = [contact.firstName, contact.lastName].filter(Boolean);

    return {
      id: contact.id,
      name: nameSegments.join(' ').trim() || contact.id,
      email: contact.email ?? null,
      phone1: contact.contactDetails?.phone1 ?? '',
      phone2: contact.contactDetails?.phone2 ?? '',
      phone3: contact.contactDetails?.phone3 ?? '',
      allTeams: allTeams.map((team) => ({
        leagueSeasonId: team.league?.id ?? '',
        teamSeasonId: team.id,
      })),
      hasValidEmail,
    };
  }

  private toNameRecord(items: Array<{ id: string; name?: string }>): Record<string, string> {
    return items.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name ?? '';
      return acc;
    }, {});
  }

  private toServiceError(error: unknown, fallback: string): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(fallback);
  }
}

/**
 * Factory function to create manager service instance
 */
export const createManagerService = (token: string): ManagerService => {
  const client = createApiClient({ token: token || undefined });
  return new ManagerServiceImpl(client);
};
