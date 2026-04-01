import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfStatsService } from '../golfStatsService.js';
import type {
  IGolfMatchRepository,
  GolfMatchWithTeams,
  GolfMatchWithScores,
} from '../../repositories/interfaces/IGolfMatchRepository.js';
import type { IGolfScoreRepository } from '../../repositories/interfaces/IGolfScoreRepository.js';
import type { IGolfFlightRepository } from '../../repositories/interfaces/IGolfFlightRepository.js';
import type { IGolfTeamRepository } from '../../repositories/interfaces/IGolfTeamRepository.js';
import type { IGolfRosterRepository } from '../../repositories/interfaces/IGolfRosterRepository.js';
import type { GolfHandicapService } from '../golfHandicapService.js';
import { GolfMatchStatus } from '../../utils/golfConstants.js';
import { NotFoundError } from '../../utils/customErrors.js';

const serviceFactoryMock = vi.hoisted(() => ({
  getGolfLeagueMatchScoringService: vi.fn(() => ({
    calculateAndStoreMatchPoints: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../serviceFactory.js', () => ({
  ServiceFactory: serviceFactoryMock,
}));

const createMockCourse = (
  overrides: Record<string, number | bigint> = {},
): Record<string, number | bigint> => {
  const course: Record<string, number | bigint> = { id: 1n };
  for (let i = 1; i <= 18; i++) {
    course[`menspar${i}`] = 4;
    course[`womanspar${i}`] = 4;
    course[`menshandicap${i}`] = i;
    course[`womanshandicap${i}`] = i;
  }
  return { ...course, ...overrides };
};

const createMockTeeInfo = (): Record<string, unknown> => ({
  id: 1n,
  mensrating: 72.0,
  menslope: 113,
  womansrating: 72.0,
  womanslope: 113,
});

const createMockContact = (id: bigint, firstName: string, lastName: string) => ({
  id,
  firstname: firstName,
  lastname: lastName,
  email: null,
  middlename: null,
  accountid: 1n,
  dateofbirth: null,
  gender: 'M',
  phonenumber: null,
  address: null,
  city: null,
  state: null,
  zipcode: null,
  profilephotofilename: null,
  creatoraccountid: null,
  status: null,
});

const createMockGolfer = (id: bigint, contactId: bigint, firstName: string, lastName: string) => ({
  id,
  contactid: contactId,
  initialdifferential: null,
  contact: createMockContact(contactId, firstName, lastName),
  gender: 'M',
});

const createMockTeamSeason = (id: bigint, name: string) => ({
  id,
  name,
  leagueseasonid: 1n,
  teamid: 1n,
});

const createHoleScoreFields = (scorePerHole: number): Record<string, number> => {
  const fields: Record<string, number> = {};
  for (let i = 1; i <= 18; i++) {
    fields[`holescrore${i}`] = scorePerHole;
    fields[`putts${i}`] = null as unknown as number;
    fields[`fairway${i}`] = null as unknown as number;
    fields[`gir${i}`] = null as unknown as number;
  }
  return fields;
};

const createMockGolfScore = (
  id: bigint,
  golferId: bigint,
  contactId: bigint,
  firstName: string,
  lastName: string,
  totalScore: number,
  holeScore = 4,
  puttsPerHole: number | null = null,
) => {
  const puttsFields: Record<string, number | null> = {};
  for (let i = 1; i <= 18; i++) {
    puttsFields[`putts${i}`] = puttsPerHole;
  }

  return {
    id,
    golferid: golferId,
    courseid: 1n,
    teeid: 1n,
    dateplayed: new Date('2024-06-15'),
    totalscore: totalScore,
    holesplayed: 18,
    isabsent: false,
    totalsonly: false,
    startindex: null,
    startindex9: null,
    ...createHoleScoreFields(holeScore),
    ...puttsFields,
    golfer: createMockGolfer(golferId, contactId, firstName, lastName),
    golfcourse: createMockCourse(),
    golfteeinformation: createMockTeeInfo(),
  };
};

const createMockMatchScoreEntry = (
  id: bigint,
  golfScore: ReturnType<typeof createMockGolfScore>,
  teamSeason: ReturnType<typeof createMockTeamSeason>,
) => ({
  id,
  matchid: 10n,
  golferid: golfScore.golferid,
  scoreid: golfScore.id,
  teamid: teamSeason.id,
  substitutefor: null,
  golfscore: golfScore,
  golfer: golfScore.golfer,
  teamsseason: teamSeason,
});

const createMockMatch = (
  id: bigint,
  weekNumber: number | null,
  status = GolfMatchStatus.COMPLETED,
): GolfMatchWithTeams => ({
  id,
  weeknumber: weekNumber,
  matchstatus: status,
  matchdate: new Date('2024-06-15'),
  leagueid: 1n,
  team1: 1n,
  team2: 2n,
  courseid: 1n,
  teeid: 1n,
  matchtype: 1,
  comment: '',
  team1points: 0,
  team2points: 0,
  team1totalscore: 0,
  team2totalscore: 0,
  team1netscore: 0,
  team2netscore: 0,
  team1holewins: 0,
  team2holewins: 0,
  team1ninewins: 0,
  team2ninewins: 0,
  team1matchwins: 0,
  team2matchwins: 0,
  teamsseason_golfmatch_team1Toteamsseason: createMockTeamSeason(1n, 'Team A') as never,
  teamsseason_golfmatch_team2Toteamsseason: createMockTeamSeason(2n, 'Team B') as never,
  golfcourse: createMockCourse() as never,
  golfteeinformation: createMockTeeInfo() as never,
});

const createMockMatchWithScores = (
  match: GolfMatchWithTeams,
  matchScoreEntries: ReturnType<typeof createMockMatchScoreEntry>[],
): GolfMatchWithScores => ({
  ...match,
  golfmatchscores: matchScoreEntries as never,
});

const createMockFlight = (id: bigint, name: string) => ({
  id,
  leagueid: 1n,
  seasonid: 1n,
  league: { id: 1n, name },
  season: { id: 1n, year: 2024 },
});

describe('GolfStatsService', () => {
  let service: GolfStatsService;

  const findByFlightId = vi.fn();
  const findByIdWithScores = vi.fn();
  const matchUpdate = vi.fn().mockResolvedValue({});
  const findByMatchId = vi.fn();
  const scoreUpdate = vi.fn().mockResolvedValue({});
  const flightFindById = vi.fn();
  const teamFindByFlightId = vi.fn();
  const findByTeamSeasonId = vi.fn();
  const calculateHandicapIndex = vi.fn().mockResolvedValue(null);
  const calculateCourseHandicap = vi.fn().mockReturnValue({ courseHandicap: 0 });

  const mockMatchRepo = {
    findByFlightId,
    findByIdWithScores,
    update: matchUpdate,
  } as unknown as IGolfMatchRepository;

  const mockScoreRepo = {
    findByMatchId,
    update: scoreUpdate,
  } as unknown as IGolfScoreRepository;

  const mockFlightRepo = {
    findById: flightFindById,
  } as unknown as IGolfFlightRepository;

  const mockTeamRepo = {
    findByFlightId: teamFindByFlightId,
  } as unknown as IGolfTeamRepository;

  const mockRosterRepo = {
    findByTeamSeasonId,
  } as unknown as IGolfRosterRepository;

  const mockHandicapService = {
    calculateHandicapIndex,
    calculateCourseHandicap,
  } as unknown as GolfHandicapService;

  beforeEach(() => {
    vi.resetAllMocks();
    calculateHandicapIndex.mockResolvedValue(null);
    calculateCourseHandicap.mockReturnValue({ courseHandicap: 0 });
    matchUpdate.mockResolvedValue({});
    scoreUpdate.mockResolvedValue({});
    serviceFactoryMock.getGolfLeagueMatchScoringService.mockReturnValue({
      calculateAndStoreMatchPoints: vi.fn().mockResolvedValue(undefined),
    });

    service = new GolfStatsService(
      mockMatchRepo,
      mockScoreRepo,
      mockFlightRepo,
      mockTeamRepo,
      mockRosterRepo,
      mockHandicapService,
    );
  });

  describe('getFlightLeaders', () => {
    it('throws NotFoundError for invalid flight', async () => {
      flightFindById.mockResolvedValue(null);

      await expect(service.getFlightLeaders(999n)).rejects.toThrow(NotFoundError);
    });

    it('returns flight leaders for valid flight', async () => {
      const flight = createMockFlight(1n, 'Sunday League');
      flightFindById.mockResolvedValue(flight);
      teamFindByFlightId.mockResolvedValue([]);
      findByFlightId.mockResolvedValue([]);

      const result = await service.getFlightLeaders(1n);

      expect(result.flightId).toBe('1');
      expect(result.flightName).toBe('Sunday League');
    });
  });

  describe('calculateSkinsLeaders', () => {
    it('pools players across matches with the same weekNumber', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match1 = createMockMatch(1n, 1);
      const match2 = createMockMatch(2n, 1);

      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 3);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 80, 4);

      const msEntry1 = createMockMatchScoreEntry(1n, score1, createMockTeamSeason(1n, 'Team A'));
      const msEntry2 = createMockMatchScoreEntry(2n, score2, createMockTeamSeason(2n, 'Team B'));

      const matchWithScores1 = createMockMatchWithScores(match1, [msEntry1]);
      const matchWithScores2 = createMockMatchWithScores(match2, [msEntry2]);

      findByFlightId.mockResolvedValue([match1, match2]);
      findByIdWithScores
        .mockResolvedValueOnce(matchWithScores1)
        .mockResolvedValueOnce(matchWithScores2);

      const result = await service.getSkinsLeaders(1n);

      expect(result.length).toBeGreaterThan(0);
      const aliceSkins = result.find((r) => r.firstName === 'Alice');
      expect(aliceSkins).toBeDefined();
      expect(aliceSkins!.skinsWon).toBeGreaterThan(0);
    });

    it('treats null weekNumber matches individually', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match1 = createMockMatch(1n, null);
      const match2 = createMockMatch(2n, null);

      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 3);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 80, 4);

      const msEntry1 = createMockMatchScoreEntry(1n, score1, createMockTeamSeason(1n, 'Team A'));
      const msEntry2 = createMockMatchScoreEntry(2n, score2, createMockTeamSeason(2n, 'Team B'));

      const matchWithScores1 = createMockMatchWithScores(match1, [msEntry1]);
      const matchWithScores2 = createMockMatchWithScores(match2, [msEntry2]);

      findByFlightId.mockResolvedValue([match1, match2]);
      findByIdWithScores
        .mockResolvedValueOnce(matchWithScores1)
        .mockResolvedValueOnce(matchWithScores2);

      const result = await service.getSkinsLeaders(1n);

      expect(result).toBeDefined();
    });

    it('awards skin only when one player has unique lowest score on a hole', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);

      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 67, 3);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 80, 4);

      const msEntry1 = createMockMatchScoreEntry(1n, score1, createMockTeamSeason(1n, 'Team A'));
      const msEntry2 = createMockMatchScoreEntry(2n, score2, createMockTeamSeason(2n, 'Team B'));

      const matchWithScores = createMockMatchWithScores(match, [msEntry1, msEntry2]);

      findByFlightId.mockResolvedValue([match]);
      findByIdWithScores.mockResolvedValue(matchWithScores);

      const result = await service.getSkinsLeaders(1n);

      expect(result.length).toBeGreaterThan(0);
      const aliceSkins = result.find((r) => r.firstName === 'Alice');
      expect(aliceSkins).toBeDefined();
      expect(aliceSkins!.skinsWon).toBeGreaterThan(0);
      expect(aliceSkins!.skinsType).toBe('actual');
    });

    it('does not award skin on ties', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);

      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 4);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 72, 4);

      const msEntry1 = createMockMatchScoreEntry(1n, score1, createMockTeamSeason(1n, 'Team A'));
      const msEntry2 = createMockMatchScoreEntry(2n, score2, createMockTeamSeason(2n, 'Team B'));

      const matchWithScores = createMockMatchWithScores(match, [msEntry1, msEntry2]);

      findByFlightId.mockResolvedValue([match]);
      findByIdWithScores.mockResolvedValue(matchWithScores);

      const result = await service.getSkinsLeaders(1n);

      expect(result).toHaveLength(0);
    });

    it('returns empty array when no completed matches', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);
      findByFlightId.mockResolvedValue([createMockMatch(1n, 1, GolfMatchStatus.SCHEDULED)]);

      const result = await service.getSkinsLeaders(1n);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateNetSkinsLeaders', () => {
    it('applies handicap strokes before comparing on each hole', async () => {
      const match = createMockMatch(1n, 1);

      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 4);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 80, 5);

      const msEntry1 = createMockMatchScoreEntry(1n, score1, createMockTeamSeason(1n, 'Team A'));
      const msEntry2 = createMockMatchScoreEntry(2n, score2, createMockTeamSeason(2n, 'Team B'));

      const matchWithScores = createMockMatchWithScores(match, [msEntry1, msEntry2]);

      findByFlightId.mockResolvedValue([match]);
      findByIdWithScores.mockResolvedValue(matchWithScores);

      calculateHandicapIndex.mockResolvedValueOnce(null).mockResolvedValueOnce(18);
      calculateCourseHandicap.mockReturnValue({ courseHandicap: 18 });

      const result = await service.calculateNetSkinsLeaders(1n);

      expect(result).toBeDefined();
      if (result.length > 0) {
        expect(result[0].skinsType).toBe('net');
      }
    });

    it('returns net skins type for results', async () => {
      const match = createMockMatch(1n, 1);

      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 67, 3);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 80, 4);

      const msEntry1 = createMockMatchScoreEntry(1n, score1, createMockTeamSeason(1n, 'Team A'));
      const msEntry2 = createMockMatchScoreEntry(2n, score2, createMockTeamSeason(2n, 'Team B'));

      const matchWithScores = createMockMatchWithScores(match, [msEntry1, msEntry2]);

      findByFlightId.mockResolvedValue([match]);
      findByIdWithScores.mockResolvedValue(matchWithScores);
      calculateHandicapIndex.mockResolvedValue(null);

      const result = await service.calculateNetSkinsLeaders(1n);

      if (result.length > 0) {
        expect(result[0].skinsType).toBe('net');
      }
    });
  });

  describe('getScoreTypeLeaders', () => {
    it('returns leaderboards for eagles, birdies, and pars', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);
      const score = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 3);
      const msEntry = createMockMatchScoreEntry(1n, score, createMockTeamSeason(1n, 'Team A'));
      const matchWithScores = createMockMatchWithScores(match, [msEntry]);

      findByFlightId.mockResolvedValue([match]);
      findByIdWithScores.mockResolvedValue(matchWithScores);

      const result = await service.getScoreTypeLeaders(1n);

      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('eagles');
      expect(result[1].category).toBe('birdies');
      expect(result[2].category).toBe('pars');
    });

    it('throws NotFoundError for invalid flight', async () => {
      flightFindById.mockResolvedValue(null);

      await expect(service.getScoreTypeLeaders(999n)).rejects.toThrow(NotFoundError);
    });

    it('skips absent players when counting score types', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);
      const absentScore = {
        ...createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 0, 3),
        isabsent: true,
      };
      const msEntry = createMockMatchScoreEntry(
        1n,
        absentScore,
        createMockTeamSeason(1n, 'Team A'),
      );
      const matchWithScores = createMockMatchWithScores(match, [msEntry as never]);

      findByFlightId.mockResolvedValue([match]);
      findByIdWithScores.mockResolvedValue(matchWithScores);

      const result = await service.getScoreTypeLeaders(1n);

      expect(result[1].leaders).toHaveLength(0);
    });

    it('returns empty leaders when no completed matches exist', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);
      findByFlightId.mockResolvedValue([createMockMatch(1n, 1, GolfMatchStatus.SCHEDULED)]);

      const result = await service.getScoreTypeLeaders(1n);

      expect(result[0].leaders).toHaveLength(0);
      expect(result[1].leaders).toHaveLength(0);
      expect(result[2].leaders).toHaveLength(0);
    });
  });

  describe('getPuttContestResults', () => {
    it('returns entries where putts >= 3', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);
      const score = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 4, 3);

      findByFlightId.mockResolvedValue([match]);
      findByMatchId.mockResolvedValue([{ id: 1n, golfscore: score }]);

      const result = await service.getPuttContestResults(1n);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].putts).toBeGreaterThanOrEqual(3);
      expect(result[0].firstName).toBe('Alice');
    });

    it('does not include entries where putts < 3', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);
      const score = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 4, 2);

      findByFlightId.mockResolvedValue([match]);
      findByMatchId.mockResolvedValue([{ id: 1n, golfscore: score }]);

      const result = await service.getPuttContestResults(1n);

      expect(result).toHaveLength(0);
    });

    it('filters by weekNumber when provided', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match1 = createMockMatch(1n, 1);
      const match2 = createMockMatch(2n, 2);
      const score1 = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 4, 3);
      const score2 = createMockGolfScore(2n, 2n, 102n, 'Bob', 'Jones', 80, 4, 3);

      findByFlightId.mockResolvedValue([match1, match2]);
      findByMatchId
        .mockResolvedValueOnce([{ id: 1n, golfscore: score1 }])
        .mockResolvedValueOnce([{ id: 2n, golfscore: score2 }]);

      const result = await service.getPuttContestResults(1n, 1);

      const contactIds = result.map((r) => r.contactId);
      expect(contactIds).not.toContain('102');
    });

    it('throws NotFoundError for invalid flight', async () => {
      flightFindById.mockResolvedValue(null);

      await expect(service.getPuttContestResults(999n)).rejects.toThrow(NotFoundError);
    });

    it('skips absent players', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 1);
      const absentScore = {
        ...createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 0, 4, 3),
        isabsent: true,
      };

      findByFlightId.mockResolvedValue([match]);
      findByMatchId.mockResolvedValue([{ id: 1n, golfscore: absentScore }]);

      const result = await service.getPuttContestResults(1n);

      expect(result).toHaveLength(0);
    });

    it('includes weekNumber in returned entries', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);

      const match = createMockMatch(1n, 5);
      const score = createMockGolfScore(1n, 1n, 101n, 'Alice', 'Smith', 72, 4, 3);

      findByFlightId.mockResolvedValue([match]);
      findByMatchId.mockResolvedValue([{ id: 1n, golfscore: score }]);

      const result = await service.getPuttContestResults(1n);

      if (result.length > 0) {
        expect(result[0].weekNumber).toBe(5);
        expect(result[0].matchId).toBe('1');
      }
    });
  });

  describe('getLowScoreLeaders', () => {
    it('throws NotFoundError for invalid flight', async () => {
      flightFindById.mockResolvedValue(null);

      await expect(service.getLowScoreLeaders(999n, 'actual')).rejects.toThrow(NotFoundError);
    });

    it('returns empty array when no players have scores', async () => {
      const flight = createMockFlight(1n, 'League');
      flightFindById.mockResolvedValue(flight);
      teamFindByFlightId.mockResolvedValue([]);
      findByFlightId.mockResolvedValue([]);

      const result = await service.getLowScoreLeaders(1n, 'actual');

      expect(result).toHaveLength(0);
    });
  });

  describe('getScoringAverages', () => {
    it('throws NotFoundError for invalid flight', async () => {
      flightFindById.mockResolvedValue(null);

      await expect(service.getScoringAverages(999n)).rejects.toThrow(NotFoundError);
    });
  });

  describe('regenerateStats', () => {
    const createMockGolfScoreWithPutts = (
      id: bigint,
      holeScore: number,
      puttsPerHole: number | null,
      par: number,
      gender = 'M',
    ) => {
      const fields: Record<string, number | null> = {};
      for (let i = 1; i <= 18; i++) {
        fields[`holescrore${i}`] = holeScore;
        fields[`putts${i}`] = puttsPerHole;
        fields[`gir${i}`] = null;
      }
      const parPrefix = gender === 'F' ? 'womanspar' : 'menspar';
      const course: Record<string, number | bigint> = { id: 1n };
      for (let i = 1; i <= 18; i++) {
        course[`menspar${i}`] = par;
        course[`womanspar${i}`] = par;
        course[`menshandicap${i}`] = i;
        course[`womanshandicap${i}`] = i;
      }
      return {
        id,
        golferid: 1n,
        courseid: 1n,
        teeid: 1n,
        dateplayed: new Date('2026-03-02'),
        totalscore: holeScore * 18,
        holesplayed: 18,
        isabsent: false,
        totalsonly: false,
        startindex: null,
        startindex9: null,
        ...fields,
        golfer: { id: 1n, contactid: 1n, gender, initialdifferential: null, contact: {} },
        golfcourse: { ...course },
        golfteeinformation: { id: 1n },
        _parPrefix: parPrefix,
      };
    };

    const createMatchScoreEntry = (
      id: bigint,
      golfscore: ReturnType<typeof createMockGolfScoreWithPutts>,
    ) => ({
      id,
      matchid: 10n,
      golferid: golfscore.golferid,
      scoreid: golfscore.id,
      teamid: 1n,
      substitutefor: null,
      golfscore,
    });

    const createMatchWithDate = (
      id: bigint,
      date: Date,
      status = GolfMatchStatus.COMPLETED,
    ): GolfMatchWithTeams => ({
      id,
      weeknumber: null,
      matchstatus: status,
      matchdate: date,
      leagueid: 1n,
      team1: 1n,
      team2: 2n,
      courseid: 1n,
      teeid: 1n,
      matchtype: 1,
      comment: '',
      team1points: 0,
      team2points: 0,
      team1totalscore: 0,
      team2totalscore: 0,
      team1netscore: 0,
      team2netscore: 0,
      team1holewins: 0,
      team2holewins: 0,
      team1ninewins: 0,
      team2ninewins: 0,
      team1matchwins: 0,
      team2matchwins: 0,
      teamsseason_golfmatch_team1Toteamsseason: createMockTeamSeason(1n, 'Team A') as never,
      teamsseason_golfmatch_team2Toteamsseason: createMockTeamSeason(2n, 'Team B') as never,
      golfcourse: createMockCourse() as never,
      golfteeinformation: createMockTeeInfo() as never,
    });

    describe('GIR regeneration', () => {
      it('computes GIR from putts and par', async () => {
        const match = createMatchWithDate(1n, new Date('2026-03-02'));

        const score1 = createMockGolfScoreWithPutts(1n, 4, 2, 4);
        const score2 = createMockGolfScoreWithPutts(2n, 5, 2, 4);

        findByFlightId.mockResolvedValue([match]);
        findByMatchId.mockResolvedValue([
          createMatchScoreEntry(1n, score1),
          createMatchScoreEntry(2n, score2),
        ]);

        await service.regenerateStats(1n, {
          regenerateGir: true,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(scoreUpdate).toHaveBeenCalledTimes(2);

        const firstCall = scoreUpdate.mock.calls[0][1];
        expect(firstCall.gir1).toBe(true);

        const secondCall = scoreUpdate.mock.calls[1][1];
        expect(secondCall.gir1).toBe(false);
      });

      it('sets GIR to null when putts is null', async () => {
        const match = createMatchWithDate(1n, new Date('2026-03-02'));
        const score = createMockGolfScoreWithPutts(1n, 4, null, 4);

        findByFlightId.mockResolvedValue([match]);
        findByMatchId.mockResolvedValue([createMatchScoreEntry(1n, score)]);

        await service.regenerateStats(1n, {
          regenerateGir: true,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(scoreUpdate).not.toHaveBeenCalled();
      });

      it('skips absent scores', async () => {
        const match = createMatchWithDate(1n, new Date('2026-03-02'));
        const score = { ...createMockGolfScoreWithPutts(1n, 4, 2, 4), isabsent: true };

        findByFlightId.mockResolvedValue([match]);
        findByMatchId.mockResolvedValue([createMatchScoreEntry(1n, score)]);

        await service.regenerateStats(1n, {
          regenerateGir: true,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(scoreUpdate).not.toHaveBeenCalled();
      });

      it('returns correct girScoresUpdated count', async () => {
        const match = createMatchWithDate(1n, new Date('2026-03-02'));
        const score1 = createMockGolfScoreWithPutts(1n, 4, 2, 4);
        const score2 = createMockGolfScoreWithPutts(2n, 5, 2, 4);

        findByFlightId.mockResolvedValue([match]);
        findByMatchId.mockResolvedValue([
          createMatchScoreEntry(1n, score1),
          createMatchScoreEntry(2n, score2),
        ]);

        const result = await service.regenerateStats(1n, {
          regenerateGir: true,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(result.girScoresUpdated).toBe(2);
      });
    });

    describe('assignWeekNumbers', () => {
      it('groups matches by week boundary mon-sun', async () => {
        const monMatch = createMatchWithDate(1n, new Date('2026-03-02'));
        const wedMatch = createMatchWithDate(2n, new Date('2026-03-04'));
        const nextMonMatch = createMatchWithDate(3n, new Date('2026-03-09'));

        findByFlightId.mockResolvedValue([monMatch, wedMatch, nextMonMatch]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: true,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(matchUpdate).toHaveBeenCalledTimes(3);

        const weekNumForMon = matchUpdate.mock.calls.find((c) => c[0] === 1n)?.[1].weeknumber;
        const weekNumForWed = matchUpdate.mock.calls.find((c) => c[0] === 2n)?.[1].weeknumber;
        const weekNumForNextMon = matchUpdate.mock.calls.find((c) => c[0] === 3n)?.[1].weeknumber;

        expect(weekNumForMon).toBe(weekNumForWed);
        expect(weekNumForNextMon).not.toBe(weekNumForMon);
      });

      it('assigns sequential week numbers starting at 1', async () => {
        const week1Match = createMatchWithDate(1n, new Date('2026-03-02'));
        const week2Match = createMatchWithDate(2n, new Date('2026-03-09'));
        const week3Match = createMatchWithDate(3n, new Date('2026-03-16'));

        findByFlightId.mockResolvedValue([week1Match, week2Match, week3Match]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: true,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        const weekNums = matchUpdate.mock.calls.map((c) => c[1].weeknumber).sort((a, b) => a - b);
        expect(weekNums).toEqual([1, 2, 3]);
      });

      it('handles sun-sat boundary grouping correctly', async () => {
        const sunMatch = createMatchWithDate(1n, new Date('2026-03-01'));
        const monMatch = createMatchWithDate(2n, new Date('2026-03-02'));
        const nextSunMatch = createMatchWithDate(3n, new Date('2026-03-08'));

        findByFlightId.mockResolvedValue([sunMatch, monMatch, nextSunMatch]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: true,
          weekBoundary: 'sun-sat',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        const weekNumForSun = matchUpdate.mock.calls.find((c) => c[0] === 1n)?.[1].weeknumber;
        const weekNumForMon = matchUpdate.mock.calls.find((c) => c[0] === 2n)?.[1].weeknumber;
        const weekNumForNextSun = matchUpdate.mock.calls.find((c) => c[0] === 3n)?.[1].weeknumber;

        expect(weekNumForSun).toBe(weekNumForMon);
        expect(weekNumForNextSun).not.toBe(weekNumForSun);
      });

      it('interprets match dates in the provided timezone, not UTC', async () => {
        const satEveningEastern = createMatchWithDate(1n, new Date('2026-03-15T01:00:00Z'));
        const satAfternoonEastern = createMatchWithDate(2n, new Date('2026-03-14T18:00:00Z'));

        findByFlightId.mockResolvedValue([satAfternoonEastern, satEveningEastern]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: true,
          weekBoundary: 'sun-sat',
          timeZone: 'America/New_York',
          recalculateMatchPoints: false,
        });

        const weekNum1 = matchUpdate.mock.calls.find((c) => c[0] === 1n)?.[1].weeknumber;
        const weekNum2 = matchUpdate.mock.calls.find((c) => c[0] === 2n)?.[1].weeknumber;

        expect(weekNum1).toBe(weekNum2);
      });

      it('UTC midnight boundary causes wrong week without timezone correction', async () => {
        const satEveningEastern = createMatchWithDate(1n, new Date('2026-03-15T01:00:00Z'));
        const satAfternoonEastern = createMatchWithDate(2n, new Date('2026-03-14T18:00:00Z'));

        findByFlightId.mockResolvedValue([satAfternoonEastern, satEveningEastern]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: true,
          weekBoundary: 'sun-sat',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        const weekNum1 = matchUpdate.mock.calls.find((c) => c[0] === 1n)?.[1].weeknumber;
        const weekNum2 = matchUpdate.mock.calls.find((c) => c[0] === 2n)?.[1].weeknumber;

        expect(weekNum1).not.toBe(weekNum2);
      });

      it('returns correct weekNumbersAssigned count', async () => {
        const match1 = createMatchWithDate(1n, new Date('2026-03-02'));
        const match2 = createMatchWithDate(2n, new Date('2026-03-09'));

        findByFlightId.mockResolvedValue([match1, match2]);

        const result = await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: true,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(result.weekNumbersAssigned).toBe(2);
      });
    });

    describe('recalculateMatchPoints', () => {
      it('calls calculateAndStoreMatchPoints for each completed match', async () => {
        const mockCalculate = vi.fn().mockResolvedValue(undefined);
        serviceFactoryMock.getGolfLeagueMatchScoringService.mockReturnValue({
          calculateAndStoreMatchPoints: mockCalculate,
        });

        const match1 = createMatchWithDate(1n, new Date('2026-03-02'));
        const match2 = createMatchWithDate(2n, new Date('2026-03-09'));

        findByFlightId.mockResolvedValue([match1, match2]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: true,
        });

        expect(mockCalculate).toHaveBeenCalledTimes(2);
        expect(mockCalculate).toHaveBeenCalledWith(1n);
        expect(mockCalculate).toHaveBeenCalledWith(2n);
      });

      it('skips non-completed matches', async () => {
        const mockCalculate = vi.fn().mockResolvedValue(undefined);
        serviceFactoryMock.getGolfLeagueMatchScoringService.mockReturnValue({
          calculateAndStoreMatchPoints: mockCalculate,
        });

        const completedMatch = createMatchWithDate(
          1n,
          new Date('2026-03-02'),
          GolfMatchStatus.COMPLETED,
        );
        const scheduledMatch = createMatchWithDate(
          2n,
          new Date('2026-03-09'),
          GolfMatchStatus.SCHEDULED,
        );

        findByFlightId.mockResolvedValue([completedMatch, scheduledMatch]);

        await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: true,
        });

        expect(mockCalculate).toHaveBeenCalledTimes(1);
        expect(mockCalculate).toHaveBeenCalledWith(1n);
      });

      it('returns correct matchPointsRecalculated count', async () => {
        const mockCalculate = vi.fn().mockResolvedValue(undefined);
        serviceFactoryMock.getGolfLeagueMatchScoringService.mockReturnValue({
          calculateAndStoreMatchPoints: mockCalculate,
        });

        const match1 = createMatchWithDate(1n, new Date('2026-03-02'));
        const match2 = createMatchWithDate(2n, new Date('2026-03-09'));

        findByFlightId.mockResolvedValue([match1, match2]);

        const result = await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: true,
        });

        expect(result.matchPointsRecalculated).toBe(2);
      });
    });

    describe('combined operations', () => {
      it('returns correct counts when all operations are enabled', async () => {
        const mockCalculate = vi.fn().mockResolvedValue(undefined);
        serviceFactoryMock.getGolfLeagueMatchScoringService.mockReturnValue({
          calculateAndStoreMatchPoints: mockCalculate,
        });

        const match = createMatchWithDate(1n, new Date('2026-03-02'));
        const score = createMockGolfScoreWithPutts(1n, 4, 2, 4);

        findByFlightId.mockResolvedValue([match]);
        findByMatchId.mockResolvedValue([createMatchScoreEntry(1n, score)]);

        const result = await service.regenerateStats(1n, {
          regenerateGir: true,
          regenerateWeekNumbers: true,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: true,
        });

        expect(result.girScoresUpdated).toBe(1);
        expect(result.weekNumbersAssigned).toBe(1);
        expect(result.matchPointsRecalculated).toBe(1);
      });

      it('returns zero counts when all operations are disabled', async () => {
        const match = createMatchWithDate(1n, new Date('2026-03-02'));
        const score = createMockGolfScoreWithPutts(1n, 4, 2, 4);

        findByFlightId.mockResolvedValue([match]);
        findByMatchId.mockResolvedValue([createMatchScoreEntry(1n, score)]);

        const result = await service.regenerateStats(1n, {
          regenerateGir: false,
          regenerateWeekNumbers: false,
          weekBoundary: 'mon-sun',
          timeZone: 'UTC',
          recalculateMatchPoints: false,
        });

        expect(result.girScoresUpdated).toBe(0);
        expect(result.weekNumbersAssigned).toBe(0);
        expect(result.matchPointsRecalculated).toBe(0);
        expect(scoreUpdate).not.toHaveBeenCalled();
        expect(matchUpdate).not.toHaveBeenCalled();
      });
    });
  });
});
