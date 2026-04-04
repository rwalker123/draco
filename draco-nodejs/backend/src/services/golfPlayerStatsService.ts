import { golfscore } from '#prisma/client';
import {
  GolfPlayerDetailedStatsType,
  GolfScoreTypeCountsType,
  GolfPuttStatsType,
  GolfFairwayStatsType,
  GolfGirStatsType,
  GolfHoleTypeStatsType,
} from '@draco/shared-schemas';
import {
  IGolfScoreRepository,
  GolfScoreWithDetails,
} from '../repositories/interfaces/IGolfScoreRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ServiceFactory } from './serviceFactory.js';

export class GolfPlayerStatsService {
  private readonly scoreRepository: IGolfScoreRepository;

  constructor() {
    this.scoreRepository = RepositoryFactory.getGolfScoreRepository();
  }

  async getPlayerDetailedStats(
    contactId: bigint,
    golferId: bigint,
    firstName: string,
    lastName: string,
    teamName?: string,
  ): Promise<GolfPlayerDetailedStatsType> {
    const allScores = await this.scoreRepository.findAllByGolferId(golferId, 500);

    const scores = allScores.filter((s) => !s.isabsent && !s.totalsonly);

    const getParForHoleBound = (score: GolfScoreWithDetails, holeIndex: number) =>
      this.getParForHole(score, holeIndex);

    const totalScores = scores.map((s) => s.totalscore);
    const roundsPlayed = scores.length;

    let lowActualScore = 0;
    let highActualScore = 0;
    let averageScore = 0;

    if (roundsPlayed > 0) {
      lowActualScore = Math.min(...totalScores);
      highActualScore = Math.max(...totalScores);
      averageScore = Math.round((totalScores.reduce((a, b) => a + b, 0) / roundsPlayed) * 10) / 10;
    }

    const handicapService = ServiceFactory.getGolfHandicapService();
    const handicapIndex = await handicapService.calculateHandicapIndex(golferId);

    const netScores: number[] = [];
    for (const score of scores) {
      if (handicapIndex !== null) {
        const rating = Number(score.golfteeinformation.mensrating) || 72;
        const slope = Number(score.golfteeinformation.menslope) || 113;
        const coursePars = this.extractCoursePars(score);
        const par = coursePars.reduce((a, b) => a + b, 0);
        const courseHandicap = handicapService.calculateCourseHandicap(
          handicapIndex,
          slope,
          rating,
          par,
        );
        netScores.push(score.totalscore - courseHandicap.courseHandicap);
      }
    }

    let lowNetScore: number | undefined;
    let highNetScore: number | undefined;
    let averageNetScore: number | undefined;

    if (netScores.length > 0) {
      lowNetScore = Math.min(...netScores);
      highNetScore = Math.max(...netScores);
      averageNetScore =
        Math.round((netScores.reduce((a, b) => a + b, 0) / netScores.length) * 10) / 10;
    }

    const allHoleScores: number[] = [];
    const allHolePars: number[] = [];

    for (const score of scores) {
      const holeScores = this.extractHoleScores(score);
      const holePars = this.extractCoursePars(score);
      allHoleScores.push(...holeScores);
      allHolePars.push(...holePars);
    }

    const scoreTypeCounts = this.calculateScoreTypeCounts(allHoleScores, allHolePars);

    const maxBirdiesInRound = this.calculateMaxScoreTypeInRound(
      scores,
      (holeScore, par) => holeScore === par - 1,
    );
    const maxParsInRound = this.calculateMaxScoreTypeInRound(
      scores,
      (holeScore, par) => holeScore === par,
    );
    const maxBogeyPlusInRound = this.calculateMaxScoreTypeInRound(
      scores,
      (holeScore, par) => holeScore >= par + 1,
    );

    const puttStats = this.calculatePuttStats(scores);
    const fairwayStats = this.calculateFairwayStats(scores, getParForHoleBound);
    const girStats = this.calculateGirStats(scores);
    const scramblingPercentage = this.calculateScramblingPercentage(scores, getParForHoleBound);
    const consistencyStdDev = this.calculateConsistency(totalScores);
    const holeTypeStats = this.calculateHoleTypeStats(scores, getParForHoleBound);

    return {
      contactId: contactId.toString(),
      firstName,
      lastName,
      teamName,
      roundsPlayed,
      lowActualScore,
      highActualScore,
      lowNetScore,
      highNetScore,
      averageScore,
      averageNetScore,
      scoreTypeCounts,
      maxBirdiesInRound,
      maxParsInRound,
      maxBogeyPlusInRound,
      puttStats,
      fairwayStats,
      girStats,
      scramblingPercentage,
      consistencyStdDev,
      holeTypeStats,
    };
  }

