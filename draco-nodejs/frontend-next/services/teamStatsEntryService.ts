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
  listTeamSeasonBattingStats as apiListTeamSeasonBattingStats,
  listTeamSeasonPitchingStats as apiListTeamSeasonPitchingStats,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type {
  TeamCompletedGameType,
  GameBattingStatsType,
  GamePitchingStatsType,
  GameAttendanceType,
  UpdateGameAttendanceType,
  CreateGameBattingStatType,
  UpdateGameBattingStatType,
  CreateGamePitchingStatType,
  UpdateGamePitchingStatType,
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
} from '@draco/shared-schemas';

import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export class TeamStatsEntryService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  async listCompletedGames(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
  ): Promise<TeamCompletedGameType[]> {
    const result = await apiListTeamStatEntryGames({
      client: this.client,
      path: {
        accountId,
        seasonId,
        teamSeasonId,
      },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load completed games for team');
  }

  async getSeasonBattingStats(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
  ): Promise<PlayerBattingStatsType[]> {
    const result = await apiListTeamSeasonBattingStats({
      client: this.client,
      path: { accountId, seasonId, teamSeasonId },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load season batting statistics for team');
  }

  async getSeasonPitchingStats(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
  ): Promise<PlayerPitchingStatsType[]> {
    const result = await apiListTeamSeasonPitchingStats({
      client: this.client,
      path: { accountId, seasonId, teamSeasonId },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load season pitching statistics for team');
  }

  async getGameBattingStats(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
  ): Promise<GameBattingStatsType> {
    const result = await apiGetGameBattingStats({
      client: this.client,
      path: { accountId, seasonId, teamSeasonId, gameId },
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
      path: { accountId, seasonId, teamSeasonId, gameId },
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
      path: { accountId, seasonId, teamSeasonId, gameId, statId },
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
      path: { accountId, seasonId, teamSeasonId, gameId, statId },
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
      path: { accountId, seasonId, teamSeasonId, gameId },
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
      path: { accountId, seasonId, teamSeasonId, gameId },
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
      path: { accountId, seasonId, teamSeasonId, gameId, statId },
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
      path: { accountId, seasonId, teamSeasonId, gameId, statId },
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
      path: { accountId, seasonId, teamSeasonId, gameId },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load game attendance');
  }

  async updateGameAttendance(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    gameId: string,
    payload: UpdateGameAttendanceType,
  ): Promise<GameAttendanceType> {
    const result = await apiUpdateGameAttendance({
      client: this.client,
      path: { accountId, seasonId, teamSeasonId, gameId },
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update game attendance');
  }
}
