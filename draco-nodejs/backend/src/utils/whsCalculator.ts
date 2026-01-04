/**
 * World Handicap System (WHS) Calculator
 *
 * Implements the official USGA/R&A World Handicap System calculations including:
 * - Score differential calculation
 * - Handicap index calculation with proper differential selection
 * - Net double bogey adjustments
 * - Soft cap and hard cap
 * - Exceptional score reduction
 *
 * References:
 * - https://www.usga.org/content/usga/home-page/handicapping/world-handicap-system/topics/handicap-index-calculation.html
 * - https://www.randa.org/en/roh/the-rules-of-handicapping/rule-5
 */

import { getWhsUseCount, getWhsAdjustment } from '@draco/shared-schemas';

export interface HandicapResult {
  handicapIndex: number;
  newLowHandicapIndex: number;
}

export interface ScoreForAverage {
  totalScore: number;
  holesPlayed: number;
}

/**
 * Calculate the score differential using the WHS formula
 * Differential = (113 / Slope Rating) × (Adjusted Gross Score - Course Rating)
 */
export function calculateScoreDifferential(
  adjustedScore: number,
  courseRating: number,
  slopeRating: number,
): number {
  const differential = ((adjustedScore - courseRating) * 113) / slopeRating;
  return Math.round(differential * 10) / 10;
}

/**
 * Apply Net Double Bogey adjustment to hole scores
 * Max score per hole = Par + 2 + handicap strokes received on that hole
 * For new golfers without handicap: Par + 5 per hole
 */
export function applyNetDoubleBogey(
  holeScores: number[],
  holePars: number[],
  holeHandicapIndexes: number[],
  courseHandicap: number | null,
): number[] {
  return holeScores.map((score, i) => {
    if (score === 0) return 0;

    const par = holePars[i] || 4;
    const holeIndex = holeHandicapIndexes[i] || i + 1;

    let maxScore: number;
    if (courseHandicap === null) {
      maxScore = par + 5;
    } else {
      const strokesOnHole =
        Math.floor(courseHandicap / 18) + (holeIndex <= courseHandicap % 18 ? 1 : 0);
      maxScore = par + 2 + strokesOnHole;
    }

    return Math.min(score, maxScore);
  });
}

/**
 * Calculate course handicap from handicap index
 * Course Handicap = Handicap Index × (Slope Rating / 113) + (Course Rating - Par)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
): number {
  const courseHandicap = handicapIndex * (slopeRating / 113) + (courseRating - par);
  return Math.round(courseHandicap);
}

/**
 * Apply exceptional score reduction to differentials
 * - Score 7.0+ below handicap: Apply -1.0 to all differentials
 * - Score 10.0+ below handicap: Apply -2.0 to all differentials
 */
export function applyExceptionalScoreReduction(
  differentials: number[],
  currentHandicap: number,
  latestDifferential: number,
): number[] {
  const strokesBelow = currentHandicap - latestDifferential;

  let reduction = 0;
  if (strokesBelow >= 10.0) {
    reduction = 2.0;
  } else if (strokesBelow >= 7.0) {
    reduction = 1.0;
  }

  if (reduction === 0) {
    return differentials;
  }

  return differentials.map((d) => d - reduction);
}

/**
 * Apply soft cap and hard cap to calculated handicap index
 * - Soft Cap: If calculated exceeds Low HI by >3.0, reduce further increases by 50%
 * - Hard Cap: Maximum increase of 5.0 above Low HI after soft cap
 */
export function applySoftHardCap(calculatedIndex: number, lowHandicapIndex: number | null): number {
  if (lowHandicapIndex === null) {
    return calculatedIndex;
  }

  const difference = calculatedIndex - lowHandicapIndex;

  if (difference <= 3.0) {
    return calculatedIndex;
  }

  const softCapAmount = 3.0 + (difference - 3.0) * 0.5;

  const hardCapMax = 5.0;
  const cappedAmount = Math.min(softCapAmount, hardCapMax);

  return Math.round((lowHandicapIndex + cappedAmount) * 10) / 10;
}

/**
 * Calculate handicap index from differentials using the WHS table
 * Returns the calculated handicap and the new low handicap index
 */
export function calculateHandicapIndex(
  differentials: number[],
  lowHandicapIndex: number | null,
): HandicapResult | null {
  const count = differentials.length;

  if (count < 3) {
    return null;
  }

  const useCount = getWhsUseCount(count);
  if (useCount === 0) {
    return null;
  }

  const sortedDifferentials = [...differentials].sort((a, b) => a - b);
  const bestDifferentials = sortedDifferentials.slice(0, useCount);
  const avgDifferential =
    bestDifferentials.reduce((sum, d) => sum + d, 0) / bestDifferentials.length;

  let rawIndex = avgDifferential + getWhsAdjustment(count);
  rawIndex = Math.round(rawIndex * 10) / 10;

  const newLowHandicapIndex =
    lowHandicapIndex === null ? rawIndex : Math.min(lowHandicapIndex, rawIndex);

  const cappedIndex = applySoftHardCap(rawIndex, lowHandicapIndex);

  const maxHandicap = 54.0;
  const finalIndex = Math.min(cappedIndex, maxHandicap);

  return {
    handicapIndex: finalIndex,
    newLowHandicapIndex,
  };
}