  calculateScoreTypeCounts(holeScores: number[], holePars: number[]): GolfScoreTypeCountsType {
    const counts: GolfScoreTypeCountsType = {
      aces: 0,
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubleBogeys: 0,
      triplesOrWorse: 0,
    };

    for (let i = 0; i < holeScores.length; i++) {
      const score = holeScores[i];
      const par = holePars[i];

      if (!score || !par || score <= 0 || par <= 0) continue;

      const diff = score - par;

      if (score === 1) {
        counts.aces++;
      } else if (diff <= -2) {
        counts.eagles++;
      } else if (diff === -1) {
        counts.birdies++;
      } else if (diff === 0) {
        counts.pars++;
      } else if (diff === 1) {
        counts.bogeys++;
      } else if (diff === 2) {
        counts.doubleBogeys++;
      } else if (diff >= 3) {
        counts.triplesOrWorse++;
      }
    }

    return counts;
  }

  calculatePuttStats(scores: GolfScoreWithDetails[]): GolfPuttStatsType | undefined {
    const roundPutts: number[] = [];

    for (const score of scores) {
      const putts = this.extractPutts(score);
      const hasPuttsData = putts.some((p) => p !== null);
      if (!hasPuttsData) continue;

      const roundTotal = putts.reduce<number>((sum, p) => sum + (p ?? 0), 0);
      roundPutts.push(roundTotal);
    }

    if (roundPutts.length === 0) return undefined;

    const totalPutts = roundPutts.reduce((a, b) => a + b, 0);
    const averagePerRound = Math.round((totalPutts / roundPutts.length) * 10) / 10;
    const bestRound = Math.min(...roundPutts);
    const worstRound = Math.max(...roundPutts);

    return { totalPutts, averagePerRound, bestRound, worstRound };
  }

  calculateFairwayStats(
    scores: GolfScoreWithDetails[],
    getParForHole: (score: GolfScoreWithDetails, hole: number) => number,
  ): GolfFairwayStatsType | undefined {
    const roundPercentages: number[] = [];

    for (const score of scores) {
      const fairways = this.extractFairways(score);
      const hasFairwayData = fairways.some((f) => f !== null);
      if (!hasFairwayData) continue;

      let hits = 0;
      let eligible = 0;

      for (let i = 0; i < fairways.length; i++) {
        const par = getParForHole(score, i);
        if (par === 3) continue;
        if (fairways[i] === null) continue;
        eligible++;
        if (fairways[i] === true) hits++;
      }

      if (eligible === 0) continue;

      roundPercentages.push(Math.round((hits / eligible) * 1000) / 10);
    }

    if (roundPercentages.length === 0) return undefined;

    const averagePercentage =
      Math.round((roundPercentages.reduce((a, b) => a + b, 0) / roundPercentages.length) * 10) / 10;
    const bestPercentage = Math.max(...roundPercentages);
    const worstPercentage = Math.min(...roundPercentages);

    return { averagePercentage, bestPercentage, worstPercentage };
  }

  calculateGirStats(scores: GolfScoreWithDetails[]): GolfGirStatsType | undefined {
    const roundPercentages: number[] = [];

    for (const score of scores) {
      const girs = this.extractGirs(score);
      const hasGirData = girs.some((g) => g !== null);
      if (!hasGirData) continue;

      let hits = 0;
      let eligible = 0;

      for (let i = 0; i < girs.length; i++) {
        if (girs[i] === null) continue;
        eligible++;
        if (girs[i] === true) hits++;
      }

      if (eligible === 0) continue;

      roundPercentages.push(Math.round((hits / eligible) * 1000) / 10);
    }

    if (roundPercentages.length === 0) return undefined;

    const averagePercentage =
      Math.round((roundPercentages.reduce((a, b) => a + b, 0) / roundPercentages.length) * 10) / 10;
    const bestPercentage = Math.max(...roundPercentages);
    const worstPercentage = Math.min(...roundPercentages);

    return { averagePercentage, bestPercentage, worstPercentage };
  }

  calculateScramblingPercentage(
    scores: GolfScoreWithDetails[],
    getParForHole: (score: GolfScoreWithDetails, hole: number) => number,
  ): number | undefined {
    let missedGirAndSaved = 0;
    let missedGirTotal = 0;

    for (const score of scores) {
      const girs = this.extractGirs(score);
      const holeScores = this.extractHoleScores(score);

      for (let i = 0; i < girs.length; i++) {
        if (girs[i] === null) continue;
        if (girs[i] !== false) continue;

        const par = getParForHole(score, i);
        const holeScore = holeScores[i];

        missedGirTotal++;
        if (holeScore > 0 && holeScore <= par) {
          missedGirAndSaved++;
        }
      }
    }

    if (missedGirTotal === 0) return undefined;

    return Math.round((missedGirAndSaved / missedGirTotal) * 1000) / 10;
  }

