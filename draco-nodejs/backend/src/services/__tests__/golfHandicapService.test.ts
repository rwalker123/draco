import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfHandicapService } from '../golfHandicapService.js';
import type { IGolfScoreRepository } from '../../repositories/interfaces/IGolfScoreRepository.js';
import type { IGolfFlightRepository } from '../../repositories/interfaces/IGolfFlightRepository.js';
import type { IGolfRosterRepository } from '../../repositories/interfaces/IGolfRosterRepository.js';
import type { IGolfTeamRepository } from '../../repositories/interfaces/IGolfTeamRepository.js';
import type { IGolfTeeRepository } from '../../repositories/interfaces/IGolfTeeRepository.js';
import type { IGolfCourseRepository } from '../../repositories/interfaces/IGolfCourseRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';

const createMockCourse = (): Record<string, number | bigint> => {
  const result: Record<string, number | bigint> = { id: 1n };
  for (let i = 1; i <= 18; i++) {
    result[`menspar${i}`] = 4;
    result[`womanspar${i}`] = 4;
    result[`menshandicap${i}`] = i;
    result[`womanshandicap${i}`] = i;
  }
  return result;
};

const createMockTee = (
  overrides: Partial<Record<string, number | bigint | null>> = {},
): Record<string, number | bigint | null> => ({
  id: 1n,
  courseid: 1n,
  mensrating: 72.0,
  menslope: 130,
  womansrating: 74.0,
  womanslope: 125,
  mensratingfront9: 36.0,
  mensratingback9: 36.0,
  menslopefront9: 130,
  mensslopeback9: 130,
  womansratingfront9: 37.0,
  womansratingback9: 37.0,
  womanslopefront9: 125,
  womansslopeback9: 125,
  ...overrides,
});

