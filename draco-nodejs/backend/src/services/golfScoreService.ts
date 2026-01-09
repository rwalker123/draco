import {
  GolfScoreType,
  GolfScoreWithDetailsType,
  GolfMatchType,
  SubmitMatchResultsType,
  PlayerMatchScoreType,
  PlayerSeasonScoresResponseType,
} from '@draco/shared-schemas';
import {
  IGolfScoreRepository,
  MatchScoreSubmission,
} from '../repositories/interfaces/IGolfScoreRepository.js';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { IGolfLeagueRepository } from '../repositories/interfaces/IGolfLeagueRepository.js';
import { IGolfTeeRepository } from '../repositories/interfaces/IGolfTeeRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { GolfScoreResponseFormatter } from '../responseFormatters/golfScoreResponseFormatter.js';
import { GolfMatchResponseFormatter } from '../responseFormatters/golfMatchResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { GolfMatchStatus, FullTeamAbsentMode } from '../utils/golfConstants.js';
import { ServiceFactory } from './serviceFactory.js';

export class GolfScoreService {
  private readonly scoreRepository: IGolfScoreRepository;
  private readonly matchRepository: IGolfMatchRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly courseRepository: IGolfCourseRepository;
  private readonly leagueRepository: IGolfLeagueRepository;
  private readonly teeRepository: IGolfTeeRepository;

  constructor(
    scoreRepository?: IGolfScoreRepository,
    matchRepository?: IGolfMatchRepository,
    rosterRepository?: IGolfRosterRepository,
    courseRepository?: IGolfCourseRepository,
    leagueRepository?: IGolfLeagueRepository,
    teeRepository?: IGolfTeeRepository,
  ) {
    this.scoreRepository = scoreRepository ?? RepositoryFactory.getGolfScoreRepository();
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.courseRepository = courseRepository ?? RepositoryFactory.getGolfCourseRepository();
    this.leagueRepository = leagueRepository ?? RepositoryFactory.getGolfLeagueRepository();
    this.teeRepository = teeRepository ?? RepositoryFactory.getGolfTeeRepository();
  }

  async getScoreById(scoreId: bigint): Promise<GolfScoreWithDetailsType> {
    const score = await this.scoreRepository.findById(scoreId);
    if (!score) {
      throw new NotFoundError('Golf score not found');
    }
    return GolfScoreResponseFormatter.formatWithDetails(score);
  }

  async getScoresForPlayer(golferId: bigint, limit = 20): Promise<GolfScoreType[]> {
    const scores = await this.scoreRepository.findByGolferId(golferId, limit);
    return GolfScoreResponseFormatter.formatMany(scores);
  }

  async getScoresForMatch(matchId: bigint): Promise<GolfScoreWithDetailsType[]> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    // Get course and tee for courseHandicap calculation from stored startIndex
    const course = match.courseid ? await this.courseRepository.findById(match.courseid) : null;
    const tee = match.teeid ? await this.teeRepository.findById(match.teeid) : null;