/**
 * Get the indices of differentials that contribute to the handicap calculation
 * Returns an array of indices (0-based) corresponding to the best N differentials
 */
export function getContributingIndices(differentials: number[]): number[] {
  const count = differentials.length;
  if (count < 3) {
    return [];
  }

  const useCount = getWhsUseCount(count);
  if (useCount === 0) {
    return [];
  }

  const indexed = differentials.map((value, index) => ({ index, value }));
  indexed.sort((a, b) => a.value - b.value);

  return indexed.slice(0, useCount).map((item) => item.index);
}

/**
 * Get the number of differentials to use based on the WHS table
 * @deprecated Use getWhsUseCount from @draco/shared-schemas directly
 */
export function getUseCount(scoreCount: number): number {
  return getWhsUseCount(scoreCount);
}

/**
 * Calculate average score (normalized to 18 holes)
 */
export function calculateAverageScore(scores: ScoreForAverage[]): number | null {
  if (scores.length === 0) {
    return null;
  }

  const normalizedScores = scores
    .map((score) => {
      if (score.holesPlayed === 18) {
        return score.totalScore;
      }
      if (score.holesPlayed === 9) {
        return score.totalScore * 2;
      }
      return null;
    })
    .filter((s): s is number => s !== null);

  if (normalizedScores.length === 0) {
    return null;
  }

  const sum = normalizedScores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / normalizedScores.length) * 10) / 10;
}

export type Gender = 'M' | 'F';

export interface TeeRatings {
  mensRating: number;
  mensSlope: number;
  womansRating: number;
  womansSlope: number;
}

/**
 * Get the appropriate course rating and slope for a gender
 */
export function getRatingsForGender(
  teeRatings: TeeRatings,
  gender: Gender,
): { courseRating: number; slopeRating: number } {
  if (gender === 'F') {
    return {
      courseRating: teeRatings.womansRating || teeRatings.mensRating || 72,
      slopeRating: teeRatings.womansSlope || teeRatings.mensSlope || 113,
    };
  }
  return {
    courseRating: teeRatings.mensRating || 72,
    slopeRating: teeRatings.mensSlope || 113,
  };
}

export interface CoursePars {
  menspar1: number;
  menspar2: number;
  menspar3: number;
  menspar4: number;
  menspar5: number;
  menspar6: number;
  menspar7: number;
  menspar8: number;
  menspar9: number;
  menspar10: number;
  menspar11: number;
  menspar12: number;
  menspar13: number;
  menspar14: number;
  menspar15: number;
  menspar16: number;
  menspar17: number;
  menspar18: number;
  womanspar1: number;
  womanspar2: number;
  womanspar3: number;
  womanspar4: number;
  womanspar5: number;
  womanspar6: number;
  womanspar7: number;
  womanspar8: number;
  womanspar9: number;
  womanspar10: number;
  womanspar11: number;
  womanspar12: number;
  womanspar13: number;
  womanspar14: number;
  womanspar15: number;
  womanspar16: number;
  womanspar17: number;
  womanspar18: number;
}

export interface CourseHandicaps {
  menshandicap1: number;
  menshandicap2: number;
  menshandicap3: number;
  menshandicap4: number;
  menshandicap5: number;
  menshandicap6: number;
  menshandicap7: number;
  menshandicap8: number;
  menshandicap9: number;
  menshandicap10: number;
  menshandicap11: number;
  menshandicap12: number;
  menshandicap13: number;
  menshandicap14: number;
  menshandicap15: number;
  menshandicap16: number;
  menshandicap17: number;
  menshandicap18: number;
  womanshandicap1: number;
  womanshandicap2: number;
  womanshandicap3: number;
  womanshandicap4: number;
  womanshandicap5: number;
  womanshandicap6: number;
  womanshandicap7: number;
  womanshandicap8: number;
  womanshandicap9: number;
  womanshandicap10: number;
  womanshandicap11: number;
  womanshandicap12: number;
  womanshandicap13: number;
  womanshandicap14: number;
  womanshandicap15: number;
  womanshandicap16: number;
  womanshandicap17: number;
  womanshandicap18: number;
}

/**
 * Get hole pars as an array for a given gender
 */
