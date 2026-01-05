import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfLeagueRepository } from '../repositories/interfaces/IGolfLeagueRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import {
  getHoleHandicapIndexes,
  calculateCourseHandicap,
  getRatingsForGender,
  type CourseHandicaps,
  type Gender,
} from '../utils/whsCalculator.js';

export interface IndividualMatchResult {
  team1Points: number;
  team2Points: number;
  team1HoleWins: number;
  team2HoleWins: number;
  team1NineWins: number;
  team2NineWins: number;
  team1MatchWins: number;
  team2MatchWins: number;
}

interface StrokeDistribution {
  team1Strokes: number[];
  team2Strokes: number[];
}

interface PlayerScoreData {
  golferId: bigint;
  holeScores: number[];
  totalScore: number;
  courseHandicap: number;
  gender: Gender;
}

interface ScoringConfig {
  perHolePoints: number;
  perNinePoints: number;
  perMatchPoints: number;
  useHandicapScoring: boolean;
}

export class GolfIndividualScoringService {
  private readonly matchRepository: IGolfMatchRepository;
  private readonly leagueRepository: IGolfLeagueRepository;
  private readonly courseRepository: IGolfCourseRepository;

  constructor(
    matchRepository?: IGolfMatchRepository,
    leagueRepository?: IGolfLeagueRepository,
    courseRepository?: IGolfCourseRepository,
  ) {
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.leagueRepository = leagueRepository ?? RepositoryFactory.getGolfLeagueRepository();
    this.courseRepository = courseRepository ?? RepositoryFactory.getGolfCourseRepository();
  }

  calculateStrokeDistribution(
    team1CourseHandicap: number,
    team2CourseHandicap: number,
    holeHandicapIndexes: number[],
    holesPlayed: 9 | 18,
  ): StrokeDistribution {
    const strokeDiff = Math.abs(team1CourseHandicap - team2CourseHandicap);
    const team1GetsStrokes = team1CourseHandicap > team2CourseHandicap;

    const team1Strokes: number[] = new Array(holesPlayed).fill(0);
    const team2Strokes: number[] = new Array(holesPlayed).fill(0);

    if (strokeDiff === 0) {
      return { team1Strokes, team2Strokes };
    }

    const relevantIndexes = holeHandicapIndexes.slice(0, holesPlayed);
    const indexedHoles = relevantIndexes.map((handicapIndex, holeIndex) => ({
      holeIndex,
      handicapIndex,
    }));

    indexedHoles.sort((a, b) => a.handicapIndex - b.handicapIndex);

    let strokesRemaining = strokeDiff;
    let pass = 0;

    while (strokesRemaining > 0) {
      for (const { holeIndex } of indexedHoles) {
        if (strokesRemaining <= 0) break;

        if (team1GetsStrokes) {
          if (team1Strokes[holeIndex] === pass) {
            team1Strokes[holeIndex]++;
            strokesRemaining--;
          }
        } else {
          if (team2Strokes[holeIndex] === pass) {
            team2Strokes[holeIndex]++;
            strokesRemaining--;
          }
        }
      }
      pass++;
    }

    return { team1Strokes, team2Strokes };
  }

