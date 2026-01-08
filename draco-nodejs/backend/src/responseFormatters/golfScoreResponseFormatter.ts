import { GolfScoreType, GolfScoreWithDetailsType } from '@draco/shared-schemas';
import { golfcourse, golfteeinformation } from '#prisma/client';
import { GolfScoreWithDetails } from '../repositories/interfaces/IGolfScoreRepository.js';
import { GolfMatchScoreEntry } from '../repositories/interfaces/IGolfMatchRepository.js';
import {
  Gender,
  normalizeGender,
  calculateScoreDifferential,
  applyNetDoubleBogey,
  calculateCourseHandicap,
  getRatingsForGender,
  getHolePars,
  getHoleHandicapIndexes,
  TeeRatings,
  calculateTotalPar,
} from '../utils/whsCalculator.js';

export class GolfScoreResponseFormatter {
  static format(score: GolfScoreWithDetails): GolfScoreType {
    const holeScores = [
      score.holescrore1,
      score.holescrore2,
      score.holescrore3,
      score.holescrore4,
      score.holescrore5,
      score.holescrore6,
      score.holescrore7,
      score.holescrore8,
      score.holescrore9,
    ];

    if (score.holesplayed === 18) {
      holeScores.push(
        score.holescrore10,
        score.holescrore11,
        score.holescrore12,
        score.holescrore13,
        score.holescrore14,
        score.holescrore15,
        score.holescrore16,
        score.holescrore17,
        score.holescrore18,
      );
    }

    return {
      id: score.id.toString(),
      courseId: score.courseid.toString(),
      golferId: score.golferid.toString(),
      teeId: score.teeid.toString(),
      datePlayed: score.dateplayed.toISOString().split('T')[0],
      holesPlayed: score.holesplayed,
      totalScore: score.totalscore,
      totalsOnly: score.totalsonly,
      startIndex: score.startindex ?? undefined,
      startIndex9: score.startindex9 ?? undefined,
      holeScores,
    };
  }

  static formatMany(scores: GolfScoreWithDetails[]): GolfScoreType[] {
    return scores.map((score) => this.format(score));
  }

  static formatWithDetails(score: GolfScoreWithDetails): GolfScoreWithDetailsType {
    const baseScore = this.format(score);
    const gender = normalizeGender(score.golfer.gender);

    const differential = this.calculateDifferential(score, gender);

    const teeInfo = score.golfteeinformation;
    const distances = [
      teeInfo.distancehole1,
      teeInfo.distancehole2,
      teeInfo.distancehole3,
      teeInfo.distancehole4,
      teeInfo.distancehole5,
      teeInfo.distancehole6,
      teeInfo.distancehole7,
      teeInfo.distancehole8,
      teeInfo.distancehole9,
      teeInfo.distancehole10,
      teeInfo.distancehole11,
      teeInfo.distancehole12,
      teeInfo.distancehole13,
      teeInfo.distancehole14,
      teeInfo.distancehole15,
      teeInfo.distancehole16,
      teeInfo.distancehole17,
      teeInfo.distancehole18,
    ];

    return {
      ...baseScore,
      player: {
        id: score.golfer.contact.id.toString(),
        firstName: score.golfer.contact.firstname,
        lastName: score.golfer.contact.lastname,
        middleName: score.golfer.contact.middlename || undefined,
      },
      tee: {
        id: teeInfo.id.toString(),
        courseId: teeInfo.courseid.toString(),
        teeName: teeInfo.teename,
        teeColor: teeInfo.teecolor,
        priority: teeInfo.priority,
        distances,
        mensRating: teeInfo.mensrating,
        mensSlope: teeInfo.menslope,
        womansRating: teeInfo.womansrating,
        womansSlope: teeInfo.womanslope,
      },
      differential,
      courseName: score.golfcourse.name,
      courseCity: score.golfcourse.city ?? null,
      courseState: score.golfcourse.state ?? null,
    };
  }

