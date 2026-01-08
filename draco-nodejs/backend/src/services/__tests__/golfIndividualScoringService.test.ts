import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfIndividualScoringService } from '../golfIndividualScoringService.js';
import type { IGolfMatchRepository } from '../../repositories/interfaces/IGolfMatchRepository.js';
import type { IGolfLeagueRepository } from '../../repositories/interfaces/IGolfLeagueRepository.js';
import type { IGolfCourseRepository } from '../../repositories/interfaces/IGolfCourseRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import { AbsentPlayerMode } from '../../utils/golfConstants.js';

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
    const defaultHolePars = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

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
        defaultHolePars,
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
        defaultHolePars,
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
        defaultHolePars,
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
        defaultHolePars,
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

    it('uses expected score (par) for holes with zero scores and skips hole comparison', () => {
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
        defaultHolePars,
        scoringConfig,
        9,
      );

      expect(result.team1HoleWins).toBe(8);
      expect(result.team1NetScore).toBe(36);
      expect(result.team2NetScore).toBe(44);
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
        defaultHolePars,
        scoringConfig,
        9,
      );

      expect(result.team1NetScore).toBe(36);
      expect(result.team2NetScore).toBe(36);
    });
  });

  describe('calculateAbsentPairingPoints', () => {
    const defaultScoringConfig = {
      perHolePoints: 1,
      perNinePoints: 2,
      perMatchPoints: 3,
      useHandicapScoring: false,
    };

    describe('SKIP_PAIRING mode', () => {
      it('returns zero points for both teams when pairing is skipped (9 holes)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.SKIP_PAIRING,
          defaultScoringConfig,
          9,
          true,
        );

        expect(result.team1Points).toBe(0);
        expect(result.team2Points).toBe(0);
        expect(result.team1HoleWins).toBe(0);
        expect(result.team2HoleWins).toBe(0);
        expect(result.team1MatchWins).toBe(0);
        expect(result.team2MatchWins).toBe(0);
      });

      it('returns zero points for both teams when pairing is skipped (18 holes)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.SKIP_PAIRING,
          defaultScoringConfig,
          18,
          false,
        );

        expect(result.team1Points).toBe(0);
        expect(result.team2Points).toBe(0);
        expect(result.team1NineWins).toBe(0);
        expect(result.team2NineWins).toBe(0);
      });
    });

    describe('OPPONENT_WINS mode', () => {
      it('awards all points to team1 when team2 player is absent (9 holes)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.OPPONENT_WINS,
          defaultScoringConfig,
          9,
          true,
        );

        expect(result.team1Points).toBe(12);
        expect(result.team2Points).toBe(0);
        expect(result.team1HoleWins).toBe(9);
        expect(result.team2HoleWins).toBe(0);
        expect(result.team1NineWins).toBe(0);
        expect(result.team2NineWins).toBe(0);
        expect(result.team1MatchWins).toBe(1);
        expect(result.team2MatchWins).toBe(0);
      });

      it('awards all points to team2 when team1 player is absent (9 holes)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.OPPONENT_WINS,
          defaultScoringConfig,
          9,
          false,
        );

        expect(result.team1Points).toBe(0);
        expect(result.team2Points).toBe(12);
        expect(result.team1HoleWins).toBe(0);
        expect(result.team2HoleWins).toBe(9);
        expect(result.team1MatchWins).toBe(0);
        expect(result.team2MatchWins).toBe(1);
      });

      it('awards all points to team1 when team2 player is absent (18 holes)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.OPPONENT_WINS,
          defaultScoringConfig,
          18,
          true,
        );

        expect(result.team1Points).toBe(25);
        expect(result.team2Points).toBe(0);
        expect(result.team1HoleWins).toBe(18);
        expect(result.team2HoleWins).toBe(0);
        expect(result.team1NineWins).toBe(2);
        expect(result.team2NineWins).toBe(0);
        expect(result.team1MatchWins).toBe(1);
        expect(result.team2MatchWins).toBe(0);
      });

      it('awards all points to team2 when team1 player is absent (18 holes)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.OPPONENT_WINS,
          defaultScoringConfig,
          18,
          false,
        );

        expect(result.team1Points).toBe(0);
        expect(result.team2Points).toBe(25);
        expect(result.team1HoleWins).toBe(0);
        expect(result.team2HoleWins).toBe(18);
        expect(result.team1NineWins).toBe(0);
        expect(result.team2NineWins).toBe(2);
        expect(result.team1MatchWins).toBe(0);
        expect(result.team2MatchWins).toBe(1);
      });
    });

    describe('HANDICAP_PENALTY mode', () => {
      it('is not handled by calculateAbsentPairingPoints (uses calculateHandicapPenaltyPairingPoints instead)', () => {
        const result = service.calculateAbsentPairingPoints(
          AbsentPlayerMode.HANDICAP_PENALTY,
          defaultScoringConfig,
          9,
          true,
        );

        expect(result.team1Points).toBe(0);
        expect(result.team2Points).toBe(0);
      });
    });
  });

  describe('calculateHandicapPenaltyPairingPoints', () => {
    const createMockCourseForPenalty = () => {
      const course: Record<string, number | bigint> = { id: 1n };
      for (let i = 1; i <= 18; i++) {
        course[`menspar${i}`] = 4;
        course[`womanspar${i}`] = 4;
        course[`menshandicap${i}`] = i;
        course[`womanshandicap${i}`] = i;
      }
      return course;
    };

    const createMockTeeInfo = () => ({
      mensrating: 36,
      menslope: 113,
      womansrating: 36,
      womanslope: 113,
    });

    const createMockLeagueSetupForPenalty = (penalty: number, useHandicap = false) => ({
      scoringtype: 'individual',
      perholepoints: 1,
      perninepoints: 0,
      permatchpoints: 2,
      usehandicapscoring: useHandicap,
      absentplayerpenalty: penalty,
    });

    const createMockPlayerEntry = (golferId: bigint, totalScore: number, holeScores: number[]) => {
      const scoreObj: Record<string, number | bigint | null> = {
        golferid: golferId,
        totalscore: totalScore,
        holesplayed: holeScores.length,
        startindex: 10,
        startindex9: 5,
      };
      for (let i = 1; i <= 18; i++) {
        scoreObj[`holescrore${i}`] = holeScores[i - 1] ?? 0;
      }
      return {
        teamsseason: { id: 1n },
        golfer: { gender: 'M' },
        golfscore: scoreObj,
      };
    };

    it('generates synthetic score at par when penalty is 0', () => {
      const course = createMockCourseForPenalty();
      const teeInfo = createMockTeeInfo();
      const leagueSetup = createMockLeagueSetupForPenalty(0);
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };
      const playerEntry = createMockPlayerEntry(1n, 40, [4, 5, 4, 5, 4, 5, 4, 5, 4]);

      const result = service.calculateHandicapPenaltyPairingPoints(
        playerEntry as never,
        course as never,
        teeInfo as never,
        leagueSetup as never,
        scoringConfig,
        9,
        true,
      );

      expect(result.syntheticTotalScore).toBe(36);
      expect(result.presentPlayerTotalScore).toBe(40);
    });

    it('generates synthetic score at par + penalty when penalty is set', () => {
      const course = createMockCourseForPenalty();
      const teeInfo = createMockTeeInfo();
      const leagueSetup = createMockLeagueSetupForPenalty(5);
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };
      const playerEntry = createMockPlayerEntry(1n, 40, [4, 5, 4, 5, 4, 5, 4, 5, 4]);

      const result = service.calculateHandicapPenaltyPairingPoints(
        playerEntry as never,
        course as never,
        teeInfo as never,
        leagueSetup as never,
        scoringConfig,
        9,
        true,
      );

      expect(result.syntheticTotalScore).toBe(41);
      expect(result.presentPlayerTotalScore).toBe(40);
    });

    it('calculates points correctly when present player beats synthetic score', () => {
      const course = createMockCourseForPenalty();
      const teeInfo = createMockTeeInfo();
      const leagueSetup = createMockLeagueSetupForPenalty(0);
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };
      const playerEntry = createMockPlayerEntry(1n, 32, [3, 4, 3, 4, 3, 4, 4, 4, 3]);

      const result = service.calculateHandicapPenaltyPairingPoints(
        playerEntry as never,
        course as never,
        teeInfo as never,
        leagueSetup as never,
        scoringConfig,
        9,
        true,
      );

      expect(result.result.team1Points).toBeGreaterThan(0);
      expect(result.result.team1HoleWins).toBeGreaterThan(0);
    });

    it('calculates points correctly when synthetic score beats present player', () => {
      const course = createMockCourseForPenalty();
      const teeInfo = createMockTeeInfo();
      const leagueSetup = createMockLeagueSetupForPenalty(0);
      const scoringConfig = {
        perHolePoints: 1,
        perNinePoints: 0,
        perMatchPoints: 2,
        useHandicapScoring: false,
      };
      const playerEntry = createMockPlayerEntry(1n, 50, [5, 6, 5, 6, 5, 6, 6, 6, 5]);

      const result = service.calculateHandicapPenaltyPairingPoints(
        playerEntry as never,
        course as never,
        teeInfo as never,
        leagueSetup as never,
        scoringConfig,
        9,
        true,
      );

      expect(result.result.team2Points).toBeGreaterThan(0);
      expect(result.result.team2HoleWins).toBeGreaterThan(0);
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

    describe('partial absence handling', () => {
      const createMockMatchWithPartialAbsence = (
        team1HasScore: boolean,
        team2HasScore: boolean,
        absentPlayerMode: number,
      ) => {
        const mockScore = {
          golferid: 1n,
          totalscore: 40,
          holesplayed: 9,
          startindex: 10,
          ...createMockHoleScores([4, 4, 5, 4, 5, 4, 5, 4, 5]),
        };

        const golfmatchscores = [];
        if (team1HasScore) {
          golfmatchscores.push({
            teamsseason: { id: 1n },
            golfer: { gender: 'M' },
            golfscore: mockScore,
          });
        }
        if (team2HasScore) {
          golfmatchscores.push({
            teamsseason: { id: 2n },
            golfer: { gender: 'M' },
            golfscore: { ...mockScore, golferid: 2n },
          });
        }

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
          golfmatchscores,
        } as never);

        vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
          scoringtype: 'individual',
          perholepoints: 1,
          perninepoints: 0,
          permatchpoints: 2,
          usehandicapscoring: false,
          absentplayermode: absentPlayerMode,
          leagueseason: { golfseasonconfig: { teamsize: 1 } },
        } as never);

        vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
        vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);
      };

      it('awards all points to team1 when team2 player is absent (OPPONENT_WINS)', async () => {
        createMockMatchWithPartialAbsence(true, false, AbsentPlayerMode.OPPONENT_WINS);

        const result = await service.calculateAndStoreMatchPoints(1n);

        expect(result).not.toBeNull();
        expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
          1n,
          expect.objectContaining({
            team1points: 11,
            team2points: 0,
            team1holewins: 9,
            team2holewins: 0,
            team1matchwins: 1,
            team2matchwins: 0,
          }),
        );
      });

      it('awards all points to team2 when team1 player is absent (OPPONENT_WINS)', async () => {
        createMockMatchWithPartialAbsence(false, true, AbsentPlayerMode.OPPONENT_WINS);

        const result = await service.calculateAndStoreMatchPoints(1n);

        expect(result).not.toBeNull();
        expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
          1n,
          expect.objectContaining({
            team1points: 0,
            team2points: 11,
            team1holewins: 0,
            team2holewins: 9,
            team1matchwins: 0,
            team2matchwins: 1,
          }),
        );
      });

      it('awards no points when one player is absent (SKIP_PAIRING)', async () => {
        createMockMatchWithPartialAbsence(true, false, AbsentPlayerMode.SKIP_PAIRING);

        const result = await service.calculateAndStoreMatchPoints(1n);

        expect(result).not.toBeNull();
        expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
          1n,
          expect.objectContaining({
            team1points: 0,
            team2points: 0,
            team1holewins: 0,
            team2holewins: 0,
            team1matchwins: 0,
            team2matchwins: 0,
          }),
        );
      });

      it('uses default OPPONENT_WINS mode when absentplayermode is not set', async () => {
        const mockScore = {
          golferid: 1n,
          totalscore: 40,
          holesplayed: 9,
          startindex: 10,
          ...createMockHoleScores([4, 4, 5, 4, 5, 4, 5, 4, 5]),
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
            { teamsseason: { id: 1n }, golfer: { gender: 'M' }, golfscore: mockScore },
          ],
        } as never);

        vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
          scoringtype: 'individual',
          perholepoints: 1,
          perninepoints: 0,
          permatchpoints: 2,
          usehandicapscoring: false,
          leagueseason: { golfseasonconfig: { teamsize: 1 } },
        } as never);

        vi.mocked(mockCourseRepository.findById!).mockResolvedValue(createMockCourse() as never);
        vi.mocked(mockMatchRepository.updatePoints!).mockResolvedValue({} as never);

        const result = await service.calculateAndStoreMatchPoints(1n);

        expect(result).not.toBeNull();
        expect(mockMatchRepository.updatePoints).toHaveBeenCalledWith(
          1n,
          expect.objectContaining({
            team1points: 11,
            team2points: 0,
          }),
        );
      });

      it('handles multiple pairings with one absent player (teamsize 2)', async () => {
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
        const mockScore3 = {
          golferid: 3n,
          totalscore: 38,
          holesplayed: 9,
          startindex: 12,
          ...createMockHoleScores([4, 4, 4, 4, 5, 4, 5, 4, 4]),
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
            { teamsseason: { id: 1n }, golfer: { gender: 'M' }, golfscore: mockScore3 },
            { teamsseason: { id: 2n }, golfer: { gender: 'M' }, golfscore: mockScore2 },
          ],
        } as never);

        vi.mocked(mockLeagueRepository.findByLeagueSeasonId!).mockResolvedValue({
          scoringtype: 'individual',
          perholepoints: 1,
          perninepoints: 0,
          permatchpoints: 2,
          usehandicapscoring: false,
          absentplayermode: AbsentPlayerMode.OPPONENT_WINS,
          leagueseason: { golfseasonconfig: { teamsize: 2 } },
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
            team1totalscore: 78,
            team2totalscore: 42,
          }),
        );
      });
    });
  });
});