  calculateIndividualMatchPoints(
    team1Score: PlayerScoreData,
    team2Score: PlayerScoreData,
    holeHandicapIndexes: number[],
    scoringConfig: ScoringConfig,
    holesPlayed: 9 | 18,
  ): IndividualMatchResult {
    let team1Points = 0;
    let team2Points = 0;
    let team1HoleWins = 0;
    let team2HoleWins = 0;
    let team1NineWins = 0;
    let team2NineWins = 0;
    let team1MatchWins = 0;
    let team2MatchWins = 0;

    const { team1Strokes, team2Strokes } = scoringConfig.useHandicapScoring
      ? this.calculateStrokeDistribution(
          team1Score.courseHandicap,
          team2Score.courseHandicap,
          holeHandicapIndexes,
          holesPlayed,
        )
      : {
          team1Strokes: new Array(holesPlayed).fill(0),
          team2Strokes: new Array(holesPlayed).fill(0),
        };

    const team1NetScores: number[] = [];
    const team2NetScores: number[] = [];

    for (let hole = 0; hole < holesPlayed; hole++) {
      const t1Gross = team1Score.holeScores[hole] || 0;
      const t2Gross = team2Score.holeScores[hole] || 0;

      if (t1Gross === 0 || t2Gross === 0) {
        team1NetScores.push(t1Gross);
        team2NetScores.push(t2Gross);
        continue;
      }

      const t1Net = t1Gross - team1Strokes[hole];
      const t2Net = t2Gross - team2Strokes[hole];

      team1NetScores.push(t1Net);
      team2NetScores.push(t2Net);

      if (t1Net < t2Net) {
        team1HoleWins++;
        team1Points += scoringConfig.perHolePoints;
      } else if (t2Net < t1Net) {
        team2HoleWins++;
        team2Points += scoringConfig.perHolePoints;
      } else {
        team1Points += scoringConfig.perHolePoints / 2;
        team2Points += scoringConfig.perHolePoints / 2;
      }
    }

    if (holesPlayed === 18 && scoringConfig.perNinePoints > 0) {
      const front9Team1 = team1NetScores.slice(0, 9).reduce((sum, s) => sum + s, 0);
      const front9Team2 = team2NetScores.slice(0, 9).reduce((sum, s) => sum + s, 0);
      const back9Team1 = team1NetScores.slice(9, 18).reduce((sum, s) => sum + s, 0);
      const back9Team2 = team2NetScores.slice(9, 18).reduce((sum, s) => sum + s, 0);

      if (front9Team1 < front9Team2) {
        team1NineWins++;
        team1Points += scoringConfig.perNinePoints;
      } else if (front9Team2 < front9Team1) {
        team2NineWins++;
        team2Points += scoringConfig.perNinePoints;
      } else {
        team1Points += scoringConfig.perNinePoints / 2;
        team2Points += scoringConfig.perNinePoints / 2;
      }

      if (back9Team1 < back9Team2) {
        team1NineWins++;
        team1Points += scoringConfig.perNinePoints;
      } else if (back9Team2 < back9Team1) {
        team2NineWins++;
        team2Points += scoringConfig.perNinePoints;
      } else {
        team1Points += scoringConfig.perNinePoints / 2;
        team2Points += scoringConfig.perNinePoints / 2;
      }
    }

    const team1Total = team1NetScores.reduce((sum, s) => sum + s, 0);
    const team2Total = team2NetScores.reduce((sum, s) => sum + s, 0);

    if (team1Total < team2Total) {
      team1MatchWins = 1;
      team1Points += scoringConfig.perMatchPoints;
    } else if (team2Total < team1Total) {
      team2MatchWins = 1;
      team2Points += scoringConfig.perMatchPoints;
    } else {
      team1Points += scoringConfig.perMatchPoints / 2;
      team2Points += scoringConfig.perMatchPoints / 2;
    }

    return {
      team1Points,
      team2Points,
      team1HoleWins,
      team2HoleWins,
      team1NineWins,
      team2NineWins,
      team1MatchWins,
      team2MatchWins,
    };
  }

