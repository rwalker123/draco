import { describe, it, expect, beforeEach, vi } from 'vitest';

const serviceFactoryMock = vi.hoisted(() => {
  const handicapService = {
    calculateHandicapIndexAsOf: vi.fn().mockResolvedValue(null),
    getPlayerHandicap: vi.fn().mockResolvedValue({
      contactId: '1',
      firstName: 'Test',
      lastName: 'Player',
      handicapIndex: null,
      roundsUsed: 0,
      totalRounds: 0,
    }),
  };
  return {
    getGolfHandicapService: vi.fn(() => handicapService),
    getGolfIndividualScoringService: vi.fn(() => ({
      calculateAndStoreMatchPoints: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

const golferRepositoryMock = vi.hoisted(() => ({
  findByContactId: vi.fn().mockResolvedValue(null),
}));

const repositoryFactoryMock = vi.hoisted(() => ({
  getGolfScoreRepository: vi.fn(),
  getGolfMatchRepository: vi.fn(),
  getGolfRosterRepository: vi.fn(),
  getGolfCourseRepository: vi.fn(),
  getGolfLeagueRepository: vi.fn(),
  getGolfTeeRepository: vi.fn(),
  getGolferRepository: vi.fn(() => golferRepositoryMock),
}));

const formatterMock = vi.hoisted(() => ({
  formatWithDetails: vi.fn((score: Record<string, unknown>) => ({
    id: String(score.id),
    totalScore: score.totalscore,
    holesPlayed: score.holesplayed,
    datePlayed: (score.dateplayed as Date).toISOString(),
    differential: 5.0,
  })),
}));

vi.mock('../serviceFactory.js', () => ({
  ServiceFactory: serviceFactoryMock,
}));

vi.mock('../../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: repositoryFactoryMock,
}));

vi.mock('../../responseFormatters/golfScoreResponseFormatter.js', () => ({
  GolfScoreResponseFormatter: formatterMock,
}));

import { GolfScoreService } from '../golfScoreService.js';
import type { IGolfScoreRepository } from '../../repositories/interfaces/IGolfScoreRepository.js';
import type { IGolfMatchRepository } from '../../repositories/interfaces/IGolfMatchRepository.js';
import type { IGolfRosterRepository } from '../../repositories/interfaces/IGolfRosterRepository.js';
import type { IGolfCourseRepository } from '../../repositories/interfaces/IGolfCourseRepository.js';
import type { IGolfLeagueRepository } from '../../repositories/interfaces/IGolfLeagueRepository.js';
import type { IGolfTeeRepository } from '../../repositories/interfaces/IGolfTeeRepository.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import { GolfMatchStatus, FullTeamAbsentMode } from '../../utils/golfConstants.js';

describe('GolfScoreService', () => {
  let service: GolfScoreService;
  let mockScoreRepository: Partial<IGolfScoreRepository>;
  let mockMatchRepository: Partial<IGolfMatchRepository>;
  let mockRosterRepository: Partial<IGolfRosterRepository>;
  let mockCourseRepository: Partial<IGolfCourseRepository>;
  let mockLeagueRepository: Partial<IGolfLeagueRepository>;
  let mockTeeRepository: Partial<IGolfTeeRepository>;

  const createMockLeagueSetup = (overrides: Record<string, unknown> = {}) => ({
    id: 1n,
    holespermatch: 9,
    perholepoints: 1,
    perninepoints: 2,
    permatchpoints: 3,
    fullteamabsentmode: FullTeamAbsentMode.FORFEIT,
    absentplayermode: 0,
    absentplayerpenalty: 0,
    ...overrides,
  });

  const createMockMatch = (overrides: Record<string, unknown> = {}) => ({
    id: 1n,
    leagueid: 100n,
    team1: 10n,
    team2: 20n,
    courseid: 5n,
    matchdate: new Date('2024-01-15T10:00:00Z'),
    matchstatus: GolfMatchStatus.SCHEDULED,
    matchtype: 0,
    comment: '',
    team1points: null,
    team2points: null,
    team1totalscore: null,
    team2totalscore: null,
    team1netscore: null,
    team2netscore: null,
    teamsseason_golfmatch_team1Toteamsseason: {
      id: 10n,
      name: 'Team 1',
      teams: { id: 1n, name: 'Team 1' },
    },
    teamsseason_golfmatch_team2Toteamsseason: {
      id: 20n,
      name: 'Team 2',
      teams: { id: 2n, name: 'Team 2' },
    },
    golfcourse: { id: 5n, name: 'Test Course' },
    golfteeinformation: null,
    golfmatchscores: [],
    ...overrides,
  });

  const createMockCourse = () => ({
    id: 5n,
    name: 'Test Course',
  });

  const createMockCourseWithPars = (par = 4) => ({
    id: 5n,
    name: 'Test Course',
    menspar1: par,
    menspar2: par,
    menspar3: par,
    menspar4: par,
    menspar5: par,
    menspar6: par,
    menspar7: par,
    menspar8: par,
    menspar9: par,
    menspar10: 0,
    menspar11: 0,
    menspar12: 0,
    menspar13: 0,
    menspar14: 0,
    menspar15: 0,
    menspar16: 0,
    menspar17: 0,
    menspar18: 0,
    womanspar1: par,
    womanspar2: par,
    womanspar3: par,
    womanspar4: par,
    womanspar5: par,
    womanspar6: par,
    womanspar7: par,
    womanspar8: par,
    womanspar9: par,
    womanspar10: 0,
    womanspar11: 0,
    womanspar12: 0,
    womanspar13: 0,
    womanspar14: 0,
    womanspar15: 0,
    womanspar16: 0,
    womanspar17: 0,
    womanspar18: 0,
    menshcp1: 1,
    menshcp2: 2,
    menshcp3: 3,
    menshcp4: 4,
    menshcp5: 5,
    menshcp6: 6,
    menshcp7: 7,
    menshcp8: 8,
    menshcp9: 9,
    menshcp10: 0,
    menshcp11: 0,
    menshcp12: 0,
    menshcp13: 0,
    menshcp14: 0,
    menshcp15: 0,
    menshcp16: 0,
    menshcp17: 0,
    menshcp18: 0,
    womanshcp1: 1,
    womanshcp2: 2,
    womanshcp3: 3,
    womanshcp4: 4,
    womanshcp5: 5,
    womanshcp6: 6,
    womanshcp7: 7,
    womanshcp8: 8,
    womanshcp9: 9,
    womanshcp10: 0,
    womanshcp11: 0,
    womanshcp12: 0,
    womanshcp13: 0,
    womanshcp14: 0,
    womanshcp15: 0,
    womanshcp16: 0,
    womanshcp17: 0,
    womanshcp18: 0,
  });

  const createMockTee = () => ({
    id: 1n,
    courseid: 5n,
    teename: 'White',
    teecolor: 'white',
    priority: 1,
    mensrating: '36.0',
    menslope: 113,
    womansrating: '36.0',
    womanslope: 113,
    distancehole1: 350,
    distancehole2: 350,
    distancehole3: 350,
    distancehole4: 350,
    distancehole5: 350,
    distancehole6: 350,
    distancehole7: 350,
    distancehole8: 350,
    distancehole9: 350,
    distancehole10: 0,
    distancehole11: 0,
    distancehole12: 0,
    distancehole13: 0,
    distancehole14: 0,
    distancehole15: 0,
    distancehole16: 0,
    distancehole17: 0,
    distancehole18: 0,
  });

  const createMockRosterEntry = (id: bigint, golferId: bigint, firstName: string) => ({
    id,
    golferid: golferId,
    golfer: {
      id: golferId,
      gender: 'M',
      initialdifferential: null,
      contact: {
        firstname: firstName,
        lastname: 'Player',
      },
    },
  });

  beforeEach(() => {
    mockScoreRepository = {
      findById: vi.fn(),
      findByGolferId: vi.fn(),
      findByMatchId: vi.fn(),
      findByTeamAndMatch: vi.fn(),
      submitMatchScoresTransactional: vi.fn(),
      deleteMatchScores: vi.fn(),
      getPlayerScoresForSeason: vi.fn(),
      getPlayerLeagueScores: vi.fn(),
    };
    mockMatchRepository = {
      findById: vi.fn(),
      findByIdWithScores: vi.fn(),
      updateStatus: vi.fn(),
      updatePoints: vi.fn(),
      updateTee: vi.fn(),
      changeMatchSeason: vi.fn(async () => {
        throw new Error('Not implemented');
      }),
    };
    mockRosterRepository = {
      findByIds: vi.fn(),
    };
    mockCourseRepository = {
      findById: vi.fn(),
    };
    mockLeagueRepository = {
      findByLeagueSeasonId: vi.fn(),
    };
    mockTeeRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    service = new GolfScoreService(
      mockScoreRepository as IGolfScoreRepository,
      mockMatchRepository as IGolfMatchRepository,
      mockRosterRepository as IGolfRosterRepository,
      mockCourseRepository as IGolfCourseRepository,
      mockLeagueRepository as IGolfLeagueRepository,
      mockTeeRepository as IGolfTeeRepository,
    );
  });

  describe('submitMatchResults - Full Team Absence Detection', () => {
    it('detects when team1 has all players marked absent', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup();
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const submitData = {
        courseId: '5',
        scores: [
          createPlayerScore('10', '100', true),
          createPlayerScore('10', '101', true),
          createPlayerScore('20', '200', false),
          createPlayerScore('20', '201', false),
        ],
      };

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(101n, 1001n, 'Player101'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
        createMockRosterEntry(201n, 2001n, 'Player201'),
      ] as never);

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updateStatus).toHaveBeenCalledWith(
        matchId,
        GolfMatchStatus.FORFEIT,
      );
      expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
        matchId,
        expect.objectContaining({
          team1points: 0,
          team2points: expect.any(Number),
          team2matchwins: 1,
          team1matchwins: 0,
        }),
      );
    });

    it('detects when team2 has all players marked absent', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup();
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const submitData = {
        courseId: '5',
        scores: [
          createPlayerScore('10', '100', false),
          createPlayerScore('10', '101', false),
          createPlayerScore('20', '200', true),
          createPlayerScore('20', '201', true),
        ],
      };

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(101n, 1001n, 'Player101'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
        createMockRosterEntry(201n, 2001n, 'Player201'),
      ] as never);

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updateStatus).toHaveBeenCalledWith(
        matchId,
        GolfMatchStatus.FORFEIT,
      );
      expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
        matchId,
        expect.objectContaining({
          team1points: expect.any(Number),
          team2points: 0,
          team1matchwins: 1,
          team2matchwins: 0,
        }),
      );
    });

    it('does not trigger full team absence when only some players are absent', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup();
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockScoreRepository.submitMatchScoresTransactional!).mockResolvedValue({
        createdScoreIds: [1n, 2n, 3n],
      });
      vi.mocked(mockScoreRepository.findByTeamAndMatch!).mockResolvedValue([]);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const submitData = {
        courseId: '5',
        scores: [
          createPlayerScore('10', '100', true),
          createPlayerScore('10', '101', false),
          createPlayerScore('20', '200', false),
          createPlayerScore('20', '201', false),
        ],
      };

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(101n, 1001n, 'Player101'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
        createMockRosterEntry(201n, 2001n, 'Player201'),
      ] as never);

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updateStatus).not.toHaveBeenCalledWith(
        matchId,
        GolfMatchStatus.FORFEIT,
      );
      expect(mockScoreRepository.submitMatchScoresTransactional).toHaveBeenCalled();
    });
  });

  describe('submitMatchResults - Full Team Absence Forfeit Mode', () => {
    it('awards maximum points to present team on forfeit', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup({
        holespermatch: 9,
        perholepoints: 1,
        perninepoints: 2,
        permatchpoints: 3,
        fullteamabsentmode: FullTeamAbsentMode.FORFEIT,
      });
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const submitData = {
        courseId: '5',
        scores: [createPlayerScore('10', '100', true), createPlayerScore('20', '200', false)],
      };

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
      ] as never);

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
        matchId,
        expect.objectContaining({
          team1points: 0,
          team2points: 12,
          team1totalscore: 0,
          team2totalscore: 0,
          team1netscore: 0,
          team2netscore: 0,
          team1holewins: 0,
          team2holewins: 0,
          team1ninewins: 0,
          team2ninewins: 0,
          team1matchwins: 0,
          team2matchwins: 1,
        }),
      );
    });

    it('calculates correct max points for 18-hole match', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup({
        holespermatch: 18,
        perholepoints: 1,
        perninepoints: 2,
        permatchpoints: 4,
        fullteamabsentmode: FullTeamAbsentMode.FORFEIT,
      });
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const submitData = {
        courseId: '5',
        scores: [createPlayerScore('10', '100', true), createPlayerScore('20', '200', false)],
      };

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
      ] as never);

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
        matchId,
        expect.objectContaining({
          team2points: 26,
        }),
      );
    });

    it('handles both teams being fully absent (no points awarded)', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup({
        fullteamabsentmode: FullTeamAbsentMode.FORFEIT,
      });
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);
      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
      ] as never);

      const submitData = {
        courseId: '5',
        scores: [createPlayerScore('10', '100', true), createPlayerScore('20', '200', true)],
      };

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
        matchId,
        expect.objectContaining({
          team1points: 0,
          team2points: 0,
          team1matchwins: 0,
          team2matchwins: 0,
        }),
      );
    });

    it('sets match status to FORFEIT', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup();
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const submitData = {
        courseId: '5',
        scores: [createPlayerScore('10', '100', true), createPlayerScore('20', '200', false)],
      };

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
      ] as never);

      await service.submitMatchResults(matchId, submitData);

      expect(mockMatchRepository.updateStatus).toHaveBeenCalledWith(
        matchId,
        GolfMatchStatus.FORFEIT,
      );
    });
  });

  describe('submitMatchResults - Full Team Absence Handicap Penalty Mode', () => {
    it('stores penalty total score for absent player when teeId is provided', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup({
        fullteamabsentmode: FullTeamAbsentMode.HANDICAP_PENALTY,
        holespermatch: 9,
        absentplayerpenalty: 9,
      });
      const course = createMockCourseWithPars(4);
      const tee = createMockTee();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(tee as never);
      vi.mocked(mockScoreRepository.submitMatchScoresTransactional!).mockResolvedValue({
        createdScoreIds: [1n],
      });
      vi.mocked(mockScoreRepository.findByTeamAndMatch!).mockResolvedValue([]);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      const handicapService = serviceFactoryMock.getGolfHandicapService();
      vi.mocked(handicapService.calculateHandicapIndexAsOf).mockResolvedValueOnce(10.0);
      vi.mocked(handicapService.calculateHandicapIndexAsOf).mockResolvedValueOnce(null);

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
      ] as never);

      const submitData = {
        courseId: '5',
        teeId: '1',
        scores: [createPlayerScore('10', '100', true), createPlayerScore('20', '200', false)],
      };

      await service.submitMatchResults(matchId, submitData);

      // coursePar=36 (9 × 4), startIndex9=5 (10/2), CH=round(5 * 113/113 + (36-36))=5, penalty=9
      // penaltyTotal = 36 + 5 + 9 = 50
      expect(mockScoreRepository.submitMatchScoresTransactional).toHaveBeenCalledWith(
        matchId,
        expect.any(Array),
        expect.arrayContaining([
          expect.objectContaining({
            scoreData: expect.objectContaining({
              totalscore: 50,
              isabsent: true,
            }),
          }),
        ]),
      );
    });

    it('proceeds with normal score submission when handicap penalty mode is selected', async () => {
      const matchId = 1n;
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup({
        fullteamabsentmode: FullTeamAbsentMode.HANDICAP_PENALTY,
      });
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);
      vi.mocked(mockScoreRepository.submitMatchScoresTransactional!).mockResolvedValue({
        createdScoreIds: [1n],
      });
      vi.mocked(mockScoreRepository.findByTeamAndMatch!).mockResolvedValue([]);
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);

      vi.mocked(mockRosterRepository.findByIds!).mockResolvedValue([
        createMockRosterEntry(100n, 1000n, 'Player100'),
        createMockRosterEntry(200n, 2000n, 'Player200'),
      ] as never);

      const submitData = {
        courseId: '5',
        scores: [createPlayerScore('10', '100', true), createPlayerScore('20', '200', false)],
      };

      await service.submitMatchResults(matchId, submitData);

      expect(mockScoreRepository.submitMatchScoresTransactional).toHaveBeenCalled();
      expect(mockMatchRepository.updateStatus).not.toHaveBeenCalledWith(
        matchId,
        GolfMatchStatus.FORFEIT,
      );
    });
  });

  describe('submitMatchResults - Validation', () => {
    it('throws NotFoundError when match not found', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(null);

      const submitData = {
        courseId: '5',
        scores: [],
      };

      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(NotFoundError);
      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(
        'Golf match not found',
      );
    });

    it('throws NotFoundError when course not found', async () => {
      const match = createMockMatch();
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(null);

      const submitData = {
        courseId: '5',
        scores: [],
      };

      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(NotFoundError);
      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(
        'Golf course not found',
      );
    });

    it('throws NotFoundError when league setup not found', async () => {
      const match = createMockMatch();
      const course = createMockCourse();
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(null);

      const submitData = {
        courseId: '5',
        scores: [],
      };

      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(NotFoundError);
      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(
        'League setup not found',
      );
    });

    it('throws ValidationError when team is not part of match', async () => {
      const match = createMockMatch();
      const leagueSetup = createMockLeagueSetup();
      const course = createMockCourse();

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(match as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(course as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(leagueSetup as never);

      const submitData = {
        courseId: '5',
        scores: [createPlayerScore('999', '100', false)],
      };

      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(ValidationError);
      await expect(service.submitMatchResults(1n, submitData)).rejects.toThrow(
        'Team 999 is not part of this match',
      );
    });
  });

  describe('getScoreById', () => {
    it('throws NotFoundError when score not found', async () => {
      vi.mocked(mockScoreRepository.findById!).mockResolvedValue(null);

      await expect(service.getScoreById(1n)).rejects.toThrow(NotFoundError);
      await expect(service.getScoreById(1n)).rejects.toThrow('Golf score not found');
    });
  });

  describe('getScoresForMatch', () => {
    it('throws NotFoundError when match not found', async () => {
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(null);

      await expect(service.getScoresForMatch(1n)).rejects.toThrow(NotFoundError);
      await expect(service.getScoresForMatch(1n)).rejects.toThrow('Golf match not found');
    });
  });

  describe('getScoresForTeamInMatch', () => {
    it('throws NotFoundError when match not found', async () => {
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(null);

      await expect(service.getScoresForTeamInMatch(1n, 10n)).rejects.toThrow(NotFoundError);
      await expect(service.getScoresForTeamInMatch(1n, 10n)).rejects.toThrow(
        'Golf match not found',
      );
    });
  });

  describe('deleteMatchScores', () => {
    it('throws NotFoundError when match not found', async () => {
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(null);

      await expect(service.deleteMatchScores(1n)).rejects.toThrow(NotFoundError);
      await expect(service.deleteMatchScores(1n)).rejects.toThrow('Golf match not found');
    });

    it('deletes scores and resets match status to SCHEDULED', async () => {
      const match = createMockMatch({ matchstatus: GolfMatchStatus.COMPLETED });
      vi.mocked(mockMatchRepository.findById!).mockResolvedValue(match as never);
      vi.mocked(mockScoreRepository.deleteMatchScores!).mockResolvedValue(2);
      vi.mocked(mockMatchRepository.updateStatus!).mockResolvedValue({} as never);

      await service.deleteMatchScores(1n);

      expect(mockScoreRepository.deleteMatchScores).toHaveBeenCalledWith(1n);
      expect(mockMatchRepository.updateStatus).toHaveBeenCalledWith(1n, GolfMatchStatus.SCHEDULED);
    });
  });

  describe('getPlayerSeasonScores', () => {
    const createMockScore = (id: bigint, date: Date) => ({
      id,
      golferid: 100n,
      courseid: 5n,
      teeid: 1n,
      dateplayed: date,
      holesplayed: 18,
      totalscore: 85,
      totalsonly: false,
      holescrore1: 5,
      holescrore2: 4,
      holescrore3: 5,
      holescrore4: 4,
      holescrore5: 5,
      holescrore6: 4,
      holescrore7: 5,
      holescrore8: 4,
      holescrore9: 5,
      holescrore10: 5,
      holescrore11: 4,
      holescrore12: 5,
      holescrore13: 4,
      holescrore14: 5,
      holescrore15: 4,
      holescrore16: 5,
      holescrore17: 4,
      holescrore18: 4,
      startindex: null,
      startindex9: null,
      differential: 10.5,
      golfer: {
        id: 100n,
        initialdifferential: 12.0,
        gender: 'M',
        contact: { id: 500n, firstname: 'Ken', lastname: 'Vadella', middlename: null },
        contactid: 500n,
      },
      golfcourse: { id: 5n, name: 'Test Course', city: 'TestCity', state: 'TS' },
      golfteeinformation: {
        id: 1n,
        courseid: 5n,
        teename: 'White',
        teecolor: '#FFFFFF',
        priority: 1,
        mensrating: 72.0,
        menslope: 130,
        womansrating: 74.0,
        womanslope: 135,
        distancehole1: 350,
        distancehole2: 400,
        distancehole3: 180,
        distancehole4: 420,
        distancehole5: 510,
        distancehole6: 370,
        distancehole7: 200,
        distancehole8: 440,
        distancehole9: 380,
        distancehole10: 360,
        distancehole11: 410,
        distancehole12: 170,
        distancehole13: 430,
        distancehole14: 520,
        distancehole15: 380,
        distancehole16: 190,
        distancehole17: 450,
        distancehole18: 390,
      },
    });

    it('returns formatted scores with handicap from all seasons', async () => {
      const scores = [
        createMockScore(1n, new Date('2025-06-15')),
        createMockScore(2n, new Date('2024-09-10')),
      ];

      vi.mocked(mockScoreRepository.getPlayerLeagueScores!).mockResolvedValue(scores as never);

      const handicapService = serviceFactoryMock.getGolfHandicapService();
      vi.mocked(handicapService.getPlayerHandicap).mockResolvedValue({
        contactId: '500',
        firstName: 'Ken',
        lastName: 'Vadella',
        handicapIndex: 10.2,
        roundsUsed: 8,
        totalRounds: 20,
      });

      const result = await service.getPlayerSeasonScores(500n);

      expect(mockScoreRepository.getPlayerLeagueScores).toHaveBeenCalledWith(500n);
      expect(result.scores).toHaveLength(2);
      expect(result.handicapIndex).toBe(10.2);
      expect(result.isInitialIndex).toBe(false);
    });

    it('falls back to initial differential when no calculated handicap', async () => {
      const scores = [createMockScore(1n, new Date('2025-06-15'))];

      vi.mocked(mockScoreRepository.getPlayerLeagueScores!).mockResolvedValue(scores as never);

      const handicapService = serviceFactoryMock.getGolfHandicapService();
      vi.mocked(handicapService.getPlayerHandicap).mockResolvedValue({
        contactId: '500',
        firstName: 'Ken',
        lastName: 'Vadella',
        handicapIndex: null,
        roundsUsed: 0,
        totalRounds: 1,
      });

      const result = await service.getPlayerSeasonScores(500n);

      expect(result.handicapIndex).toBe(12.0);
      expect(result.isInitialIndex).toBe(true);
      expect(result.initialDifferential).toBe(12.0);
    });

    it('returns empty scores with golfer fallback when no league scores exist', async () => {
      vi.mocked(mockScoreRepository.getPlayerLeagueScores!).mockResolvedValue([]);

      vi.mocked(golferRepositoryMock.findByContactId).mockResolvedValue({
        id: 100n,
        initialdifferential: 15.0,
        contactid: 500n,
      } as never);

      const handicapService = serviceFactoryMock.getGolfHandicapService();
      vi.mocked(handicapService.getPlayerHandicap).mockResolvedValue({
        contactId: '500',
        firstName: 'Ken',
        lastName: 'Vadella',
        handicapIndex: null,
        roundsUsed: 0,
        totalRounds: 0,
      });

      const result = await service.getPlayerSeasonScores(500n);

      expect(result.scores).toHaveLength(0);
      expect(result.handicapIndex).toBe(15.0);
      expect(result.isInitialIndex).toBe(true);
      expect(result.initialDifferential).toBe(15.0);
    });
  });
});

function createValidScore() {
  return {
    courseId: '5',
    teeId: '1',
    datePlayed: '2024-01-15',
    holesPlayed: 9,
    totalScore: 40,
    totalsOnly: false,
    holeScores: [4, 5, 4, 5, 4, 4, 5, 4, 5],
  };
}

function createPlayerScore(
  teamSeasonId: string,
  rosterId: string,
  isAbsent: boolean,
  includeScore = !isAbsent,
) {
  const base = {
    teamSeasonId,
    rosterId,
    isAbsent,
    isSubstitute: false,
  };
  if (includeScore) {
    return { ...base, score: createValidScore() };
  }
  return base;
}
