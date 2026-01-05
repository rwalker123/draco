import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfIndividualScoringService } from '../golfIndividualScoringService.js';
import type { IGolfMatchRepository } from '../../repositories/interfaces/IGolfMatchRepository.js';
import type { IGolfLeagueRepository } from '../../repositories/interfaces/IGolfLeagueRepository.js';
import type { IGolfCourseRepository } from '../../repositories/interfaces/IGolfCourseRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';

const createMockHoleScores = (scores: number[]): Record<string, number> => {
  const result: Record<string, number> = {};
  for (let i = 1; i <= 18; i++) {
    result[`holescrore${i}`] = scores[i - 1] || 0;
  }
  return result;
};

const createMockCourse = (): Record<string, number> => {
  const result: Record<string, number> = {};
  for (let i = 1; i <= 18; i++) {
    result[`menspar${i}`] = 4;
    result[`womanspar${i}`] = 4;
    result[`menshandicap${i}`] = i;
    result[`womanshandicap${i}`] = i;
  }
  return result;
};

describe('GolfIndividualScoringService', () => {
  let service: GolfIndividualScoringService;
  let mockMatchRepository: Partial<IGolfMatchRepository>;
  let mockLeagueRepository: Partial<IGolfLeagueRepository>;
  let mockCourseRepository: Partial<IGolfCourseRepository>;

  beforeEach(() => {
    mockMatchRepository = {
      findByIdWithScores: vi.fn(),
      updatePoints: vi.fn(),
    };
    mockLeagueRepository = {
      findByLeagueSeasonId: vi.fn(),
    };
    mockCourseRepository = {
      findById: vi.fn(),
    };

    service = new GolfIndividualScoringService(
      mockMatchRepository as IGolfMatchRepository,
      mockLeagueRepository as IGolfLeagueRepository,
      mockCourseRepository as IGolfCourseRepository,
    );
  });

  describe('calculateStrokeDistribution', () => {
    const defaultHoleHandicapIndexes = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ];

    it('returns zero strokes when handicaps are equal', () => {
      const result = service.calculateStrokeDistribution(10, 10, defaultHoleHandicapIndexes, 18);

      expect(result.team1Strokes).toEqual(new Array(18).fill(0));
      expect(result.team2Strokes).toEqual(new Array(18).fill(0));
    });

    it('gives strokes to higher handicap player (team1)', () => {
      const result = service.calculateStrokeDistribution(15, 10, defaultHoleHandicapIndexes, 18);

      expect(result.team1Strokes.reduce((sum, s) => sum + s, 0)).toBe(5);
      expect(result.team2Strokes.reduce((sum, s) => sum + s, 0)).toBe(0);
      expect(result.team1Strokes[0]).toBe(1);
      expect(result.team1Strokes[1]).toBe(1);
      expect(result.team1Strokes[2]).toBe(1);
      expect(result.team1Strokes[3]).toBe(1);
      expect(result.team1Strokes[4]).toBe(1);
      expect(result.team1Strokes[5]).toBe(0);
    });

    it('gives strokes to higher handicap player (team2)', () => {
      const result = service.calculateStrokeDistribution(8, 12, defaultHoleHandicapIndexes, 18);

      expect(result.team1Strokes.reduce((sum, s) => sum + s, 0)).toBe(0);
      expect(result.team2Strokes.reduce((sum, s) => sum + s, 0)).toBe(4);
      expect(result.team2Strokes[0]).toBe(1);
      expect(result.team2Strokes[1]).toBe(1);
      expect(result.team2Strokes[2]).toBe(1);
      expect(result.team2Strokes[3]).toBe(1);
      expect(result.team2Strokes[4]).toBe(0);
    });

    it('handles 9-hole rounds', () => {
      const result = service.calculateStrokeDistribution(14, 10, defaultHoleHandicapIndexes, 9);

      expect(result.team1Strokes).toHaveLength(9);
      expect(result.team2Strokes).toHaveLength(9);
      expect(result.team1Strokes.reduce((sum, s) => sum + s, 0)).toBe(4);
    });

    it('distributes strokes on hardest holes first', () => {
      const customHandicapIndexes = [5, 3, 1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
      const result = service.calculateStrokeDistribution(13, 10, customHandicapIndexes, 18);

      expect(result.team1Strokes[2]).toBe(1);
      expect(result.team1Strokes[3]).toBe(1);
      expect(result.team1Strokes[1]).toBe(1);
      expect(result.team1Strokes.reduce((sum, s) => sum + s, 0)).toBe(3);
    });

    it('handles large handicap differences (more than 18 strokes)', () => {
      const result = service.calculateStrokeDistribution(36, 10, defaultHoleHandicapIndexes, 18);

      expect(result.team1Strokes.reduce((sum, s) => sum + s, 0)).toBe(26);
      expect(result.team1Strokes.filter((s) => s === 2).length).toBe(8);
      expect(result.team1Strokes.filter((s) => s === 1).length).toBe(10);
    });
  });

  describe('calculateIndividualMatchPoints', () => {
    const defaultHoleHandicapIndexes = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ];

    it('calculates points for hole-by-hole wins without handicap', () => {
      const team1Score = {
        golferId: 1n,
        holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4],
        totalScore: 36,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const team2Score = {
        golferId: 2n,
        holeScores: [5, 5, 5, 5, 5, 5, 5, 5, 5],
        totalScore: 45,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };

      const result = service.calculateIndividualMatchPoints(
        team1Score,
        team2Score,
        defaultHoleHandicapIndexes,
        scoringConfig,
        9,
      );

      expect(result.team1HoleWins).toBe(9);
      expect(result.team2HoleWins).toBe(0);
      expect(result.team1Points).toBe(11);
      expect(result.team2Points).toBe(0);
      expect(result.team1MatchWins).toBe(1);
      expect(result.team2MatchWins).toBe(0);
    });

    it('splits points on tied holes', () => {
      const team1Score = {
        golferId: 1n,
        holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4],
        totalScore: 36,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const team2Score = {
        golferId: 2n,
        holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4],
        totalScore: 36,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };

      const result = service.calculateIndividualMatchPoints(
        team1Score,
        team2Score,
        defaultHoleHandicapIndexes,
        scoringConfig,
        9,
      );

      expect(result.team1HoleWins).toBe(0);
      expect(result.team2HoleWins).toBe(0);
      expect(result.team1Points).toBe(5.5);
      expect(result.team2Points).toBe(5.5);
      expect(result.team1MatchWins).toBe(0);
      expect(result.team2MatchWins).toBe(0);
    });

    it('applies handicap strokes correctly', () => {
      const team1Score = {
        golferId: 1n,
        holeScores: [5, 5, 5, 5, 5, 5, 5, 5, 5],
        totalScore: 45,
        courseHandicap: 5,
        gender: 'M' as const,
      };
      const team2Score = {
        golferId: 2n,
        holeScores: [4, 4, 4, 4, 4, 5, 5, 5, 5],
        totalScore: 40,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: true,
      };

      const result = service.calculateIndividualMatchPoints(
        team1Score,
        team2Score,
        defaultHoleHandicapIndexes,
        scoringConfig,
        9,
      );

      expect(result.team1Points).toBeGreaterThan(0);
      expect(result.team1NetScore).toBe(40);
      expect(result.team2NetScore).toBe(40);
    });

    it('calculates nine points for 18-hole rounds', () => {
      const team1Score = {
        golferId: 1n,
        holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        totalScore: 81,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const team2Score = {
        golferId: 2n,
        holeScores: [5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        totalScore: 81,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const scoringConfig = {
        perHolePoints: 0,
        perNinePoints: 2,
        perMatchPoints: 4,
        useHandicapScoring: false,
      };

      const result = service.calculateIndividualMatchPoints(
        team1Score,
        team2Score,
        defaultHoleHandicapIndexes,
        scoringConfig,
        18,
      );

      expect(result.team1NineWins).toBe(1);
      expect(result.team2NineWins).toBe(1);
      expect(result.team1Points).toBe(4);
      expect(result.team2Points).toBe(4);
      expect(result.team1MatchWins).toBe(0);
      expect(result.team2MatchWins).toBe(0);
    });

    it('skips holes with zero scores', () => {
      const team1Score = {
        golferId: 1n,
        holeScores: [4, 4, 0, 4, 4, 4, 4, 4, 4],
        totalScore: 32,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const team2Score = {
        golferId: 2n,
        holeScores: [5, 5, 0, 5, 5, 5, 5, 5, 5],
        totalScore: 40,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };

      const result = service.calculateIndividualMatchPoints(
        team1Score,
        team2Score,
        defaultHoleHandicapIndexes,
        scoringConfig,
        9,
      );

      expect(result.team1HoleWins).toBe(8);
    });

    it('returns net scores for display', () => {
      const team1Score = {
        golferId: 1n,
        holeScores: [5, 5, 5, 5, 5, 5, 5, 5, 5],
        totalScore: 45,
        courseHandicap: 9,
        gender: 'M' as const,
      };
      const team2Score = {
        golferId: 2n,
        holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4],
        totalScore: 36,
        courseHandicap: 0,
        gender: 'M' as const,
      };
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: true,
      };

      const result = service.calculateIndividualMatchPoints(
        team1Score,
        team2Score,
        defaultHoleHandicapIndexes,
        scoringConfig,
        9,
      );

      expect(result.team1NetScore).toBe(36);
      expect(result.team2NetScore).toBe(36);
    });
  });

  describe('calculateAndStoreMatchPoints', () => {
    it('throws NotFoundError when match not found', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue(null);

      await expect(service.calculateAndStoreMatchPoints(1n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when league setup not found', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        leagueid: 100n,
        team1: 1n,
        team2: 2n,
        golfmatchscores: [],
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue(null);

      await expect(service.calculateAndStoreMatchPoints(1n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns null for non-individual scoring type', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        leagueid: 100n,
        team1: 1n,
        team2: 2n,
        golfmatchscores: [],
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'team',
      } as never);

      const result = await service.calculateAndStoreMatchPoints(1n);

      expect(result).toBeNull();
    });

    it('returns null when no scores for either team', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        leagueid: 100n,
        team1: 1n,
        team2: 2n,
        golfmatchscores: [],
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'individual',
      } as never);

      const result = await service.calculateAndStoreMatchPoints(1n);

      expect(result).toBeNull();
    });

    it('throws NotFoundError when course not assigned', async () => {
      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        leagueid: 100n,
        team1: 1n,
        team2: 2n,
        courseid: null,
        golfmatchscores: [
          { teamsseason: { id: 1n }, golfer: { gender: 'M' }, golfscore: { holesplayed: 9 } },
          { teamsseason: { id: 2n }, golfer: { gender: 'M' }, golfscore: { holesplayed: 9 } },
        ],
      } as never);
      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'individual',
      } as never);

      await expect(service.calculateAndStoreMatchPoints(1n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('calculates and stores match points successfully', async () => {
      const mockScore1 = {
        golferid: 1n,
        totalscore: 40,
        holesplayed: 9,
        startindex: 10,
        ...createMockHoleScores([4, 4, 5, 4, 5, 4, 5, 4, 5]),
      };
      const mockScore2 = {
        golferid: 2n,
        totalscore: 42,
        holesplayed: 9,
        startindex: 8,
        ...createMockHoleScores([5, 4, 5, 4, 5, 5, 5, 4, 5]),
      };

      vi.mocked(mockMatchRepository.findByIdWithScores!).mockResolvedValue({
        id: 1n,
        leagueid: 100n,
        team1: 1n,
        team2: 2n,
        courseid: 10n,
        golfteeinformation: {
          mensrating: 36,
          menslope: 113,
          womansrating: 36,
          womanslope: 113,
        },
        golfmatchscores: [
          { teamsseason: { id: 1n }, golfer: { gender: 'M' }, golfscore: mockScore1 },
          { teamsseason: { id: 2n }, golfer: { gender: 'M' }, golfscore: mockScore2 },
        ],
      } as never);

      vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
        scoringtype: 'individual',
        perholepoints: 1,
        perninepoints: 0,
        permatchpoints: 2,
        usehandicapscoring: true,
      } as never);

      vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
      vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);

      const result = await service.calculateAndStoreMatchPoints(1n);

      expect(result).not.toBeNull();
      expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          team1points: expect.any(Number),
          team2points: expect.any(Number),
          team1totalscore: 40,
          team2totalscore: 42,
          team1netscore: expect.any(Number),
          team2netscore: expect.any(Number),
          team1holewins: expect.any(Number),
          team2holewins: expect.any(Number),
          team1ninewins: expect.any(Number),
          team2ninewins: expect.any(Number),
          team1matchwins: expect.any(Number),
          team2matchwins: expect.any(Number),
        }),
      );
    });
  });
});