export function getHolePars(coursePars: CoursePars, gender: Gender): number[] {
  if (gender === 'F') {
    return [
      coursePars.womanspar1,
      coursePars.womanspar2,
      coursePars.womanspar3,
      coursePars.womanspar4,
      coursePars.womanspar5,
      coursePars.womanspar6,
      coursePars.womanspar7,
      coursePars.womanspar8,
      coursePars.womanspar9,
      coursePars.womanspar10,
      coursePars.womanspar11,
      coursePars.womanspar12,
      coursePars.womanspar13,
      coursePars.womanspar14,
      coursePars.womanspar15,
      coursePars.womanspar16,
      coursePars.womanspar17,
      coursePars.womanspar18,
    ];
  }
  return [
    coursePars.menspar1,
    coursePars.menspar2,
    coursePars.menspar3,
    coursePars.menspar4,
    coursePars.menspar5,
    coursePars.menspar6,
    coursePars.menspar7,
    coursePars.menspar8,
    coursePars.menspar9,
    coursePars.menspar10,
    coursePars.menspar11,
    coursePars.menspar12,
    coursePars.menspar13,
    coursePars.menspar14,
    coursePars.menspar15,
    coursePars.menspar16,
    coursePars.menspar17,
    coursePars.menspar18,
  ];
}

/**
 * Get hole handicap indexes as an array for a given gender
 */
export function getHoleHandicapIndexes(courseHandicaps: CourseHandicaps, gender: Gender): number[] {
  if (gender === 'F') {
    return [
      courseHandicaps.womanshandicap1,
      courseHandicaps.womanshandicap2,
      courseHandicaps.womanshandicap3,
      courseHandicaps.womanshandicap4,
      courseHandicaps.womanshandicap5,
      courseHandicaps.womanshandicap6,
      courseHandicaps.womanshandicap7,
      courseHandicaps.womanshandicap8,
      courseHandicaps.womanshandicap9,
      courseHandicaps.womanshandicap10,
      courseHandicaps.womanshandicap11,
      courseHandicaps.womanshandicap12,
      courseHandicaps.womanshandicap13,
      courseHandicaps.womanshandicap14,
      courseHandicaps.womanshandicap15,
      courseHandicaps.womanshandicap16,
      courseHandicaps.womanshandicap17,
      courseHandicaps.womanshandicap18,
    ];
  }
  return [
    courseHandicaps.menshandicap1,
    courseHandicaps.menshandicap2,
    courseHandicaps.menshandicap3,
    courseHandicaps.menshandicap4,
    courseHandicaps.menshandicap5,
    courseHandicaps.menshandicap6,
    courseHandicaps.menshandicap7,
    courseHandicaps.menshandicap8,
    courseHandicaps.menshandicap9,
    courseHandicaps.menshandicap10,
    courseHandicaps.menshandicap11,
    courseHandicaps.menshandicap12,
    courseHandicaps.menshandicap13,
    courseHandicaps.menshandicap14,
    courseHandicaps.menshandicap15,
    courseHandicaps.menshandicap16,
    courseHandicaps.menshandicap17,
    courseHandicaps.menshandicap18,
  ];
}

/**
 * Calculate total par for a course
 */
export function calculateTotalPar(holePars: number[]): number {
  return holePars.reduce((sum, par) => sum + par, 0);
}

export interface NineHoleScore {
  id: bigint;
  totalScore: number;
  rating: number;
  slope: number;
  datePlayed: Date;
  courseName: string;
}

export interface CombinedNineHoleResult {
  firstScoreId: bigint;
  secondScoreId: bigint;
  combinedScore: number;
  combinedRating: number;
  combinedSlope: number;
  differential: number;
  earlierDate: Date;
  courseNames: string;
}

/**
 * Combines two 9-hole scores into an 18-hole equivalent differential.
 * Per WHS rules, two 9-hole rounds are combined to create one 18-hole Score Differential.
 * Combined Rating = (Rating1/2) + (Rating2/2), Combined Slope = average of both slopes.
 */
export function combineNineHoleScores(
  score1: NineHoleScore,
  score2: NineHoleScore,
): CombinedNineHoleResult {
  const combinedScore = score1.totalScore + score2.totalScore;
  const combinedRating = score1.rating / 2 + score2.rating / 2;
  const combinedSlope = Math.round((score1.slope + score2.slope) / 2);
  const differential = calculateScoreDifferential(combinedScore, combinedRating, combinedSlope);

  const firstIsEarlier = score1.datePlayed <= score2.datePlayed;

  return {
    firstScoreId: firstIsEarlier ? score1.id : score2.id,
    secondScoreId: firstIsEarlier ? score2.id : score1.id,
    combinedScore,
    combinedRating,
    combinedSlope,
    differential,
    earlierDate: firstIsEarlier ? score1.datePlayed : score2.datePlayed,
    courseNames: firstIsEarlier
      ? `${score1.courseName} + ${score2.courseName}`
      : `${score2.courseName} + ${score1.courseName}`,
  };
}
