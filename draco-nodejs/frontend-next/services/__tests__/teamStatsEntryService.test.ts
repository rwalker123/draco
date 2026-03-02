import { describe, expect, it, beforeEach, vi } from 'vitest';
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
import { ApiClientError } from '../../utils/apiResult';
import { TeamStatsEntryService } from '../teamStatsEntryService';

vi.mock('@draco/shared-api-client', () => ({
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGames: vi.fn(),
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBatting:
    vi.fn(),
  postApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBatting:
    vi.fn(),
  putApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBattingByStatId:
    vi.fn(),
  deleteApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdBattingByStatId:
    vi.fn(),
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitching:
    vi.fn(),
  postApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitching:
    vi.fn(),
  putApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitchingByStatId:
    vi.fn(),
  deleteApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdPitchingByStatId:
    vi.fn(),
  getApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdAttendance:
    vi.fn(),
  putApiAccountsByAccountIdSeasonsBySeasonIdTeamsByTeamSeasonIdStatEntryGamesByGameIdAttendance:
    vi.fn(),
  listTeamSeasonBattingStats: vi.fn(),
  listTeamSeasonPitchingStats: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, statusCode = 400) =>
  ({
    data: undefined,
    error: { message, statusCode },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-3';
const SEASON_ID = 'season-2';
const TEAM_SEASON_ID = 'ts-8';
const GAME_ID = 'game-5';
const STAT_ID = 'stat-11';

const completedGame = {
  gameId: GAME_ID,
  gameDate: '2026-03-01',
  opponent: 'Blue Jays',
  homeScore: 5,
  awayScore: 3,
};

const battingStats = {
  gameId: GAME_ID,
  stats: [{ id: STAT_ID, playerId: 'p-1', atBats: 4, hits: 2, runs: 1, rbis: 1, homeRuns: 0 }],
};

const pitchingStats = {
  gameId: GAME_ID,
  stats: [
    { id: STAT_ID, playerId: 'p-2', inningsPitched: 6, strikeouts: 7, walks: 2, earnedRuns: 1 },
  ],
};

describe('TeamStatsEntryService', () => {
  let service: TeamStatsEntryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeamStatsEntryService(undefined, {} as never);
  });

  describe('listCompletedGames', () => {
    it('returns completed games for the team', async () => {
      vi.mocked(apiListTeamStatEntryGames).mockResolvedValue(makeOk([completedGame]));

      const result = await service.listCompletedGames(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID);

      expect(apiListTeamStatEntryGames).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, teamSeasonId: TEAM_SEASON_ID },
          throwOnError: false,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].gameId).toBe(GAME_ID);
    });

    it('passes AbortSignal through', async () => {
      vi.mocked(apiListTeamStatEntryGames).mockResolvedValue(makeOk([]));
      const controller = new AbortController();
      await service.listCompletedGames(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, controller.signal);
      expect(vi.mocked(apiListTeamStatEntryGames).mock.calls[0][0].signal).toBe(controller.signal);
    });

    it('throws ApiClientError when API errors', async () => {
      vi.mocked(apiListTeamStatEntryGames).mockResolvedValue(makeError('Not found', 404));
      await expect(
        service.listCompletedGames(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getSeasonBattingStats', () => {
    it('returns season batting stats', async () => {
      const stats = [{ playerId: 'p-1', atBats: 20, hits: 10 }];
      vi.mocked(apiListTeamSeasonBattingStats).mockResolvedValue(makeOk(stats));

      const result = await service.getSeasonBattingStats(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID);

      expect(result).toEqual(stats);
    });

    it('throws when API errors', async () => {
      vi.mocked(apiListTeamSeasonBattingStats).mockResolvedValue(makeError('Server error', 500));
      await expect(
        service.getSeasonBattingStats(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getSeasonPitchingStats', () => {
    it('returns season pitching stats', async () => {
      const stats = [{ playerId: 'p-2', inningsPitched: 30, strikeouts: 40 }];
      vi.mocked(apiListTeamSeasonPitchingStats).mockResolvedValue(makeOk(stats));

      const result = await service.getSeasonPitchingStats(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID);

      expect(result).toEqual(stats);
    });
  });

  describe('getGameBattingStats', () => {
    it('returns batting stats for a game', async () => {
      vi.mocked(apiGetGameBattingStats).mockResolvedValue(makeOk(battingStats));

      const result = await service.getGameBattingStats(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
      );

      expect(apiGetGameBattingStats).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: ACCOUNT_ID,
            seasonId: SEASON_ID,
            teamSeasonId: TEAM_SEASON_ID,
            gameId: GAME_ID,
          },
          throwOnError: false,
        }),
      );
      expect(result.stats).toHaveLength(1);
      expect((result.stats[0] as Record<string, unknown>).id).toBe(STAT_ID);
    });
  });

  describe('createGameBattingStat', () => {
    it('creates and returns a new batting stat', async () => {
      const newStat = { id: 'stat-new', playerId: 'p-3', atBats: 3, hits: 1 };
      vi.mocked(apiCreateGameBattingStat).mockResolvedValue(makeOk(newStat));

      const payload = { playerId: 'p-3', atBats: 3, hits: 1 };
      const result = await service.createGameBattingStat(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
        payload as never,
      );

      expect(apiCreateGameBattingStat).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: ACCOUNT_ID,
            seasonId: SEASON_ID,
            teamSeasonId: TEAM_SEASON_ID,
            gameId: GAME_ID,
          },
          body: payload,
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).id).toBe('stat-new');
    });

    it('throws when creation fails', async () => {
      vi.mocked(apiCreateGameBattingStat).mockResolvedValue(makeError('Validation error', 422));
      await expect(
        service.createGameBattingStat(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, GAME_ID, {
          playerId: 'p-x',
        } as never),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('updateGameBattingStat', () => {
    it('updates and returns the batting stat', async () => {
      const updated = { id: STAT_ID, playerId: 'p-1', atBats: 5, hits: 3 };
      vi.mocked(apiUpdateGameBattingStat).mockResolvedValue(makeOk(updated));

      const result = await service.updateGameBattingStat(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
        STAT_ID,
        { atBats: 5, hits: 3 } as never,
      );

      expect(apiUpdateGameBattingStat).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: ACCOUNT_ID,
            seasonId: SEASON_ID,
            teamSeasonId: TEAM_SEASON_ID,
            gameId: GAME_ID,
            statId: STAT_ID,
          },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).id).toBe(STAT_ID);
    });
  });

  describe('deleteGameBattingStat', () => {
    it('resolves without error on success', async () => {
      vi.mocked(apiDeleteGameBattingStat).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(
        service.deleteGameBattingStat(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, GAME_ID, STAT_ID),
      ).resolves.toBeUndefined();
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(apiDeleteGameBattingStat).mockResolvedValue(makeError('Forbidden', 403));
      await expect(
        service.deleteGameBattingStat(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, GAME_ID, STAT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getGamePitchingStats', () => {
    it('returns pitching stats for a game', async () => {
      vi.mocked(apiGetGamePitchingStats).mockResolvedValue(makeOk(pitchingStats));

      const result = await service.getGamePitchingStats(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
      );

      expect(result.stats).toHaveLength(1);
      expect((result.stats[0] as Record<string, unknown>).id).toBe(STAT_ID);
    });
  });

  describe('createGamePitchingStat', () => {
    it('creates and returns a pitching stat', async () => {
      const newStat = { id: 'stat-p1', playerId: 'p-2', inningsPitched: 7 };
      vi.mocked(apiCreateGamePitchingStat).mockResolvedValue(makeOk(newStat));

      const payload = { playerId: 'p-2', inningsPitched: 7 };
      const result = await service.createGamePitchingStat(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
        payload as never,
      );

      expect((result as Record<string, unknown>).id).toBe('stat-p1');
    });
  });

  describe('updateGamePitchingStat', () => {
    it('updates and returns the pitching stat', async () => {
      const updated = { id: STAT_ID, playerId: 'p-2', inningsPitched: 8 };
      vi.mocked(apiUpdateGamePitchingStat).mockResolvedValue(makeOk(updated));

      const result = await service.updateGamePitchingStat(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
        STAT_ID,
        { inningsPitched: 8 } as never,
      );

      expect((result as Record<string, unknown>).inningsPitched).toBe(8);
    });
  });

  describe('deleteGamePitchingStat', () => {
    it('resolves without error on success', async () => {
      vi.mocked(apiDeleteGamePitchingStat).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(
        service.deleteGamePitchingStat(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, GAME_ID, STAT_ID),
      ).resolves.toBeUndefined();
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(apiDeleteGamePitchingStat).mockResolvedValue(makeError('Not found', 404));
      await expect(
        service.deleteGamePitchingStat(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, GAME_ID, STAT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getGameAttendance', () => {
    it('returns attendance data for a game', async () => {
      const attendance = { gameId: GAME_ID, attendance: 250 };
      vi.mocked(apiGetGameAttendance).mockResolvedValue(makeOk(attendance));

      const result = await service.getGameAttendance(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
      );

      expect(apiGetGameAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: ACCOUNT_ID,
            seasonId: SEASON_ID,
            teamSeasonId: TEAM_SEASON_ID,
            gameId: GAME_ID,
          },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).attendance).toBe(250);
    });
  });

  describe('updateGameAttendance', () => {
    it('updates and returns attendance data', async () => {
      const updated = { gameId: GAME_ID, attendance: 300 };
      vi.mocked(apiUpdateGameAttendance).mockResolvedValue(makeOk(updated));

      const result = await service.updateGameAttendance(
        ACCOUNT_ID,
        SEASON_ID,
        TEAM_SEASON_ID,
        GAME_ID,
        { attendance: 300 } as never,
      );

      expect(apiUpdateGameAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          path: {
            accountId: ACCOUNT_ID,
            seasonId: SEASON_ID,
            teamSeasonId: TEAM_SEASON_ID,
            gameId: GAME_ID,
          },
          body: { attendance: 300 },
          throwOnError: false,
        }),
      );
      expect((result as Record<string, unknown>).attendance).toBe(300);
    });

    it('throws when update fails', async () => {
      vi.mocked(apiUpdateGameAttendance).mockResolvedValue(makeError('Bad request', 400));
      await expect(
        service.updateGameAttendance(ACCOUNT_ID, SEASON_ID, TEAM_SEASON_ID, GAME_ID, {
          attendance: -1,
        } as never),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
