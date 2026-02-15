import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfStandingsService } from '../golfStandingsService.js';
import type { IGolfMatchRepository } from '../../repositories/interfaces/IGolfMatchRepository.js';
import type { IGolfScoreRepository } from '../../repositories/interfaces/IGolfScoreRepository.js';
import type { IGolfFlightRepository } from '../../repositories/interfaces/IGolfFlightRepository.js';
import type { IGolfTeamRepository } from '../../repositories/interfaces/IGolfTeamRepository.js';
import type { IGolfLeagueRepository } from '../../repositories/interfaces/IGolfLeagueRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import { GolfMatchStatus } from '../../utils/golfConstants.js';

describe('GolfStandingsService', () => {
  let service: GolfStandingsService;
  let mockMatchRepository: Partial<IGolfMatchRepository>;
  let mockScoreRepository: Partial<IGolfScoreRepository>;
  let mockFlightRepository: Partial<IGolfFlightRepository>;
  let mockTeamRepository: Partial<IGolfTeamRepository>;
  let mockLeagueRepository: Partial<IGolfLeagueRepository>;

  beforeEach(() => {
    mockMatchRepository = {
      findByFlightId: vi.fn(),
      findByIdWithScores: vi.fn(),
      changeMatchSeason: vi.fn(async () => {
        throw new Error('Not implemented');
      }),
    };
    mockScoreRepository = {
      findByMatchIds: vi.fn(),
    };
    mockFlightRepository = {
      findById: vi.fn(),
      findBySeasonId: vi.fn(),
    };
    mockTeamRepository = {
      findByFlightId: vi.fn(),
      findByTeamAndLeagueSeason: vi.fn(async () => null),
    };
    mockLeagueRepository = {
      findByLeagueSeasonId: vi.fn(),
    };

    service = new GolfStandingsService(
      mockMatchRepository as IGolfMatchRepository,
      mockScoreRepository as IGolfScoreRepository,
      mockFlightRepository as IGolfFlightRepository,
      mockTeamRepository as IGolfTeamRepository,
      mockLeagueRepository as IGolfLeagueRepository,
    );
  });

  describe('getFlightStandings', () => {
    it('throws NotFoundError when flight not found', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue(null);

      await expect(service.getFlightStandings(1n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns standings for teams with no matches', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(new Map());

      const result = await service.getFlightStandings(1n);

      expect(result.flightId).toBe('1');
      expect(result.flightName).toBe('Flight A');
      expect(result.standings).toHaveLength(2);
      expect(result.standings[0].matchesPlayed).toBe(0);
      expect(result.standings[0].totalPoints).toBe(0);
    });

    it('calculates standings correctly for team scoring', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
      ] as never);
      const scoresMap = new Map([
        [
          10n,
          [
            { teamid: 1n, golfscore: { totalscore: 40 } },
            { teamid: 2n, golfscore: { totalscore: 45 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      const team1Standing = result.standings.find((s) => s.teamName === 'Team 1');
      const team2Standing = result.standings.find((s) => s.teamName === 'Team 2');

      expect(team1Standing?.matchesWon).toBe(1);
      expect(team1Standing?.matchesLost).toBe(0);
      expect(team1Standing?.matchPoints).toBe(2);
      expect(team2Standing?.matchesWon).toBe(0);
      expect(team2Standing?.matchesLost).toBe(1);
      expect(team2Standing?.matchPoints).toBe(0);
    });

    it('calculates standings correctly for individual scoring', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'individual',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Player 1' },
        { id: 2n, name: 'Player 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: 5.5,
          team2points: 4.5,
          team1matchwins: 1,
          team2matchwins: 0,
        },
      ] as never);
      const scoresMap = new Map([
        [
          10n,
          [
            { teamid: 1n, golfscore: { totalscore: 38 } },
            { teamid: 2n, golfscore: { totalscore: 40 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      const player1Standing = result.standings.find((s) => s.teamName === 'Player 1');
      const player2Standing = result.standings.find((s) => s.teamName === 'Player 2');

      expect(player1Standing?.matchesWon).toBe(1);
      expect(player1Standing?.matchesLost).toBe(0);
      expect(player1Standing?.matchPoints).toBe(5.5);
      expect(player2Standing?.matchesWon).toBe(0);
      expect(player2Standing?.matchesLost).toBe(1);
      expect(player2Standing?.matchPoints).toBe(4.5);
    });

    it('handles tied matches correctly', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
      ] as never);
      const scoresMap = new Map([
        [
          10n,
          [
            { teamid: 1n, golfscore: { totalscore: 40 } },
            { teamid: 2n, golfscore: { totalscore: 40 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      const team1Standing = result.standings.find((s) => s.teamName === 'Team 1');
      const team2Standing = result.standings.find((s) => s.teamName === 'Team 2');

      expect(team1Standing?.matchesTied).toBe(1);
      expect(team2Standing?.matchesTied).toBe(1);
      expect(team1Standing?.matchPoints).toBe(1);
      expect(team2Standing?.matchPoints).toBe(1);
    });

    it('only includes completed matches', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.SCHEDULED,
        },
        {
          id: 11n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
      ] as never);
      const scoresMap = new Map([
        [
          11n,
          [
            { teamid: 1n, golfscore: { totalscore: 40 } },
            { teamid: 2n, golfscore: { totalscore: 45 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      expect(result.standings[0].matchesPlayed).toBe(1);
      expect(mockScoreRepository.findByMatchIds).toHaveBeenCalledTimes(1);
      expect(mockScoreRepository.findByMatchIds).toHaveBeenCalledWith([11n]);
    });

    it('ranks teams by total points then by total strokes', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
        { id: 3n, name: 'Team 3' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
        {
          id: 11n,
          team1: 1n,
          team2: 3n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
        {
          id: 12n,
          team1: 2n,
          team2: 3n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
      ] as never);

      const scoresMap = new Map([
        [
          10n,
          [
            { teamid: 1n, golfscore: { totalscore: 38 } },
            { teamid: 2n, golfscore: { totalscore: 42 } },
          ],
        ],
        [
          11n,
          [
            { teamid: 1n, golfscore: { totalscore: 40 } },
            { teamid: 3n, golfscore: { totalscore: 44 } },
          ],
        ],
        [
          12n,
          [
            { teamid: 2n, golfscore: { totalscore: 40 } },
            { teamid: 3n, golfscore: { totalscore: 46 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      expect(result.standings[0].teamName).toBe('Team 1');
      expect(result.standings[0].rank).toBe(1);
      expect(result.standings[1].teamName).toBe('Team 2');
      expect(result.standings[1].rank).toBe(2);
      expect(result.standings[2].teamName).toBe('Team 3');
      expect(result.standings[2].rank).toBe(3);
    });

    it('calculates stroke points correctly', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
      ] as never);
      const scoresMap = new Map([
        [
          10n,
          [
            { teamid: 1n, golfscore: { totalscore: 35 } },
            { teamid: 2n, golfscore: { totalscore: 42 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      const team1Standing = result.standings.find((s) => s.teamName === 'Team 1');

      expect(team1Standing?.strokePoints).toBe(7);
    });

    it('caps stroke points at 10', async () => {
      vi.mocked(mockFlightRepository.findById!).mockResolvedValue({
        id: 1n,
        leagueseasonid: 100n,
        league: { name: 'Flight A' },
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
        { id: 2n, name: 'Team 2' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([
        {
          id: 10n,
          team1: 1n,
          team2: 2n,
          matchstatus: GolfMatchStatus.COMPLETED,
          team1points: null,
          team2points: null,
        },
      ] as never);
      const scoresMap = new Map([
        [
          10n,
          [
            { teamid: 1n, golfscore: { totalscore: 30 } },
            { teamid: 2n, golfscore: { totalscore: 55 } },
          ],
        ],
      ]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(scoresMap as never);

      const result = await service.getFlightStandings(1n);

      const team1Standing = result.standings.find((s) => s.teamName === 'Team 1');

      expect(team1Standing?.strokePoints).toBe(10);
    });
  });

  describe('getLeagueStandings', () => {
    it('throws NotFoundError when no flights found', async () => {
      vi.mocked(mockFlightRepository.findBySeasonId!).mockResolvedValue([]);

      await expect(service.getLeagueStandings(1n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns standings for all flights', async () => {
      vi.mocked(mockFlightRepository.findBySeasonId!).mockResolvedValue([
        { id: 1n, leagueseasonid: 100n, league: { name: 'Flight A' } },
        { id: 2n, leagueseasonid: 100n, league: { name: 'Flight B' } },
      ] as never);
      vi.mocked(mockFlightRepository.findById!)
        .mockResolvedValueOnce({
          id: 1n,
          leagueseasonid: 100n,
          league: { name: 'Flight A' },
        } as never)
        .mockResolvedValueOnce({
          id: 2n,
          leagueseasonid: 100n,
          league: { name: 'Flight B' },
        } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);
      vi.mocked(mockTeamRepository.findByFlightId!).mockResolvedValue([
        { id: 1n, name: 'Team 1' },
      ] as never);
      vi.mocked(mockMatchRepository.findByFlightId!).mockResolvedValue([]);
      vi.mocked(mockScoreRepository.findByMatchIds!).mockResolvedValue(new Map());

      const result = await service.getLeagueStandings(100n);

      expect(result.seasonId).toBe('100');
      expect(result.flights).toHaveLength(2);
      expect(result.flights[0].flightName).toBe('Flight A');
      expect(result.flights[1].flightName).toBe('Flight B');
    });
  });

  describe('calculateMatchPoints', () => {
    it('throws NotFoundError when match not found', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(null);

      await expect(service.calculateMatchPoints(1n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns zero points for non-completed match', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        matchstatus: GolfMatchStatus.SCHEDULED,
        golfmatchscores: [],
      } as never);

      const result = await service.calculateMatchPoints(1n);

      expect(result.team1Points).toBe(0);
      expect(result.team2Points).toBe(0);
    });

    it('awards 2 points to winner', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        team1: 1n,
        team2: 2n,
        matchstatus: GolfMatchStatus.COMPLETED,
        golfmatchscores: [
          { teamid: 1n, golfscore: { totalscore: 38 } },
          { teamid: 2n, golfscore: { totalscore: 42 } },
        ],
      } as never);

      const result = await service.calculateMatchPoints(1n);

      expect(result.team1Points).toBeGreaterThan(result.team2Points);
      expect(result.team1Points).toBeGreaterThanOrEqual(2);
    });

    it('splits points on tie', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        team1: 1n,
        team2: 2n,
        matchstatus: GolfMatchStatus.COMPLETED,
        golfmatchscores: [
          { teamid: 1n, golfscore: { totalscore: 40 } },
          { teamid: 2n, golfscore: { totalscore: 40 } },
        ],
      } as never);

      const result = await service.calculateMatchPoints(1n);

      expect(result.team1Points).toBe(1);
      expect(result.team2Points).toBe(1);
    });

    it('adds stroke points based on score difference', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        team1: 1n,
        team2: 2n,
        matchstatus: GolfMatchStatus.COMPLETED,
        golfmatchscores: [
          { teamid: 1n, golfscore: { totalscore: 35 } },
          { teamid: 2n, golfscore: { totalscore: 40 } },
        ],
      } as never);

      const result = await service.calculateMatchPoints(1n);

      expect(result.team1Points).toBe(7);
    });
  });
});
