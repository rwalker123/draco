import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfScoreService } from '../golfScoreService.js';
import type { IGolfScoreRepository } from '../../repositories/interfaces/IGolfScoreRepository.js';
import type { IGolfMatchRepository } from '../../repositories/interfaces/IGolfMatchRepository.js';
import type { IGolfRosterRepository } from '../../repositories/interfaces/IGolfRosterRepository.js';
import type { IGolfCourseRepository } from '../../repositories/interfaces/IGolfCourseRepository.js';
import type { IGolfLeagueRepository } from '../../repositories/interfaces/IGolfLeagueRepository.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import { GolfMatchStatus, FullTeamAbsentMode } from '../../utils/golfConstants.js';

describe('GolfScoreService', () => {
  let service: GolfScoreService;
  let mockScoreRepository: Partial<IGolfScoreRepository>;
  let mockMatchRepository: Partial<IGolfMatchRepository>;
  let mockRosterRepository: Partial<IGolfRosterRepository>;
  let mockCourseRepository: Partial<IGolfCourseRepository>;
  let mockLeagueRepository: Partial<IGolfLeagueRepository>;

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

  const createMockRosterEntry = (id: bigint, golferId: bigint, firstName: string) => ({
    id,
    golferid: golferId,
    golfer: {
      id: golferId,
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
    };
    mockMatchRepository = {
      findById: vi.fn(),
      findByIdWithScores: vi.fn(),
      updateStatus: vi.fn(),
      updatePoints: vi.fn(),
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

    service = new GolfScoreService(
      mockScoreRepository as IGolfScoreRepository,
      mockMatchRepository as IGolfMatchRepository,
      mockRosterRepository as IGolfRosterRepository,
      mockCourseRepository as IGolfCourseRepository,
      mockLeagueRepository as IGolfLeagueRepository,
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
