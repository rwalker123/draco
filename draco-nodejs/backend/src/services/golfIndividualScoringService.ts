import { golfteeinformation } from '#prisma/client';
import {
  IGolfMatchRepository,
  GolfMatchScoreEntry,
} from '../repositories/interfaces/IGolfMatchRepository.js';
import {
  IGolfLeagueRepository,
  GolfLeagueSetupWithOfficers,
} from '../repositories/interfaces/IGolfLeagueRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { AbsentPlayerMode } from '../utils/golfConstants.js';
import {
  getHoleHandicapIndexes,
  getHolePars,
  calculateCourseHandicap,
  getRatingsForGender,
  normalizeGender,
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
  team1NetScore: number;
  team2NetScore: number;
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
    holePars: number[],
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
    let team1AdjustedGross = 0;
    let team2AdjustedGross = 0;

    for (let hole = 0; hole < holesPlayed; hole++) {
      const t1Gross = team1Score.holeScores[hole] || 0;
      const t2Gross = team2Score.holeScores[hole] || 0;
      const par = holePars[hole] || 4;

      team1AdjustedGross += t1Gross === 0 ? par : t1Gross;
      team2AdjustedGross += t2Gross === 0 ? par : t2Gross;

      const t1Net = t1Gross === 0 ? par : t1Gross - team1Strokes[hole];
      const t2Net = t2Gross === 0 ? par : t2Gross - team2Strokes[hole];

      team1NetScores.push(t1Net);
      team2NetScores.push(t2Net);

      if (t1Gross === 0 || t2Gross === 0) {
        continue;
      }

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
      team1NetScore: team1AdjustedGross - team1Score.courseHandicap,
      team2NetScore: team2AdjustedGross - team2Score.courseHandicap,
    };
  }

  calculateAbsentPairingPoints(
    absentPlayerMode: number,
    scoringConfig: ScoringConfig,
    holesPlayed: 9 | 18,
    presentPlayerIsTeam1: boolean,
  ): IndividualMatchResult {
    const zeroResult: IndividualMatchResult = {
      team1Points: 0,
      team2Points: 0,
      team1HoleWins: 0,
      team2HoleWins: 0,
      team1NineWins: 0,
      team2NineWins: 0,
      team1MatchWins: 0,
      team2MatchWins: 0,
      team1NetScore: 0,
      team2NetScore: 0,
    };

    if (absentPlayerMode === AbsentPlayerMode.SKIP_PAIRING) {
      return zeroResult;
    }

    if (absentPlayerMode === AbsentPlayerMode.OPPONENT_WINS) {
      const holePoints = holesPlayed * scoringConfig.perHolePoints;
      const ninePoints = holesPlayed === 18 ? scoringConfig.perNinePoints * 2 : 0;
      const matchPoints = scoringConfig.perMatchPoints;
      const totalPoints = holePoints + ninePoints + matchPoints;

      if (presentPlayerIsTeam1) {
        return {
          ...zeroResult,
          team1Points: totalPoints,
          team1HoleWins: holesPlayed,
          team1NineWins: holesPlayed === 18 ? 2 : 0,
          team1MatchWins: 1,
        };
      } else {
        return {
          ...zeroResult,
          team2Points: totalPoints,
          team2HoleWins: holesPlayed,
          team2NineWins: holesPlayed === 18 ? 2 : 0,
          team2MatchWins: 1,
        };
      }
    }

    return zeroResult;
  }

  calculateHandicapPenaltyPairingPoints(
    presentPlayerEntry: GolfMatchScoreEntry,
    course: NonNullable<Awaited<ReturnType<IGolfCourseRepository['findById']>>>,
    teeInfo: golfteeinformation | null,
    leagueSetup: GolfLeagueSetupWithOfficers,
    scoringConfig: ScoringConfig,
    holesPlayed: 9 | 18,
    presentPlayerIsTeam1: boolean,
  ): {
    result: IndividualMatchResult;
    presentPlayerTotalScore: number;
    syntheticTotalScore: number;
  } {
    const presentScore = presentPlayerEntry.golfscore;
    const presentGender = normalizeGender(presentPlayerEntry.golfer.gender);

    const holePars = getHolePars(course, presentGender).slice(0, holesPlayed);
    const holeHandicapIndexes = getHoleHandicapIndexes(course, presentGender);

    let presentCourseHandicap = 0;
    if (leagueSetup.usehandicapscoring && teeInfo) {
      const handicapIndex = holesPlayed === 9 ? presentScore.startindex9 : presentScore.startindex;
      if (handicapIndex !== null) {
        const ratings = getRatingsForGender(
          {
            mensRating: Number(teeInfo.mensrating) || 72,
            mensSlope: Number(teeInfo.menslope) || 113,
            womansRating: Number(teeInfo.womansrating) || 72,
            womansSlope: Number(teeInfo.womanslope) || 113,
          },
          presentGender,
        );
        const par = this.calculatePar(course, presentGender, holesPlayed);
        presentCourseHandicap = calculateCourseHandicap(
          handicapIndex,
          ratings.slopeRating,
          ratings.courseRating,
          par,
        );
      }
    }

    const penaltyStrokes = leagueSetup.absentplayerpenalty ?? 0;
    const syntheticHoleScores = this.generateSyntheticHoleScores(
      holePars,
      holeHandicapIndexes,
      penaltyStrokes,
      holesPlayed,
    );
    const syntheticTotalScore = syntheticHoleScores.reduce((sum, s) => sum + s, 0);

    const presentScoreData: PlayerScoreData = {
      golferId: presentScore.golferid,
      holeScores: this.extractHoleScores(presentScore, holesPlayed),
      totalScore: presentScore.totalscore,
      courseHandicap: presentCourseHandicap,
      gender: presentGender,
    };

    const syntheticScoreData: PlayerScoreData = {
      golferId: 0n,
      holeScores: syntheticHoleScores,
      totalScore: syntheticTotalScore,
      courseHandicap: 0,
      gender: presentGender,
    };

    const team1ScoreData = presentPlayerIsTeam1 ? presentScoreData : syntheticScoreData;
    const team2ScoreData = presentPlayerIsTeam1 ? syntheticScoreData : presentScoreData;

    const result = this.calculateIndividualMatchPoints(
      team1ScoreData,
      team2ScoreData,
      holeHandicapIndexes,
      holePars,
      scoringConfig,
      holesPlayed,
    );

    return {
      result,
      presentPlayerTotalScore: presentScore.totalscore,
      syntheticTotalScore,
    };
  }

  private generateSyntheticHoleScores(
    holePars: number[],
    holeHandicapIndexes: number[],
    penaltyStrokes: number,
    holesPlayed: 9 | 18,
  ): number[] {
    const syntheticScores = [...holePars];

    if (penaltyStrokes <= 0) {
      return syntheticScores;
    }

    const relevantIndexes = holeHandicapIndexes.slice(0, holesPlayed);
    const indexedHoles = relevantIndexes.map((handicapIndex, holeIndex) => ({
      holeIndex,
      handicapIndex,
    }));

    indexedHoles.sort((a, b) => a.handicapIndex - b.handicapIndex);

    // Distribute penalty strokes to hardest holes first (lowest handicap index = hardest).
    // If penalty exceeds holes played, cycle back to hardest holes for additional strokes.
    for (let i = 0; i < penaltyStrokes; i++) {
      const { holeIndex } = indexedHoles[i % holesPlayed];
      syntheticScores[holeIndex]++;
    }

    return syntheticScores;
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

    if (team1Scores.length === 0 && team2Scores.length === 0) {
      return null;
    }

    if (!match.courseid) {
      throw new NotFoundError('Match has no course assigned');
    }

    const course = await this.courseRepository.findById(match.courseid);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const teamSize = leagueSetup.leagueseason?.golfseasonconfig?.teamsize ?? 1;
    const absentPlayerMode = leagueSetup.absentplayermode ?? AbsentPlayerMode.OPPONENT_WINS;
    const numPairings = Math.max(team1Scores.length, team2Scores.length, teamSize);

    const scoringConfig: ScoringConfig = {
      perHolePoints: leagueSetup.perholepoints,
      perNinePoints: leagueSetup.perninepoints,
      perMatchPoints: leagueSetup.permatchpoints,
      useHandicapScoring: leagueSetup.usehandicapscoring,
    };

    let aggregateResult: IndividualMatchResult = {
      team1Points: 0,
      team2Points: 0,
      team1HoleWins: 0,
      team2HoleWins: 0,
      team1NineWins: 0,
      team2NineWins: 0,
      team1MatchWins: 0,
      team2MatchWins: 0,
      team1NetScore: 0,
      team2NetScore: 0,
    };

    let team1TotalScore = 0;
    let team2TotalScore = 0;

    for (let i = 0; i < numPairings; i++) {
      const team1Entry = team1Scores[i];
      const team2Entry = team2Scores[i];

      if (!team1Entry && !team2Entry) {
        continue;
      }

      const score1 = team1Entry?.golfscore;
      const score2 = team2Entry?.golfscore;

      const rawHolesPlayed = score1?.holesplayed || score2?.holesplayed || 9;
      const holesPlayed: 9 | 18 = rawHolesPlayed === 18 ? 18 : 9;

      if (team1Entry && team2Entry) {
        const pairingResult = this.calculatePairingPoints(
          team1Entry,
          team2Entry,
          course,
          match.golfteeinformation,
          leagueSetup,
          scoringConfig,
          holesPlayed,
        );
        aggregateResult = this.addResults(aggregateResult, pairingResult.result);
        team1TotalScore += pairingResult.team1TotalScore;
        team2TotalScore += pairingResult.team2TotalScore;
      } else {
        const presentPlayerIsTeam1 = !!team1Entry;
        const presentPlayerEntry = team1Entry ?? team2Entry;

        if (absentPlayerMode === AbsentPlayerMode.HANDICAP_PENALTY && presentPlayerEntry) {
          const penaltyResult = this.calculateHandicapPenaltyPairingPoints(
            presentPlayerEntry,
            course,
            match.golfteeinformation,
            leagueSetup,
            scoringConfig,
            holesPlayed,
            presentPlayerIsTeam1,
          );
          aggregateResult = this.addResults(aggregateResult, penaltyResult.result);

          if (presentPlayerIsTeam1) {
            team1TotalScore += penaltyResult.presentPlayerTotalScore;
            team2TotalScore += penaltyResult.syntheticTotalScore;
          } else {
            team1TotalScore += penaltyResult.syntheticTotalScore;
            team2TotalScore += penaltyResult.presentPlayerTotalScore;
          }
        } else {
          const absentResult = this.calculateAbsentPairingPoints(
            absentPlayerMode,
            scoringConfig,
            holesPlayed,
            presentPlayerIsTeam1,
          );
          aggregateResult = this.addResults(aggregateResult, absentResult);

          if (presentPlayerIsTeam1 && score1) {
            team1TotalScore += score1.totalscore;
          } else if (!presentPlayerIsTeam1 && score2) {
            team2TotalScore += score2.totalscore;
          }
        }
      }
    }

    await this.matchRepository.updatePoints(matchId, {
      team1points: aggregateResult.team1Points,
      team2points: aggregateResult.team2Points,
      team1totalscore: team1TotalScore,
      team2totalscore: team2TotalScore,
      team1netscore: aggregateResult.team1NetScore,
      team2netscore: aggregateResult.team2NetScore,
      team1holewins: aggregateResult.team1HoleWins,
      team2holewins: aggregateResult.team2HoleWins,
      team1ninewins: aggregateResult.team1NineWins,
      team2ninewins: aggregateResult.team2NineWins,
      team1matchwins: aggregateResult.team1MatchWins,
      team2matchwins: aggregateResult.team2MatchWins,
    });

    return aggregateResult;
  }

  private calculatePairingPoints(
    team1Entry: GolfMatchScoreEntry,
    team2Entry: GolfMatchScoreEntry,
    course: NonNullable<Awaited<ReturnType<IGolfCourseRepository['findById']>>>,
    teeInfo: golfteeinformation | null,
    leagueSetup: GolfLeagueSetupWithOfficers,
    scoringConfig: ScoringConfig,
    holesPlayed: 9 | 18,
  ): { result: IndividualMatchResult; team1TotalScore: number; team2TotalScore: number } {
    const score1 = team1Entry.golfscore;
    const score2 = team2Entry.golfscore;

    const gender1 = normalizeGender(team1Entry.golfer.gender);
    const gender2 = normalizeGender(team2Entry.golfer.gender);

    const holeHandicapIndexes = getHoleHandicapIndexes(course, gender1);

    let team1CourseHandicap = 0;
    let team2CourseHandicap = 0;

    if (leagueSetup.usehandicapscoring && teeInfo) {
      const handicapIndex1 = holesPlayed === 9 ? score1.startindex9 : score1.startindex;
      if (handicapIndex1 !== null) {
        const ratings1 = getRatingsForGender(
          {
            mensRating: Number(teeInfo.mensrating) || 72,
            mensSlope: Number(teeInfo.menslope) || 113,
            womansRating: Number(teeInfo.womansrating) || 72,
            womansSlope: Number(teeInfo.womanslope) || 113,
          },
          gender1,
        );
        const par1 = this.calculatePar(course, gender1, holesPlayed);
        team1CourseHandicap = calculateCourseHandicap(
          handicapIndex1,
          ratings1.slopeRating,
          ratings1.courseRating,
          par1,
        );
      }

      const handicapIndex2 = holesPlayed === 9 ? score2.startindex9 : score2.startindex;
      if (handicapIndex2 !== null) {
        const ratings2 = getRatingsForGender(
          {
            mensRating: Number(teeInfo.mensrating) || 72,
            mensSlope: Number(teeInfo.menslope) || 113,
            womansRating: Number(teeInfo.womansrating) || 72,
            womansSlope: Number(teeInfo.womanslope) || 113,
          },
          gender2,
        );
        const par2 = this.calculatePar(course, gender2, holesPlayed);
        team2CourseHandicap = calculateCourseHandicap(
          handicapIndex2,
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

    const holePars1 = getHolePars(course, gender1);
    const holePars2 = getHolePars(course, gender2);
    const holePars =
      gender1 === gender2 ? holePars1 : holePars1.map((p, i) => Math.round((p + holePars2[i]) / 2));

    const result = this.calculateIndividualMatchPoints(
      team1ScoreData,
      team2ScoreData,
      holeHandicapIndexes,
      holePars.slice(0, holesPlayed),
      scoringConfig,
      holesPlayed,
    );

    return {
      result,
      team1TotalScore: score1.totalscore,
      team2TotalScore: score2.totalscore,
    };
  }

  private addResults(a: IndividualMatchResult, b: IndividualMatchResult): IndividualMatchResult {
    return {
      team1Points: a.team1Points + b.team1Points,
      team2Points: a.team2Points + b.team2Points,
      team1HoleWins: a.team1HoleWins + b.team1HoleWins,
      team2HoleWins: a.team2HoleWins + b.team2HoleWins,
      team1NineWins: a.team1NineWins + b.team1NineWins,
      team2NineWins: a.team2NineWins + b.team2NineWins,
      team1MatchWins: a.team1MatchWins + b.team1MatchWins,
      team2MatchWins: a.team2MatchWins + b.team2MatchWins,
      team1NetScore: a.team1NetScore + b.team1NetScore,
      team2NetScore: a.team2NetScore + b.team2NetScore,
    };
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
