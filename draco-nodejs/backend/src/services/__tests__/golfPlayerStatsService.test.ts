import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GolfScoreWithDetails } from '../../repositories/interfaces/IGolfScoreRepository.js';

const mockScoreRepo = {
  findAllByGolferId: vi.fn(),
};

const mockHandicapService = {
  calculateHandicapIndex: vi.fn().mockResolvedValue(null),
  calculateCourseHandicap: vi.fn().mockReturnValue({ courseHandicap: 0 }),
};

const repositoryFactoryMock = vi.hoisted(() => ({
  getGolfScoreRepository: vi.fn(() => mockScoreRepo),
}));

const serviceFactoryMock = vi.hoisted(() => ({
  getGolfHandicapService: vi.fn(() => mockHandicapService),
}));

vi.mock('../../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: repositoryFactoryMock,
}));

vi.mock('../serviceFactory.js', () => ({
  ServiceFactory: serviceFactoryMock,
}));

import { GolfPlayerStatsService } from '../golfPlayerStatsService.js';

const createMockCourse = (
  overrides: Record<string, number> = {},
): Record<string, number | bigint> => {
  const course: Record<string, number | bigint> = { id: 1n };
  for (let i = 1; i <= 18; i++) {
    course[`menspar${i}`] = 4;
    course[`womanspar${i}`] = 4;
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

type MockScoreOverrides = {
  id?: bigint;
  golferid?: bigint;
  totalscore?: number;
  holesplayed?: number;
  isabsent?: boolean;
  totalsonly?: boolean;
  holescrore1?: number;
  holescrore2?: number;
  holescrore3?: number;
  holescrore4?: number;
  holescrore5?: number;
  holescrore6?: number;
  holescrore7?: number;
  holescrore8?: number;
  holescrore9?: number;
  holescrore10?: number;
  holescrore11?: number;
  holescrore12?: number;
  holescrore13?: number;
  holescrore14?: number;
  holescrore15?: number;
  holescrore16?: number;
  holescrore17?: number;
  holescrore18?: number;
  putts1?: number | null;
  putts2?: number | null;
  putts3?: number | null;
  putts4?: number | null;
  putts5?: number | null;
  putts6?: number | null;
  putts7?: number | null;
  putts8?: number | null;
  putts9?: number | null;
  putts10?: number | null;
  putts11?: number | null;
  putts12?: number | null;
  putts13?: number | null;
  putts14?: number | null;
  putts15?: number | null;
  putts16?: number | null;
  putts17?: number | null;
  putts18?: number | null;
  fairway1?: boolean | null;
  fairway2?: boolean | null;
  fairway3?: boolean | null;
  fairway4?: boolean | null;
  fairway5?: boolean | null;
  fairway6?: boolean | null;
  fairway7?: boolean | null;
  fairway8?: boolean | null;
  fairway9?: boolean | null;
  fairway10?: boolean | null;
  fairway11?: boolean | null;
  fairway12?: boolean | null;
  fairway13?: boolean | null;
  fairway14?: boolean | null;
  fairway15?: boolean | null;
  fairway16?: boolean | null;
  fairway17?: boolean | null;
  fairway18?: boolean | null;
  gir1?: boolean | null;
  gir2?: boolean | null;
  gir3?: boolean | null;
  gir4?: boolean | null;
  gir5?: boolean | null;
  gir6?: boolean | null;
  gir7?: boolean | null;
  gir8?: boolean | null;
  gir9?: boolean | null;
  gir10?: boolean | null;
  gir11?: boolean | null;
  gir12?: boolean | null;
  gir13?: boolean | null;
  gir14?: boolean | null;
  gir15?: boolean | null;
  gir16?: boolean | null;
  gir17?: boolean | null;
  gir18?: boolean | null;
  golfcourse?: ReturnType<typeof createMockCourse>;
};

const createMockScore = (overrides: MockScoreOverrides = {}) => {
  const { golfcourse: overrideCourse, ...rest } = overrides;
  return {
    id: 1n,
    golferid: 1n,
    courseid: 1n,
    teeid: 1n,
    dateplayed: new Date('2024-01-01'),
    totalscore: 72,
    holesplayed: 18,
    isabsent: false,
    totalsonly: false,
    startindex: null,
    startindex9: null,
    holescrore1: 4,
    holescrore2: 4,
    holescrore3: 4,
    holescrore4: 4,
    holescrore5: 4,
    holescrore6: 4,
    holescrore7: 4,
    holescrore8: 4,
    holescrore9: 4,
    holescrore10: 4,
    holescrore11: 4,
    holescrore12: 4,
    holescrore13: 4,
    holescrore14: 4,
    holescrore15: 4,
    holescrore16: 4,
    holescrore17: 4,
    holescrore18: 4,
    putts1: null,
    putts2: null,
    putts3: null,
    putts4: null,
    putts5: null,
    putts6: null,
    putts7: null,
    putts8: null,
    putts9: null,
    putts10: null,
    putts11: null,
    putts12: null,
    putts13: null,
    putts14: null,
    putts15: null,
    putts16: null,
    putts17: null,
    putts18: null,
    fairway1: null,
    fairway2: null,
    fairway3: null,
    fairway4: null,
    fairway5: null,
    fairway6: null,
    fairway7: null,
    fairway8: null,
    fairway9: null,
    fairway10: null,
    fairway11: null,
    fairway12: null,
    fairway13: null,
    fairway14: null,
    fairway15: null,
    fairway16: null,
    fairway17: null,
    fairway18: null,
    gir1: null,
    gir2: null,
    gir3: null,
    gir4: null,
    gir5: null,
    gir6: null,
    gir7: null,
    gir8: null,
    gir9: null,
    gir10: null,
    gir11: null,
    gir12: null,
    gir13: null,
    gir14: null,
    gir15: null,
    gir16: null,
    gir17: null,
    gir18: null,
    ...rest,
    golfer: {
      id: 1n,
      contactid: 1n,
      initialdifferential: null,
      contact: {
        id: 1n,
        firstname: 'John',
        lastname: 'Doe',
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
      },
      gender: 'M',
    },
    golfcourse: overrideCourse ?? createMockCourse(),
    golfteeinformation: createMockTeeInfo(),
  };
};

const asScore = (s: ReturnType<typeof createMockScore>): GolfScoreWithDetails => s as never;

describe('GolfPlayerStatsService', () => {
  let service: GolfPlayerStatsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScoreRepo.findAllByGolferId.mockResolvedValue([]);
    mockHandicapService.calculateHandicapIndex.mockResolvedValue(null);
    mockHandicapService.calculateCourseHandicap.mockReturnValue({ courseHandicap: 0 });
    service = new GolfPlayerStatsService();
  });

  describe('getPlayerDetailedStats', () => {
    it('returns correct low and high actual scores', async () => {
      const score1 = createMockScore({ totalscore: 68 });
      const score2 = createMockScore({ id: 2n, totalscore: 80 });
      const score3 = createMockScore({ id: 3n, totalscore: 74 });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score1, score2, score3]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.lowActualScore).toBe(68);
      expect(result.highActualScore).toBe(80);
    });

    it('returns correct average score', async () => {
      const score1 = createMockScore({ totalscore: 70 });
      const score2 = createMockScore({ id: 2n, totalscore: 80 });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score1, score2]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.averageScore).toBe(75);
    });

    it('correctly counts score types', async () => {
      const score = createMockScore({
        holescrore1: 3,
        holescrore2: 4,
        holescrore3: 5,
      });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.scoreTypeCounts.birdies).toBe(1);
      expect(result.scoreTypeCounts.pars).toBeGreaterThanOrEqual(1);
      expect(result.scoreTypeCounts.bogeys).toBe(1);
    });

    it('calculates maxBirdiesInRound correctly', async () => {
      const score1 = createMockScore({
        holescrore1: 3,
        holescrore2: 3,
        holescrore3: 3,
      });
      const score2 = createMockScore({
        id: 2n,
        holescrore1: 3,
        holescrore2: 4,
        holescrore3: 4,
      });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score1, score2]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.maxBirdiesInRound).toBe(3);
    });

    it('filters out absent scores', async () => {
      const absentScore = createMockScore({ isabsent: true, totalscore: 60 });
      const normalScore = createMockScore({ id: 2n, isabsent: false, totalscore: 80 });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([absentScore, normalScore]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.roundsPlayed).toBe(1);
      expect(result.lowActualScore).toBe(80);
    });

    it('filters out totalsOnly scores', async () => {
      const totalsOnlyScore = createMockScore({ totalsonly: true, totalscore: 60 });
      const normalScore = createMockScore({ id: 2n, totalsonly: false, totalscore: 80 });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([totalsOnlyScore, normalScore]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.roundsPlayed).toBe(1);
      expect(result.lowActualScore).toBe(80);
    });

    it('returns undefined putt stats when no putt data', async () => {
      const score = createMockScore();
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.puttStats).toBeUndefined();
    });

    it('returns undefined fairway stats when no fairway data', async () => {
      const score = createMockScore();
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.fairwayStats).toBeUndefined();
    });

    it('returns undefined gir stats when no gir data', async () => {
      const score = createMockScore();
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.girStats).toBeUndefined();
    });

    it('calculates net scores when handicap index is available', async () => {
      const score = createMockScore({ totalscore: 80 });
      mockScoreRepo.findAllByGolferId.mockResolvedValue([score]);
      mockHandicapService.calculateHandicapIndex.mockResolvedValue(10);
      mockHandicapService.calculateCourseHandicap.mockReturnValue({ courseHandicap: 10 });

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.lowNetScore).toBe(70);
      expect(result.highNetScore).toBe(70);
      expect(result.averageNetScore).toBe(70);
    });

    it('returns zero scores when no rounds played', async () => {
      mockScoreRepo.findAllByGolferId.mockResolvedValue([]);

      const result = await service.getPlayerDetailedStats(1n, 1n, 'John', 'Doe');

      expect(result.roundsPlayed).toBe(0);
      expect(result.lowActualScore).toBe(0);
      expect(result.highActualScore).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it('includes contactId and name fields in result', async () => {
      mockScoreRepo.findAllByGolferId.mockResolvedValue([]);

      const result = await service.getPlayerDetailedStats(42n, 1n, 'Jane', 'Smith', 'Team A');

      expect(result.contactId).toBe('42');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.teamName).toBe('Team A');
    });
  });

  describe('calculateScoreTypeCounts', () => {
    it('identifies aces (hole-in-one)', () => {
      const result = service.calculateScoreTypeCounts([1], [3]);
      expect(result.aces).toBe(1);
      expect(result.birdies).toBe(0);
    });

    it('identifies eagles (2 under par)', () => {
      const result = service.calculateScoreTypeCounts([3], [5]);
      expect(result.eagles).toBe(1);
    });

    it('identifies birdies (1 under par)', () => {
      const result = service.calculateScoreTypeCounts([3], [4]);
      expect(result.birdies).toBe(1);
    });

    it('identifies pars (even)', () => {
      const result = service.calculateScoreTypeCounts([4], [4]);
      expect(result.pars).toBe(1);
    });

    it('identifies bogeys (1 over par)', () => {
      const result = service.calculateScoreTypeCounts([5], [4]);
      expect(result.bogeys).toBe(1);
    });

    it('identifies double bogeys (2 over par)', () => {
      const result = service.calculateScoreTypeCounts([6], [4]);
      expect(result.doubleBogeys).toBe(1);
    });

    it('identifies triples or worse (3+ over par)', () => {
      const result = service.calculateScoreTypeCounts([7], [4]);
      expect(result.triplesOrWorse).toBe(1);
    });

    it('skips zero or invalid scores', () => {
      const result = service.calculateScoreTypeCounts([0, -1, 4], [4, 4, 4]);
      expect(result.pars).toBe(1);
      expect(result.birdies).toBe(0);
      expect(result.bogeys).toBe(0);
    });

    it('counts multiple score types across holes', () => {
      const scores = [3, 4, 5, 2, 6, 7, 1];
      const pars = [4, 4, 4, 4, 4, 4, 3];
      const result = service.calculateScoreTypeCounts(scores, pars);

      expect(result.birdies).toBe(1);
      expect(result.pars).toBe(1);
      expect(result.bogeys).toBe(1);
      expect(result.eagles).toBe(1);
      expect(result.doubleBogeys).toBe(1);
      expect(result.triplesOrWorse).toBe(1);
      expect(result.aces).toBe(1);
    });
  });

  describe('calculatePuttStats', () => {
    it('computes total, average, best, and worst putts', () => {
      const score1 = createMockScore({ putts1: 2, putts2: 2, putts3: 2 });
      const score2 = createMockScore({ id: 2n, putts1: 1, putts2: 1, putts3: 1 });
      const result = service.calculatePuttStats([asScore(score1), asScore(score2)]);

      expect(result).toBeDefined();
      expect(result!.totalPutts).toBe(9);
      expect(result!.bestRound).toBe(3);
      expect(result!.worstRound).toBe(6);
      expect(result!.averagePerRound).toBe(4.5);
    });

    it('returns undefined when no putt data present', () => {
      const score = createMockScore();
      const result = service.calculatePuttStats([asScore(score)]);
      expect(result).toBeUndefined();
    });

    it('skips rounds without putt data', () => {
      const scoreWithPutts = createMockScore({ putts1: 2, putts2: 2 });
      const scoreWithoutPutts = createMockScore({ id: 2n });
      const result = service.calculatePuttStats([
        asScore(scoreWithPutts),
        asScore(scoreWithoutPutts),
      ]);

      expect(result).toBeDefined();
      expect(result!.totalPutts).toBe(4);
    });
  });

  describe('calculateFairwayStats', () => {
    it('excludes par 3 holes from denominator', () => {
      const courseWithPar3 = createMockCourse({ menspar1: 3, menspar2: 4, menspar3: 4 });
      const score = createMockScore({
        fairway1: true,
        fairway2: true,
        fairway3: false,
        golfcourse: courseWithPar3,
      });

      const getParForHole = (s: GolfScoreWithDetails, index: number) => {
        const key = `menspar${index + 1}`;
        return (s.golfcourse[key as keyof typeof s.golfcourse] as number) ?? 4;
      };

      const result = service.calculateFairwayStats([asScore(score)], getParForHole);

      expect(result).toBeDefined();
      expect(result!.bestPercentage).toBe(50);
    });

    it('returns undefined when no fairway data', () => {
      const score = createMockScore();
      const getParForHole = (_s: GolfScoreWithDetails, _i: number) => 4;
      const result = service.calculateFairwayStats([asScore(score)], getParForHole);
      expect(result).toBeUndefined();
    });

    it('computes average, best, and worst fairway percentages', () => {
      const score1 = createMockScore({ fairway1: true, fairway2: true });
      const score2 = createMockScore({ id: 2n, fairway1: false, fairway2: false });
      const getParForHole = (_s: GolfScoreWithDetails, _i: number) => 4;
      const result = service.calculateFairwayStats(
        [asScore(score1), asScore(score2)],
        getParForHole,
      );

      expect(result).toBeDefined();
      expect(result!.bestPercentage).toBe(100);
      expect(result!.worstPercentage).toBe(0);
    });
  });

  describe('calculateGirStats', () => {
    it('computes GIR percentages correctly', () => {
      const score = createMockScore({
        gir1: true,
        gir2: true,
        gir3: false,
        gir4: false,
      });
      const result = service.calculateGirStats([asScore(score)]);

      expect(result).toBeDefined();
      expect(result!.bestPercentage).toBe(50);
    });

    it('returns undefined when no GIR data', () => {
      const score = createMockScore();
      const result = service.calculateGirStats([asScore(score)]);
      expect(result).toBeUndefined();
    });

    it('computes averages across multiple rounds', () => {
      const score1 = createMockScore({ gir1: true, gir2: true });
      const score2 = createMockScore({ id: 2n, gir1: false, gir2: false });
      const result = service.calculateGirStats([asScore(score1), asScore(score2)]);

      expect(result).toBeDefined();
      expect(result!.averagePercentage).toBe(50);
    });
  });

  describe('calculateScramblingPercentage', () => {
    it('counts par-or-better saves when GIR is false', () => {
      const score = createMockScore({
        holescrore1: 4,
        holescrore2: 5,
        gir1: false,
        gir2: false,
      });
      const getParForHole = (_s: GolfScoreWithDetails, index: number) => (index === 0 ? 4 : 4);
      const result = service.calculateScramblingPercentage([asScore(score)], getParForHole);

      expect(result).toBeDefined();
      expect(result).toBe(50);
    });

    it('returns undefined when no missed GIR data', () => {
      const score = createMockScore();
      const getParForHole = (_s: GolfScoreWithDetails, _i: number) => 4;
      const result = service.calculateScramblingPercentage([asScore(score)], getParForHole);
      expect(result).toBeUndefined();
    });

    it('counts 100% when all missed GIRs result in par-or-better', () => {
      const score = createMockScore({
        holescrore1: 4,
        holescrore2: 4,
        gir1: false,
        gir2: false,
      });
      const getParForHole = (_s: GolfScoreWithDetails, _i: number) => 4;
      const result = service.calculateScramblingPercentage([asScore(score)], getParForHole);

      expect(result).toBe(100);
    });
  });

  describe('calculateHoleTypeStats', () => {
    it('averages scores by par type', () => {
      const courseWithMixedPars = createMockCourse({
        menspar1: 3,
        menspar2: 4,
        menspar3: 5,
      });
      const score = createMockScore({
        holescrore1: 3,
        holescrore2: 4,
        holescrore3: 5,
        golfcourse: courseWithMixedPars,
      });

      const getParForHole = (s: GolfScoreWithDetails, index: number) => {
        const key = `menspar${index + 1}`;
        return (s.golfcourse[key as keyof typeof s.golfcourse] as number) ?? 4;
      };

      const result = service.calculateHoleTypeStats([asScore(score)], getParForHole);

      expect(result).toBeDefined();
      expect(result!.par3Average).toBe(3);
      expect(result!.par4Average).toBe(4);
      expect(result!.par5Average).toBe(5);
    });

    it('returns undefined when no scores', () => {
      const getParForHole = (_s: GolfScoreWithDetails, _i: number) => 4;
      const result = service.calculateHoleTypeStats([], getParForHole);
      expect(result).toBeUndefined();
    });
  });

  describe('calculateConsistency', () => {
    it('returns standard deviation for multiple scores', () => {
      const result = service.calculateConsistency([70, 80]);
      expect(result).toBe(5);
    });

    it('returns undefined with fewer than 2 scores', () => {
      expect(service.calculateConsistency([])).toBeUndefined();
      expect(service.calculateConsistency([72])).toBeUndefined();
    });

    it('returns 0 for identical scores', () => {
      const result = service.calculateConsistency([72, 72, 72]);
      expect(result).toBe(0);
    });
  });
});
