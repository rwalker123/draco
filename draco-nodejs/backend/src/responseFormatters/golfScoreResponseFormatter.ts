import { GolfScoreType, GolfScoreWithDetailsType } from '@draco/shared-schemas';
import { GolfScoreWithDetails } from '../repositories/interfaces/IGolfScoreRepository.js';
import { GolfMatchScoreEntry } from '../repositories/interfaces/IGolfMatchRepository.js';
import {
  Gender,
  calculateScoreDifferential,
  applyNetDoubleBogey,
  calculateCourseHandicap,
  getRatingsForGender,
  getHolePars,
  getHoleHandicapIndexes,
  CoursePars,
  CourseHandicaps,
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

  static formatManyWithDetails(
    scores: GolfScoreWithDetails[],
    currentHandicapIndex?: number | null,
  ): GolfScoreWithDetailsType[] {
    return scores.map((score) => this.formatWithDetails(score, currentHandicapIndex));
  }

  static formatWithDetails(
    score: GolfScoreWithDetails,
    currentHandicapIndex?: number | null,
  ): GolfScoreWithDetailsType {
    const baseScore = this.format(score);
    const gender = (score.golfer.gender as Gender) || 'M';

    const differential = this.calculateDifferential(score, gender, currentHandicapIndex);

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

  static formatMatchScore(matchScore: GolfMatchScoreEntry): GolfScoreWithDetailsType {
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
    };
  }

  private static calculateDifferential(
    score: GolfScoreWithDetails,
    gender: Gender = 'M',
    currentHandicapIndex?: number | null,
  ): number {
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

      const coursePars: CoursePars = {
        menspar1: score.golfcourse.menspar1,
        menspar2: score.golfcourse.menspar2,
        menspar3: score.golfcourse.menspar3,
        menspar4: score.golfcourse.menspar4,
        menspar5: score.golfcourse.menspar5,
        menspar6: score.golfcourse.menspar6,
        menspar7: score.golfcourse.menspar7,
        menspar8: score.golfcourse.menspar8,
        menspar9: score.golfcourse.menspar9,
        menspar10: score.golfcourse.menspar10,
        menspar11: score.golfcourse.menspar11,
        menspar12: score.golfcourse.menspar12,
        menspar13: score.golfcourse.menspar13,
        menspar14: score.golfcourse.menspar14,
        menspar15: score.golfcourse.menspar15,
        menspar16: score.golfcourse.menspar16,
        menspar17: score.golfcourse.menspar17,
        menspar18: score.golfcourse.menspar18,
        womanspar1: score.golfcourse.womanspar1,
        womanspar2: score.golfcourse.womanspar2,
        womanspar3: score.golfcourse.womanspar3,
        womanspar4: score.golfcourse.womanspar4,
        womanspar5: score.golfcourse.womanspar5,
        womanspar6: score.golfcourse.womanspar6,
        womanspar7: score.golfcourse.womanspar7,
        womanspar8: score.golfcourse.womanspar8,
        womanspar9: score.golfcourse.womanspar9,
        womanspar10: score.golfcourse.womanspar10,
        womanspar11: score.golfcourse.womanspar11,
        womanspar12: score.golfcourse.womanspar12,
        womanspar13: score.golfcourse.womanspar13,
        womanspar14: score.golfcourse.womanspar14,
        womanspar15: score.golfcourse.womanspar15,
        womanspar16: score.golfcourse.womanspar16,
        womanspar17: score.golfcourse.womanspar17,
        womanspar18: score.golfcourse.womanspar18,
      };

      const courseHandicaps: CourseHandicaps = {
        menshandicap1: score.golfcourse.menshandicap1,
        menshandicap2: score.golfcourse.menshandicap2,
        menshandicap3: score.golfcourse.menshandicap3,
        menshandicap4: score.golfcourse.menshandicap4,
        menshandicap5: score.golfcourse.menshandicap5,
        menshandicap6: score.golfcourse.menshandicap6,
        menshandicap7: score.golfcourse.menshandicap7,
        menshandicap8: score.golfcourse.menshandicap8,
        menshandicap9: score.golfcourse.menshandicap9,
        menshandicap10: score.golfcourse.menshandicap10,
        menshandicap11: score.golfcourse.menshandicap11,
        menshandicap12: score.golfcourse.menshandicap12,
        menshandicap13: score.golfcourse.menshandicap13,
        menshandicap14: score.golfcourse.menshandicap14,
        menshandicap15: score.golfcourse.menshandicap15,
        menshandicap16: score.golfcourse.menshandicap16,
        menshandicap17: score.golfcourse.menshandicap17,
        menshandicap18: score.golfcourse.menshandicap18,
        womanshandicap1: score.golfcourse.womanshandicap1,
        womanshandicap2: score.golfcourse.womanshandicap2,
        womanshandicap3: score.golfcourse.womanshandicap3,
        womanshandicap4: score.golfcourse.womanshandicap4,
        womanshandicap5: score.golfcourse.womanshandicap5,
        womanshandicap6: score.golfcourse.womanshandicap6,
        womanshandicap7: score.golfcourse.womanshandicap7,
        womanshandicap8: score.golfcourse.womanshandicap8,
        womanshandicap9: score.golfcourse.womanshandicap9,
        womanshandicap10: score.golfcourse.womanshandicap10,
        womanshandicap11: score.golfcourse.womanshandicap11,
        womanshandicap12: score.golfcourse.womanshandicap12,
        womanshandicap13: score.golfcourse.womanshandicap13,
        womanshandicap14: score.golfcourse.womanshandicap14,
        womanshandicap15: score.golfcourse.womanshandicap15,
        womanshandicap16: score.golfcourse.womanshandicap16,
        womanshandicap17: score.golfcourse.womanshandicap17,
        womanshandicap18: score.golfcourse.womanshandicap18,
      };

      const allHolePars = getHolePars(coursePars, gender);
      const allHoleHandicapIndexes = getHoleHandicapIndexes(courseHandicaps, gender);

      const holePars = is9Hole ? allHolePars.slice(0, 9) : allHolePars;
      const holeHandicapIndexes = is9Hole
        ? allHoleHandicapIndexes.slice(0, 9)
        : allHoleHandicapIndexes;
      const totalPar = calculateTotalPar(holePars);

      let courseHandicap: number | null = null;
      if (currentHandicapIndex !== undefined && currentHandicapIndex !== null) {
        courseHandicap = calculateCourseHandicap(
          currentHandicapIndex,
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