    const matchScores = await this.scoreRepository.findByMatchId(matchId);
    return matchScores.map((ms) =>
      GolfScoreResponseFormatter.formatMatchScoreFromDetails(ms, course, tee),
    );
  }

  async getScoresForTeamInMatch(
    matchId: bigint,
    teamId: bigint,
  ): Promise<GolfScoreWithDetailsType[]> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }
    const matchScores = await this.scoreRepository.findByTeamAndMatch(matchId, teamId);
    return matchScores.map((ms) => GolfScoreResponseFormatter.formatWithDetails(ms.golfscore));
  }

  async submitMatchResults(matchId: bigint, data: SubmitMatchResultsType): Promise<GolfMatchType> {
    const match = await this.matchRepository.findByIdWithScores(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    const courseId = BigInt(data.courseId);
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const leagueSetup = await this.leagueRepository.findByLeagueSeasonId(match.leagueid);
    if (!leagueSetup) {
      throw new NotFoundError('League setup not found');
    }

    const scoresByTeam = new Map<bigint, PlayerMatchScoreType[]>();
    for (const playerScore of data.scores) {
      const teamSeasonId = BigInt(playerScore.teamSeasonId);

      if (teamSeasonId !== match.team1 && teamSeasonId !== match.team2) {
        throw new ValidationError(`Team ${playerScore.teamSeasonId} is not part of this match`);
      }

      if (!scoresByTeam.has(teamSeasonId)) {
        scoresByTeam.set(teamSeasonId, []);
      }
      scoresByTeam.get(teamSeasonId)!.push(playerScore);
    }

    const team1Players = scoresByTeam.get(match.team1) ?? [];
    const team2Players = scoresByTeam.get(match.team2) ?? [];
    const team1Present = team1Players.filter((p) => !p.isAbsent);
    const team2Present = team2Players.filter((p) => !p.isAbsent);
    const team1FullAbsent = team1Players.length > 0 && team1Present.length === 0;
    const team2FullAbsent = team2Players.length > 0 && team2Present.length === 0;

    if (
      (team1FullAbsent || team2FullAbsent) &&
      leagueSetup.fullteamabsentmode === FullTeamAbsentMode.FORFEIT
    ) {
      return this.handleFullTeamAbsence(
        matchId,
        match,
        leagueSetup,
        team1FullAbsent,
        team2FullAbsent,
      );
    }

    const rosterIds = data.scores.filter((ps) => !ps.isAbsent).map((ps) => BigInt(ps.rosterId));
    const rosterEntries = await this.rosterRepository.findByIds(rosterIds);
    const rosterMap = new Map(rosterEntries.map((r) => [r.id, r]));

    const handicapService = ServiceFactory.getGolfHandicapService();
    const submissions: MatchScoreSubmission[] = [];

    for (const [teamId, teamScores] of scoresByTeam) {
      for (const playerScore of teamScores) {
        if (playerScore.isAbsent) {
          continue;
        }

        const rosterId = BigInt(playerScore.rosterId);
        const rosterEntry = rosterMap.get(rosterId);
        if (!rosterEntry) {
          throw new NotFoundError(`Roster entry ${playerScore.rosterId} not found`);
        }

        if (!playerScore.score) {
          const playerName = `${rosterEntry.golfer.contact.firstname} ${rosterEntry.golfer.contact.lastname}`;
          throw new ValidationError(`Score data required for player ${playerName}`);
        }

        const scoreData = playerScore.score;
        const teeId = BigInt(scoreData.teeId);
        const holeScores = scoreData.holeScores ?? [];

        const totalScore =
          scoreData.totalScore ?? holeScores.reduce((sum: number, s: number) => sum + s, 0);

        let startIndex = await handicapService.calculateHandicapIndexAsOf(
          rosterEntry.golferid,
          match.matchdate,
        );
        if (startIndex === null) {
          startIndex = rosterEntry.golfer.initialdifferential ?? null;
        }
        const startIndex9 = startIndex !== null ? startIndex / 2 : null;

        submissions.push({
          teamId,
          golferId: rosterEntry.golferid,
          scoreData: {
            courseid: courseId,
            golferid: rosterEntry.golferid,
            teeid: teeId,
            dateplayed: new Date(scoreData.datePlayed),
            holesplayed: scoreData.holesPlayed,
            totalscore: totalScore,
            totalsonly: scoreData.totalsOnly,
            holescrore1: holeScores[0] ?? 0,
            holescrore2: holeScores[1] ?? 0,
            holescrore3: holeScores[2] ?? 0,
            holescrore4: holeScores[3] ?? 0,
            holescrore5: holeScores[4] ?? 0,
            holescrore6: holeScores[5] ?? 0,
            holescrore7: holeScores[6] ?? 0,
            holescrore8: holeScores[7] ?? 0,
            holescrore9: holeScores[8] ?? 0,
            holescrore10: holeScores[9] ?? 0,
            holescrore11: holeScores[10] ?? 0,
            holescrore12: holeScores[11] ?? 0,
            holescrore13: holeScores[12] ?? 0,
            holescrore14: holeScores[13] ?? 0,
            holescrore15: holeScores[14] ?? 0,
            holescrore16: holeScores[15] ?? 0,
            holescrore17: holeScores[16] ?? 0,
            holescrore18: holeScores[17] ?? 0,
            startindex: startIndex,
            startindex9: startIndex9,
          },
        });
      }
    }

    const teamIds = Array.from(scoresByTeam.keys());
    await this.scoreRepository.submitMatchScoresTransactional(matchId, teamIds, submissions);

    const firstTeeId = submissions[0]?.scoreData.teeid;
    if (firstTeeId) {
      await this.matchRepository.updateTee(matchId, firstTeeId);
    }

    const team1Scores = await this.scoreRepository.findByTeamAndMatch(matchId, match.team1);
    const team2Scores = await this.scoreRepository.findByTeamAndMatch(matchId, match.team2);

    if (team1Scores.length > 0 && team2Scores.length > 0) {
      await this.matchRepository.updateStatus(matchId, GolfMatchStatus.COMPLETED);

      const scoringService = ServiceFactory.getGolfIndividualScoringService();
      await scoringService.calculateAndStoreMatchPoints(matchId);
    }

    const updatedMatch = await this.matchRepository.findById(matchId);
    if (!updatedMatch) {
      throw new NotFoundError('Golf match not found after update');
    }
    return GolfMatchResponseFormatter.format(updatedMatch);
  }

  private async handleFullTeamAbsence(
    matchId: bigint,
    _match: Awaited<ReturnType<IGolfMatchRepository['findByIdWithScores']>> & object,
    leagueSetup: Awaited<ReturnType<IGolfLeagueRepository['findByLeagueSeasonId']>> & object,
    team1FullAbsent: boolean,
    team2FullAbsent: boolean,
  ): Promise<GolfMatchType> {
    const maxPoints = this.calculateMaxPossiblePoints(leagueSetup);

    let team1Points = 0;
    let team2Points = 0;
    let team1MatchWins = 0;
    let team2MatchWins = 0;

    if (team1FullAbsent && !team2FullAbsent) {
      team2Points = maxPoints;
      team2MatchWins = 1;
    } else if (team2FullAbsent && !team1FullAbsent) {
      team1Points = maxPoints;
      team1MatchWins = 1;
    }

    await this.matchRepository.updateStatus(matchId, GolfMatchStatus.FORFEIT);
    await this.matchRepository.updatePoints(matchId, {
      team1points: team1Points,
      team2points: team2Points,
      team1totalscore: 0,
      team2totalscore: 0,
      team1netscore: 0,
      team2netscore: 0,
      team1holewins: 0,
      team2holewins: 0,
      team1ninewins: 0,
      team2ninewins: 0,
      team1matchwins: team1MatchWins,
      team2matchwins: team2MatchWins,
    });

    const updatedMatch = await this.matchRepository.findById(matchId);
    if (!updatedMatch) {
      throw new NotFoundError('Golf match not found after forfeit update');
    }
    return GolfMatchResponseFormatter.format(updatedMatch);
  }

  private calculateMaxPossiblePoints(
    leagueSetup: Awaited<ReturnType<IGolfLeagueRepository['findByLeagueSeasonId']>> & object,
  ): number {
    const holesPerMatch = leagueSetup.holespermatch;
    const perHolePoints = leagueSetup.perholepoints;
    const perNinePoints = leagueSetup.perninepoints;
    const perMatchPoints = leagueSetup.permatchpoints;

    let maxPoints = holesPerMatch * perHolePoints;
    if (holesPerMatch === 18) {
      maxPoints += perNinePoints * 2;
    }
    maxPoints += perMatchPoints;

    return maxPoints;
  }

  async deleteMatchScores(matchId: bigint): Promise<void> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    await this.scoreRepository.deleteMatchScores(matchId);
    await this.matchRepository.updateStatus(matchId, GolfMatchStatus.SCHEDULED);
  }

  async getPlayerSeasonScores(
    contactId: bigint,
    seasonId: bigint,
  ): Promise<PlayerSeasonScoresResponseType> {
    const scores = await this.scoreRepository.getPlayerScoresForSeason(contactId, seasonId);
    const formattedScores = scores.map((s) => GolfScoreResponseFormatter.formatWithDetails(s));

    let initialDifferential: number | null = null;
    let handicapIndex: number | null = null;
    let isInitialIndex = false;
    let golferId: bigint | null = null;

    if (scores.length > 0) {
      initialDifferential = scores[0].golfer.initialdifferential ?? null;
      golferId = scores[0].golfer.id;
    } else {
      const golferRepository = RepositoryFactory.getGolferRepository();
      const golfer = await golferRepository.findByContactId(contactId);
      initialDifferential = golfer?.initialdifferential ?? null;
      golferId = golfer?.id ?? null;
    }

    if (golferId) {
      const handicapService = ServiceFactory.getGolfHandicapService();
      const playerHandicap = await handicapService.getPlayerHandicap(golferId);
      handicapIndex = playerHandicap.handicapIndex;
      isInitialIndex = playerHandicap.isInitialIndex ?? false;

      if (handicapIndex === null && initialDifferential !== null) {
        handicapIndex = initialDifferential;
        isInitialIndex = true;
      }
    }

    return {
      scores: formattedScores,
      initialDifferential,
      handicapIndex,
      isInitialIndex,
    };
  }
}
