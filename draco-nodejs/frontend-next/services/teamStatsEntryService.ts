import {
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGames as apiListTeamStatEntryGames,
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBatting as apiGetGameBattingStats,
  postApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBatting as apiCreateGameBattingStat,
  putApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBattingByStatId as apiUpdateGameBattingStat,
  deleteApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBattingByStatId as apiDeleteGameBattingStat,
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitching as apiGetGamePitchingStats,
  postApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitching as apiCreateGamePitchingStat,
  putApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitchingByStatId as apiUpdateGamePitchingStat,
  deleteApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitchingByStatId as apiDeleteGamePitchingStat,
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdAttendance as apiGetGameAttendance,
  putApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdAttendance as apiUpdateGameAttendance,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type {
  TeamCompletedGameType,
  GameBattingStatsType,
  GamePitchingStatsType,
  GameAttendanceType,
  CreateGameBattingStatType,
  UpdateGameBattingStatType,
  CreateGamePitchingStatType,
  UpdateGamePitchingStatType,
} from '@draco/shared-schemas';

import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export class TeamStatsEntryService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  private parseId(value: string, label: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid ${label} "${value}"`);
    }
    return parsed;
  }

  private buildTeamPath(accountId: string, seasonId: string, teamSeasonId: string) {
    return {
      accountId: this.parseId(accountId, 'accountId'),
      seasonId: this.parseId(seasonId, 'seasonId'),
      teamSeasonId: this.parseId(teamSeasonId, 'teamSeasonId'),
    };
  }

  private buildGamePath(accountId: string, seasonId: string, teamSeasonId: string, gameId: string) {
    return {
      ...this.buildTeamPath(accountId, seasonId, teamSeasonId),
      gameId: this.parseId(gameId, 'gameId'),
    };
  }

  private buildStatPath(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    statId: string,
  ) {
    return {
      ...this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      statId: this.parseId(statId, 'statId'),
    };
  }

  async listCompletedGames(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
  ): Promise<TeamCompletedGameType[]> {
    const result = await apiListTeamStatEntryGames({
      client: this.client,
      path: this.buildTeamPath(accountId, seasonId, teamSeasonId),
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load completed games for team');
  }

  async getGameBattingStats(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
  ): Promise<GameBattingStatsType> {
    const result = await apiGetGameBattingStats({
      client: this.client,
      path: this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load batting statistics for game');
  }

  async createGameBattingStat(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    payload: CreateGameBattingStatType,
  ): Promise<GameBattingStatsType['stats'][number]> {
    const result = await apiCreateGameBattingStat({
      client: this.client,
      path: this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to add batting stat');
  }

  async updateGameBattingStat(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    statId: string,
    payload: UpdateGameBattingStatType,
  ): Promise<GameBattingStatsType['stats'][number]> {
    const result = await apiUpdateGameBattingStat({
      client: this.client,
      path: this.buildStatPath(accountId, seasonId, teamSeasonId, gameId, statId),
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update batting stat');
  }

  async deleteGameBattingStat(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    statId: string,
  ): Promise<void> {
    const result = await apiDeleteGameBattingStat({
      client: this.client,
      path: this.buildStatPath(accountId, seasonId, teamSeasonId, gameId, statId),
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete batting stat');
  }

  async getGamePitchingStats(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
  ): Promise<GamePitchingStatsType> {
    const result = await apiGetGamePitchingStats({
      client: this.client,
      path: this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load pitching statistics for game');
  }

  async createGamePitchingStat(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    payload: CreateGamePitchingStatType,
  ): Promise<GamePitchingStatsType['stats'][number]> {
    const result = await apiCreateGamePitchingStat({
      client: this.client,
      path: this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to add pitching stat');
  }

  async updateGamePitchingStat(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    statId: string,
    payload: UpdateGamePitchingStatType,
  ): Promise<GamePitchingStatsType['stats'][number]> {
    const result = await apiUpdateGamePitchingStat({
      client: this.client,
      path: this.buildStatPath(accountId, seasonId, teamSeasonId, gameId, statId),
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update pitching stat');
  }

  async deleteGamePitchingStat(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    statId: string,
  ): Promise<void> {
    const result = await apiDeleteGamePitchingStat({
      client: this.client,
      path: this.buildStatPath(accountId, seasonId, teamSeasonId, gameId, statId),
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete pitching stat');
  }

  async getGameAttendance(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
  ): Promise<GameAttendanceType> {
    const result = await apiGetGameAttendance({
      client: this.client,
      path: this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load game attendance');
  }

  async updateGameAttendance(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    payload: GameAttendanceType,
  ): Promise<GameAttendanceType> {
    const result = await apiUpdateGameAttendance({
      client: this.client,
      path: this.buildGamePath(accountId, seasonId, teamSeasonId, gameId),
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update game attendance');
  }
}