  static formatMatchScore(
    matchScore: GolfMatchScoreEntry,
    course?: golfcourse | null,
    tee?: golfteeinformation | null,
  ): GolfScoreWithDetailsType {
    const score = matchScore.golfscore;
    const holeScores = [
      score.holescrore1,
      score.holescrore2,
      score.holescrore3,
      score.holescrore4,
      score.holescrore5,
      score.holescrore6,
      score.holescrore7,
      score.holescrore8,
      score.holescrore9,
    ];

    if (score.holesplayed === 18) {
      holeScores.push(
        score.holescrore10,
        score.holescrore11,
        score.holescrore12,
        score.holescrore13,
        score.holescrore14,
        score.holescrore15,
        score.holescrore16,
        score.holescrore17,
        score.holescrore18,
      );
    }

    let differential: number | undefined;
    let courseHandicap: number | undefined;

    if (course && tee) {
      const gender = normalizeGender(matchScore.golfer.gender);
      const handicapIndex = score.holesplayed === 9 ? score.startindex9 : score.startindex;

      const teeRatings: TeeRatings = {
        mensRating: Number(tee.mensrating) || 72,
        mensSlope: Number(tee.menslope) || 113,
        womansRating: Number(tee.womansrating) || 72,
        womansSlope: Number(tee.womanslope) || 113,
      };

      const { courseRating, slopeRating } = getRatingsForGender(teeRatings, gender);

      const is9Hole = score.holesplayed === 9;
      const allHolePars = getHolePars(course, gender);
      const allHoleHandicapIndexes = getHoleHandicapIndexes(course, gender);

      const holePars = is9Hole ? allHolePars.slice(0, 9) : allHolePars;
      const holeHandicapIndexes = is9Hole
        ? allHoleHandicapIndexes.slice(0, 9)
        : allHoleHandicapIndexes;
      const totalPar = calculateTotalPar(holePars);

      let courseHandicapForNdb: number | null = null;
      if (handicapIndex !== undefined && handicapIndex !== null) {
        courseHandicapForNdb = calculateCourseHandicap(
          handicapIndex,
          slopeRating,
          courseRating,
          totalPar,
        );
        if (is9Hole) {
          courseHandicapForNdb = Math.round(courseHandicapForNdb / 2);
        }
        courseHandicap = courseHandicapForNdb;
      }

      if (!score.totalsonly) {
        const adjustedHoleScores = applyNetDoubleBogey(
          holeScores,
          holePars,
          holeHandicapIndexes,
          courseHandicapForNdb,
        );
        const adjustedScore = adjustedHoleScores.reduce((sum, s) => sum + s, 0);
        differential = calculateScoreDifferential(adjustedScore, courseRating, slopeRating);
      } else {
        differential = calculateScoreDifferential(score.totalscore, courseRating, slopeRating);
      }
    }

    return {
      id: score.id.toString(),
      courseId: score.courseid.toString(),
      golferId: score.golferid.toString(),
      teeId: score.teeid.toString(),
      datePlayed: score.dateplayed.toISOString().split('T')[0],
      holesPlayed: score.holesplayed,
      totalScore: score.totalscore,
      totalsOnly: score.totalsonly,
      startIndex: score.startindex ?? undefined,
      startIndex9: score.startindex9 ?? undefined,
      holeScores,
      player: {
        id: matchScore.golfer.contact.id.toString(),
        firstName: matchScore.golfer.contact.firstname,
        lastName: matchScore.golfer.contact.lastname,
        middleName: matchScore.golfer.contact.middlename || undefined,
      },
      differential,
      courseHandicap,
    };
  }

  private static calculateDifferential(score: GolfScoreWithDetails, gender: Gender = 'M'): number {
    const teeRatings: TeeRatings = {
      mensRating: Number(score.golfteeinformation.mensrating) || 72,
      mensSlope: Number(score.golfteeinformation.menslope) || 113,
      womansRating: Number(score.golfteeinformation.womansrating) || 72,
      womansSlope: Number(score.golfteeinformation.womanslope) || 113,
    };

    const { courseRating, slopeRating } = getRatingsForGender(teeRatings, gender);

    let adjustedScore = score.totalscore;

    if (!score.totalsonly && (score.holesplayed === 18 || score.holesplayed === 9)) {
      const is9Hole = score.holesplayed === 9;

      const holeScores = is9Hole
        ? [
            score.holescrore1,
            score.holescrore2,
            score.holescrore3,
            score.holescrore4,
            score.holescrore5,
            score.holescrore6,
            score.holescrore7,
            score.holescrore8,
            score.holescrore9,
          ]
        : [
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

      const allHolePars = getHolePars(score.golfcourse, gender);
      const allHoleHandicapIndexes = getHoleHandicapIndexes(score.golfcourse, gender);

      const holePars = is9Hole ? allHolePars.slice(0, 9) : allHolePars;
      const holeHandicapIndexes = is9Hole
        ? allHoleHandicapIndexes.slice(0, 9)
        : allHoleHandicapIndexes;
      const totalPar = calculateTotalPar(holePars);

      let courseHandicap: number | null = null;
      const handicapIndex = is9Hole ? score.startindex9 : score.startindex;
      if (handicapIndex !== undefined && handicapIndex !== null) {
        courseHandicap = calculateCourseHandicap(
          handicapIndex,
          slopeRating,
          courseRating,
          totalPar,
        );
        if (is9Hole) {
          courseHandicap = Math.round(courseHandicap / 2);
        }
      }

      const adjustedHoleScores = applyNetDoubleBogey(
        holeScores,
        holePars,
        holeHandicapIndexes,
        courseHandicap,
      );
      adjustedScore = adjustedHoleScores.reduce((sum, s) => sum + s, 0);
    }

    return calculateScoreDifferential(adjustedScore, courseRating, slopeRating);
  }
}