describe('GolfHandicapService', () => {
  let service: GolfHandicapService;
  let mockScoreRepository: Partial<IGolfScoreRepository>;
  let mockFlightRepository: Partial<IGolfFlightRepository>;
  let mockRosterRepository: Partial<IGolfRosterRepository>;
  let mockTeamRepository: Partial<IGolfTeamRepository>;
  let mockTeeRepository: Partial<IGolfTeeRepository>;
  let mockCourseRepository: Partial<IGolfCourseRepository>;

  beforeEach(() => {
    mockScoreRepository = {
      findByGolferId: vi.fn(),
    };
    mockFlightRepository = {
      findById: vi.fn(),
      findBySeasonId: vi.fn(),
    };
    mockRosterRepository = {
      findGolfersByIds: vi.fn(),
      updateGolfer: vi.fn(),
    };
    mockTeamRepository = {
      findByFlightId: vi.fn(),
    };
    mockTeeRepository = {
      findById: vi.fn(),
    };
    mockCourseRepository = {
      findById: vi.fn(),
    };

    service = new GolfHandicapService(
      mockScoreRepository as IGolfScoreRepository,
      mockFlightRepository as IGolfFlightRepository,
      mockRosterRepository as IGolfRosterRepository,
      mockTeamRepository as IGolfTeamRepository,
      mockTeeRepository as IGolfTeeRepository,
      mockCourseRepository as IGolfCourseRepository,
    );
  });

  describe('calculateCourseHandicap', () => {
    it('calculates course handicap correctly', () => {
      const result = service.calculateCourseHandicap(10.0, 130, 72.0, 72);

      expect(result.courseHandicap).toBeCloseTo(12);
    });

    it('calculates course handicap with different slope', () => {
      const result = service.calculateCourseHandicap(10.0, 113, 72.0, 72);

      expect(result.courseHandicap).toBe(10);
    });

    it('handles zero handicap index', () => {
      const result = service.calculateCourseHandicap(0, 130, 72.0, 72);

      expect(result.courseHandicap).toBe(0);
    });

    it('handles negative handicap index (plus handicap)', () => {
      const result = service.calculateCourseHandicap(-2.0, 130, 72.0, 72);

      expect(result.courseHandicap).toBeLessThan(0);
    });
  });

  describe('calculateDifferential', () => {
    it('calculates differential correctly for standard round', () => {
      const result = service.calculateDifferential(85, 72.0, 130);

      const expected = ((85 - 72.0) * 113) / 130;
      expect(result).toBe(Math.round(expected * 10) / 10);
    });

    it('calculates differential for scratch golfer round', () => {
      const result = service.calculateDifferential(72, 72.0, 113);

      expect(result).toBe(0);
    });

    it('handles difficult course (high slope)', () => {
      const result = service.calculateDifferential(90, 74.0, 145);

      const expected = ((90 - 74.0) * 113) / 145;
      expect(result).toBe(Math.round(expected * 10) / 10);
    });
  });

  describe('calculateBatchCourseHandicaps', () => {
    it('throws NotFoundError when tee not found', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(null);

      await expect(service.calculateBatchCourseHandicaps([1n], 999n, 18)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when course not found', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(null);

      await expect(service.calculateBatchCourseHandicaps([1n], 1n, 18)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('returns null handicap for golfer not found', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([]);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([999n], 1n, 18);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].golferId).toBe('999');
      expect(result.players[0].handicapIndex).toBeNull();
      expect(result.players[0].courseHandicap).toBeNull();
    });

    it('uses initial handicap index when no scores available', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: 15.0 },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([1n], 1n, 18);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].handicapIndex).toBe(15.0);
      expect(result.players[0].courseHandicap).not.toBeNull();
    });

    it('calculates course handicap from calculated index', async () => {
      const mockScores = Array.from({ length: 5 }, (_, i) => ({
        id: BigInt(i + 1),
        dateplayed: new Date(),
        totalscore: 82,
        holesplayed: 18,
        golfteeinformation: { mensrating: 72, menslope: 113 },
        golfcourse: { name: 'Test Course' },
      }));

      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: null },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue(mockScores as never);

      const result = await service.calculateBatchCourseHandicaps([1n], 1n, 18);

      expect(result.players[0].handicapIndex).not.toBeNull();
      expect(result.players[0].courseHandicap).not.toBeNull();
    });

    it('handles 9-hole courses correctly', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: 12.0 },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([1n], 1n, 9);

      expect(result.holesPlayed).toBe(9);
      expect(result.players[0].courseHandicap).not.toBeNull();
    });

    it('calculates for multiple golfers', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: 10.0 },
        { id: 2n, gender: 'F', initialdifferential: 15.0 },
        { id: 3n, gender: 'M', initialdifferential: null },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([1n, 2n, 3n], 1n, 18);

      expect(result.players).toHaveLength(3);
      expect(result.players[0].golferId).toBe('1');
      expect(result.players[0].handicapIndex).toBe(10.0);
      expect(result.players[1].golferId).toBe('2');
      expect(result.players[1].gender).toBe('F');
      expect(result.players[2].golferId).toBe('3');
      expect(result.players[2].handicapIndex).toBeNull();
    });

    it('returns correct tee information', async () => {
      const mockTee = createMockTee({
        mensrating: 70.5,
        menslope: 125,
      });
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(mockTee as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: 10.0 },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([1n], 1n, 18);

      expect(result.teeId).toBe('1');
      expect(result.courseRating).toBe(70.5);
      expect(result.slopeRating).toBe(125);
    });

    it('calculates correct par for 18 holes', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: 10.0 },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([1n], 1n, 18);

      expect(result.par).toBe(72);
    });

    it('calculates correct par for 9 holes', async () => {
      vi.mocked(mockTeeRepository.findById!).mockResolvedValue(createMockTee() as never);
      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockRosterRepository.findGolfersByIds!).mockResolvedValue([
        { id: 1n, gender: 'M', initialdifferential: 10.0 },
      ] as never);
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateBatchCourseHandicaps([1n], 1n, 9);

      expect(result.par).toBe(36);
    });
  });

  describe('calculateHandicapIndex', () => {
    const createMockScoreForHandicap = (
      id: bigint,
      totalscore: number,
      holesplayed: number = 18,
    ) => ({
      id,
      dateplayed: new Date(),
      totalscore,
      holesplayed,
      golfteeinformation: { mensrating: 72, menslope: 113 },
      golfcourse: { name: 'Test Course' },
    });

    it('returns null when no scores available', async () => {
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([]);

      const result = await service.calculateHandicapIndex(1n);

      expect(result).toBeNull();
    });

    it('returns null with fewer than 3 eighteen-hole scores', async () => {
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([
        createMockScoreForHandicap(1n, 82),
        createMockScoreForHandicap(2n, 83),
      ] as never);

      const result = await service.calculateHandicapIndex(1n);

      expect(result).toBeNull();
    });

    it('calculates index with 3 scores using best differential', async () => {
      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue([
        createMockScoreForHandicap(1n, 84),
        createMockScoreForHandicap(2n, 82),
        createMockScoreForHandicap(3n, 83),
      ] as never);

      const result = await service.calculateHandicapIndex(1n);

      expect(result).not.toBeNull();
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('calculates index using best differentials from many scores', async () => {
      const scores = Array.from({ length: 10 }, (_, i) =>
        createMockScoreForHandicap(BigInt(i + 1), 82 + i),
      );

      vi.mocked(mockScoreRepository.findByGolferId!).mockResolvedValue(scores as never);

      const result = await service.calculateHandicapIndex(1n);

      expect(result).not.toBeNull();
    });
  });

  describe('calculateESCMaxScore', () => {
    it('returns 10 for course handicap 0-9', () => {
      const result = service.calculateESCMaxScore(5);
      expect(result).toBe(10);
    });

    it('returns 7 for course handicap 10-19', () => {
      const result = service.calculateESCMaxScore(15);
      expect(result).toBe(7);
    });

    it('returns 8 for course handicap 20-29', () => {
      const result = service.calculateESCMaxScore(25);
      expect(result).toBe(8);
    });

    it('returns 9 for course handicap 30-39', () => {
      const result = service.calculateESCMaxScore(35);
      expect(result).toBe(9);
    });

    it('returns 10 for course handicap 40+', () => {
      const result = service.calculateESCMaxScore(45);
      expect(result).toBe(10);
    });
  });
});