  calculateHoleTypeStats(
    scores: GolfScoreWithDetails[],
    getParForHole: (score: GolfScoreWithDetails, hole: number) => number,
  ): GolfHoleTypeStatsType | undefined {
    const par3Scores: number[] = [];
    const par4Scores: number[] = [];
    const par5Scores: number[] = [];

    for (const score of scores) {
      const holeScores = this.extractHoleScores(score);

      for (let i = 0; i < holeScores.length; i++) {
        const par = getParForHole(score, i);
        const holeScore = holeScores[i];

        if (holeScore <= 0 || par <= 0) continue;

        if (par === 3) par3Scores.push(holeScore);
        else if (par === 4) par4Scores.push(holeScore);
        else if (par === 5) par5Scores.push(holeScore);
      }
    }

    if (par3Scores.length === 0 && par4Scores.length === 0 && par5Scores.length === 0) {
      return undefined;
    }

    const result: GolfHoleTypeStatsType = {};

    if (par3Scores.length > 0) {
      result.par3Average =
        Math.round((par3Scores.reduce((a, b) => a + b, 0) / par3Scores.length) * 10) / 10;
      result.par3Rounds = par3Scores.length;
    }

    if (par4Scores.length > 0) {
      result.par4Average =
        Math.round((par4Scores.reduce((a, b) => a + b, 0) / par4Scores.length) * 10) / 10;
      result.par4Rounds = par4Scores.length;
    }

    if (par5Scores.length > 0) {
      result.par5Average =
        Math.round((par5Scores.reduce((a, b) => a + b, 0) / par5Scores.length) * 10) / 10;
      result.par5Rounds = par5Scores.length;
    }

    return result;
  }

  calculateConsistency(totalScores: number[]): number | undefined {
    if (totalScores.length < 2) return undefined;

    const mean = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
    const variance =
      totalScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / totalScores.length;
    const stdDev = Math.sqrt(variance);

    return Math.round(stdDev * 10) / 10;
  }

  private getParForHole(score: GolfScoreWithDetails, holeIndex: number): number {
    const course = score.golfcourse;
    const isFemale = score.golfer.gender === 'F';
    const holeNumber = holeIndex + 1;

    const parKey = isFemale
      ? (`womanspar${holeNumber}` as keyof typeof course)
      : (`menspar${holeNumber}` as keyof typeof course);

    return (course[parKey] as number) ?? 4;
  }

  private extractHoleScores(score: golfscore): number[] {
    return [
      score.holescrore1,
      score.holescrore2,
      score.holescrore3,
      score.holescrore4,
      score.holescrore5,
      score.holescrore6,
      score.holescrore7,
      score.holescrore8,
      score.holescrore9,
      score.holescrore10,
      score.holescrore11,
      score.holescrore12,
      score.holescrore13,
      score.holescrore14,
      score.holescrore15,
      score.holescrore16,
      score.holescrore17,
      score.holescrore18,
    ];
  }

  private extractPutts(score: golfscore): (number | null)[] {
    return [
      score.putts1,
      score.putts2,
      score.putts3,
      score.putts4,
      score.putts5,
      score.putts6,
      score.putts7,
      score.putts8,
      score.putts9,
      score.putts10,
      score.putts11,
      score.putts12,
      score.putts13,
      score.putts14,
      score.putts15,
      score.putts16,
      score.putts17,
      score.putts18,
    ];
  }

  private extractFairways(score: golfscore): (boolean | null)[] {
    return [
      score.fairway1,
      score.fairway2,
      score.fairway3,
      score.fairway4,
      score.fairway5,
      score.fairway6,
      score.fairway7,
      score.fairway8,
      score.fairway9,
      score.fairway10,
      score.fairway11,
      score.fairway12,
      score.fairway13,
      score.fairway14,
      score.fairway15,
      score.fairway16,
      score.fairway17,
      score.fairway18,
    ];
  }

  private extractGirs(score: golfscore): (boolean | null)[] {
    return [
      score.gir1,
      score.gir2,
      score.gir3,
      score.gir4,
      score.gir5,
      score.gir6,
      score.gir7,
      score.gir8,
      score.gir9,
      score.gir10,
      score.gir11,
      score.gir12,
      score.gir13,
      score.gir14,
      score.gir15,
      score.gir16,
      score.gir17,
      score.gir18,
    ];
  }

  private extractCoursePars(score: GolfScoreWithDetails): number[] {
    return Array.from({ length: 18 }, (_, i) => this.getParForHole(score, i));
  }

  private calculateMaxScoreTypeInRound(
    scores: GolfScoreWithDetails[],
    predicate: (holeScore: number, par: number) => boolean,
  ): number {
    let max = 0;

    for (const score of scores) {
      const holeScores = this.extractHoleScores(score);
      let count = 0;

      for (let i = 0; i < holeScores.length; i++) {
        const par = this.getParForHole(score, i);
        const holeScore = holeScores[i];
        if (holeScore > 0 && par > 0 && predicate(holeScore, par)) {
          count++;
        }
      }

      if (count > max) max = count;
    }

    return max;
  }
}
