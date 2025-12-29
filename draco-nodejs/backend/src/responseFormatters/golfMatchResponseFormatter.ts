import { GolfMatchType, GolfMatchWithScoresType } from '@draco/shared-schemas';
import {
  GolfMatchWithTeams,
  GolfMatchWithScores,
} from '../repositories/interfaces/IGolfMatchRepository.js';
import { GolfCourseResponseFormatter } from './golfCourseResponseFormatter.js';
import { GolfScoreResponseFormatter } from './golfScoreResponseFormatter.js';
import { GolfTeeResponseFormatter } from './golfTeeResponseFormatter.js';

export class GolfMatchResponseFormatter {
  static format(match: GolfMatchWithTeams): GolfMatchType {
    return {
      id: match.id.toString(),
      team1: {
        id: match.teamsseason_golfmatch_team1Toteamsseason.id.toString(),
        name: match.teamsseason_golfmatch_team1Toteamsseason.name,
      },
      team2: {
        id: match.teamsseason_golfmatch_team2Toteamsseason.id.toString(),
        name: match.teamsseason_golfmatch_team2Toteamsseason.name,
      },
      leagueSeasonId: match.leagueid.toString(),
      matchDate: match.matchdate.toISOString().split('T')[0],
      matchTime: match.matchtime.toISOString().split('T')[1].substring(0, 5),
      course: match.golfcourse ? GolfCourseResponseFormatter.format(match.golfcourse) : undefined,
      tee: match.golfteeinformation
        ? GolfTeeResponseFormatter.format(match.golfteeinformation)
        : undefined,
      matchStatus: match.matchstatus,
      matchType: match.matchtype,
      comment: match.comment || undefined,
    };
  }

  static formatMany(matches: GolfMatchWithTeams[]): GolfMatchType[] {
    return matches.map((match) => this.format(match));
  }

  static formatWithScores(match: GolfMatchWithScores): GolfMatchWithScoresType {
    const baseMatch = this.format(match);

    const team1Scores = match.golfmatchscores
      .filter((ms) => ms.teamid === match.team1)
      .map((ms) => GolfScoreResponseFormatter.formatMatchScore(ms));

    const team2Scores = match.golfmatchscores
      .filter((ms) => ms.teamid === match.team2)
      .map((ms) => GolfScoreResponseFormatter.formatMatchScore(ms));

    const team1TotalScore = team1Scores.reduce((sum, s) => sum + s.totalScore, 0);
    const team2TotalScore = team2Scores.reduce((sum, s) => sum + s.totalScore, 0);

    return {
      ...baseMatch,
      team1Scores: team1Scores.length > 0 ? team1Scores : undefined,
      team2Scores: team2Scores.length > 0 ? team2Scores : undefined,
      team1TotalScore: team1Scores.length > 0 ? team1TotalScore : undefined,
      team2TotalScore: team2Scores.length > 0 ? team2TotalScore : undefined,
    };
  }
}