  async calculateAndStoreMatchPoints(matchId: bigint): Promise<IndividualMatchResult | null> {
    const match = await this.matchRepository.findByIdWithScores(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    const leagueSetup = await this.leagueRepository.findByLeagueSeasonId(match.leagueid);
    if (!leagueSetup) {
      throw new NotFoundError('League setup not found');
    }

    if (leagueSetup.scoringtype !== 'individual') {
      return null;
    }

    const team1Scores = match.golfmatchscores.filter((ms) => ms.teamsseason.id === match.team1);
    const team2Scores = match.golfmatchscores.filter((ms) => ms.teamsseason.id === match.team2);

    if (team1Scores.length === 0 || team2Scores.length === 0) {
      return null;
    }

    const team1Entry = team1Scores[0];
    const team2Entry = team2Scores[0];
    const score1 = team1Entry.golfscore;
    const score2 = team2Entry.golfscore;

    if (!match.courseid) {
      throw new NotFoundError('Match has no course assigned');
    }

    const course = await this.courseRepository.findById(match.courseid);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const holesPlayed = (score1.holesplayed || 9) as 9 | 18;

    const gender1 = (team1Entry.golfer.gender || 'M') as Gender;
    const gender2 = (team2Entry.golfer.gender || 'M') as Gender;

    const holeHandicapIndexes = getHoleHandicapIndexes(course as CourseHandicaps, gender1);

    let team1CourseHandicap = 0;
    let team2CourseHandicap = 0;

    if (leagueSetup.usehandicapscoring && match.golfteeinformation) {
      const tee = match.golfteeinformation;

      if (score1.startindex !== null) {
        const ratings1 = getRatingsForGender(
          {
            mensRating: Number(tee.mensrating) || 72,
            mensSlope: Number(tee.menslope) || 113,
            womansRating: Number(tee.womansrating) || 72,
            womansSlope: Number(tee.womanslope) || 113,
          },
          gender1,
        );
        const par1 = this.calculatePar(course, gender1, holesPlayed);
        team1CourseHandicap = calculateCourseHandicap(
          score1.startindex,
          ratings1.slopeRating,
          ratings1.courseRating,
          par1,
        );
      }

      if (score2.startindex !== null) {
        const ratings2 = getRatingsForGender(
          {
            mensRating: Number(tee.mensrating) || 72,
            mensSlope: Number(tee.menslope) || 113,
            womansRating: Number(tee.womansrating) || 72,
            womansSlope: Number(tee.womanslope) || 113,
          },
          gender2,
        );
        const par2 = this.calculatePar(course, gender2, holesPlayed);
        team2CourseHandicap = calculateCourseHandicap(
          score2.startindex,
          ratings2.slopeRating,
          ratings2.courseRating,
          par2,
        );
      }
    }

    const team1ScoreData: PlayerScoreData = {
      golferId: score1.golferid,
      holeScores: this.extractHoleScores(score1, holesPlayed),
      totalScore: score1.totalscore,
      courseHandicap: team1CourseHandicap,
      gender: gender1,
    };

    const team2ScoreData: PlayerScoreData = {
      golferId: score2.golferid,
      holeScores: this.extractHoleScores(score2, holesPlayed),
      totalScore: score2.totalscore,
      courseHandicap: team2CourseHandicap,
      gender: gender2,
    };

    const scoringConfig: ScoringConfig = {
      perHolePoints: leagueSetup.perholepoints,
      perNinePoints: leagueSetup.perninepoints,
      perMatchPoints: leagueSetup.permatchpoints,
      useHandicapScoring: leagueSetup.usehandicapscoring,
    };

    const result = this.calculateIndividualMatchPoints(
      team1ScoreData,
      team2ScoreData,
      holeHandicapIndexes,
      scoringConfig,
      holesPlayed,
    );

    await this.matchRepository.updatePoints(matchId, {
      team1points: result.team1Points,
      team2points: result.team2Points,
      team1holewins: result.team1HoleWins,
      team2holewins: result.team2HoleWins,
      team1ninewins: result.team1NineWins,
      team2ninewins: result.team2NineWins,
      team1matchwins: result.team1MatchWins,
      team2matchwins: result.team2MatchWins,
    });

    return result;
  }

  private extractHoleScores(
    score: {
      holescrore1: number;
      holescrore2: number;
      holescrore3: number;
      holescrore4: number;
      holescrore5: number;
      holescrore6: number;
      holescrore7: number;
      holescrore8: number;
      holescrore9: number;
      holescrore10: number;
      holescrore11: number;
      holescrore12: number;
      holescrore13: number;
      holescrore14: number;
      holescrore15: number;
      holescrore16: number;
      holescrore17: number;
      holescrore18: number;
    },
    holesPlayed: 9 | 18,
  ): number[] {
    const allScores = [
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
    return allScores.slice(0, holesPlayed);
  }

  private calculatePar(
    course: {
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
    },
    gender: Gender,
    holesPlayed: 9 | 18,
  ): number {
    const pars =
      gender === 'F'
        ? [
            course.womanspar1,
            course.womanspar2,
            course.womanspar3,
            course.womanspar4,
            course.womanspar5,
            course.womanspar6,
            course.womanspar7,
            course.womanspar8,
            course.womanspar9,
            course.womanspar10,
            course.womanspar11,
            course.womanspar12,
            course.womanspar13,
            course.womanspar14,
            course.womanspar15,
            course.womanspar16,
            course.womanspar17,
            course.womanspar18,
          ]
        : [
            course.menspar1,
            course.menspar2,
            course.menspar3,
            course.menspar4,
            course.menspar5,
            course.menspar6,
            course.menspar7,
            course.menspar8,
            course.menspar9,
            course.menspar10,
            course.menspar11,
            course.menspar12,
            course.menspar13,
            course.menspar14,
            course.menspar15,
            course.menspar16,
            course.menspar17,
            course.menspar18,
          ];
    return pars.slice(0, holesPlayed).reduce((sum, p) => sum + p, 0);
  }
}
