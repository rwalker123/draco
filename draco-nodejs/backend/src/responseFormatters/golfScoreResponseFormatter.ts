import { GolfScoreType, GolfScoreWithDetailsType } from '@draco/shared-schemas';
import { GolfScoreWithDetails } from '../repositories/interfaces/IGolfScoreRepository.js';
import { GolfMatchScoreEntry } from '../repositories/interfaces/IGolfMatchRepository.js';

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

    const differential = this.calculateDifferential(score);

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

  private static calculateDifferential(score: GolfScoreWithDetails): number {
    const courseRating = Number(score.golfteeinformation.mensrating) || 72;
    const slopeRating = Number(score.golfteeinformation.menslope) || 113;

    const differential = ((score.totalscore - courseRating) * 113) / slopeRating;

    return Math.round(differential * 10) / 10;
  }
}
