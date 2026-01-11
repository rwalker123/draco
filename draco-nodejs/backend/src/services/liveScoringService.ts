import {
  LiveScoringStateType,
  LiveHoleScoreType,
  StartLiveScoringType,
  SubmitLiveHoleScoreType,
  LiveSessionStatusType,
  ScoreUpdateEventType,
  SubmitMatchResultsType,
  PlayerMatchScoreType,
} from '@draco/shared-schemas';
import {
  ILiveScoringRepository,
  LiveScoringSessionWithScores,
  LiveHoleScoreWithDetails,
} from '../repositories/interfaces/ILiveScoringRepository.js';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { IGolfLeagueRepository } from '../repositories/interfaces/IGolfLeagueRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { getSSEManager } from './sseManager.js';
import { ServiceFactory } from './serviceFactory.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/customErrors.js';
import { GolfMatchStatus } from '../utils/golfConstants.js';
import { LIVE_SESSION_STATUS, LIVE_SESSION_STATUS_MAP } from '../constants/liveSessionConstants.js';
import { getHolePars, getHoleHandicapIndexes } from '../utils/whsCalculator.js';
import type { PlayerScoreData } from './golfIndividualScoringService.js';

interface LiveSessionCourseData {
  coursePars: number[];
  holeHandicapIndexes: number[];
  courseHandicaps: Record<string, number>;
  golferTeamMap: Record<string, 1 | 2>; // golferId -> team number
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  scoringConfig: {
    perHolePoints: number;
    perNinePoints: number;
    perMatchPoints: number;
    useHandicapScoring: boolean;
  };
}

const sessionCourseDataCache = new Map<string, LiveSessionCourseData>();

export class LiveScoringService {
  private readonly liveScoringRepository: ILiveScoringRepository;
  private readonly matchRepository: IGolfMatchRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly contactRepository: IContactRepository;
  private readonly courseRepository: IGolfCourseRepository;
  private readonly leagueRepository: IGolfLeagueRepository;

  constructor(
    liveScoringRepository?: ILiveScoringRepository,
    matchRepository?: IGolfMatchRepository,
    rosterRepository?: IGolfRosterRepository,
    contactRepository?: IContactRepository,
    courseRepository?: IGolfCourseRepository,
    leagueRepository?: IGolfLeagueRepository,
  ) {
    this.liveScoringRepository =
      liveScoringRepository ?? RepositoryFactory.getLiveScoringRepository();
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.contactRepository = contactRepository ?? RepositoryFactory.getContactRepository();
    this.courseRepository = courseRepository ?? RepositoryFactory.getGolfCourseRepository();
    this.leagueRepository = leagueRepository ?? RepositoryFactory.getGolfLeagueRepository();
  }

  async getSessionStatus(matchId: bigint): Promise<LiveSessionStatusType> {
    const session = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (!session) {
      return { hasActiveSession: false };
    }

    const viewerCount = getSSEManager().getMatchViewerCount(matchId);
    return {
      hasActiveSession: true,
      sessionId: session.id.toString(),
      viewerCount,
    };
  }

  async getSessionState(matchId: bigint): Promise<LiveScoringStateType | null> {
    const session = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (!session) {
      return null;
    }

    return this.formatSessionState(session, matchId);
  }

  async startSession(
    matchId: bigint,
    userId: string,
    accountId: bigint,
    data: StartLiveScoringType,
  ): Promise<LiveScoringStateType> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    if (match.matchstatus === GolfMatchStatus.COMPLETED) {
      throw new ValidationError('Cannot start live scoring for a completed match');
    }

    const existingSession = await this.liveScoringRepository.findByMatch(matchId);
    if (existingSession) {
      if (existingSession.status === LIVE_SESSION_STATUS.ACTIVE) {
        throw new ValidationError('A live scoring session is already active for this match');
      }
      await this.liveScoringRepository.deleteSession(existingSession.id);
    }

    await this.validateUserIsMatchParticipant(userId, accountId, match.team1, match.team2);

    const session = await this.liveScoringRepository.create({
      matchid: matchId,
      startedby: userId,
      currenthole: data.startingHole,
    });

    const fullSession = await this.liveScoringRepository.findById(session.id);
    if (!fullSession) {
      throw new Error('Failed to retrieve created session');
    }

    // Load and cache course data for net score calculations
    await this.loadAndCacheSessionCourseData(matchId, match);

    getSSEManager().broadcastToMatch(matchId, 'session_started', {
      sessionId: session.id.toString(),
      matchId: matchId.toString(),
      startedBy: userId,
      startedAt: session.startedat.toISOString(),
    });

    return this.formatSessionState(fullSession, matchId);
  }

  async submitScore(
    matchId: bigint,
    userId: string,
    accountId: bigint,
    data: SubmitLiveHoleScoreType,
  ): Promise<LiveHoleScoreType> {
    const session = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this match');
    }

    if (session.status !== LIVE_SESSION_STATUS.ACTIVE) {
      throw new ValidationError('Live scoring session is not active');
    }

    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    await this.validateUserIsMatchParticipant(userId, accountId, match.team1, match.team2);

    const golferId = BigInt(data.golferId);
    await this.validateGolferInMatch(golferId, match.team1, match.team2);

    const holeScore = await this.liveScoringRepository.upsertHoleScore({
      sessionid: session.id,
      golferid: golferId,
      holenumber: data.holeNumber,
      score: data.score,
      enteredby: userId,
    });

    const golferName = `${holeScore.golfer.contact.firstname} ${holeScore.golfer.contact.lastname}`;
    const teamId = await this.findGolferTeamId(golferId, match.team1, match.team2);

    // Calculate net score if we have cached course data
    const cacheKey = matchId.toString();
    const courseData = sessionCourseDataCache.get(cacheKey);
    let netScore: number | undefined;

    if (courseData) {
      const courseHandicap = courseData.courseHandicaps[data.golferId];
      if (courseHandicap !== undefined) {
        // Calculate strokes received on this hole based on handicap
        const strokesOnHole = this.calculateStrokesOnHole(
          courseHandicap,
          data.holeNumber,
          courseData.holeHandicapIndexes,
        );
        netScore = data.score - strokesOnHole;
      }
    }

    // Calculate updated team points after this score submission
    let teamPoints:
      | { team1Name: string; team1Points: number; team2Name: string; team2Points: number }
      | undefined;

    if (courseData) {
      const fullSession = await this.liveScoringRepository.findById(session.id);
      if (fullSession) {
        const scoresByGolfer = new Map<bigint, LiveHoleScoreWithDetails[]>();
        for (const score of fullSession.scores) {
          const existing = scoresByGolfer.get(score.golferid) ?? [];
          existing.push(score);
          scoresByGolfer.set(score.golferid, existing);
        }
        const points = this.calculateTeamPoints(scoresByGolfer, courseData);
        teamPoints = {
          team1Name: courseData.team1Name,
          team1Points: points.team1,
          team2Name: courseData.team2Name,
          team2Points: points.team2,
        };
      }
    }

    const scoreUpdateEvent: ScoreUpdateEventType = {
      golferId: holeScore.golferid.toString(),
      golferName,
      teamId: teamId?.toString(),
      holeNumber: holeScore.holenumber,
      score: holeScore.score,
      enteredBy: holeScore.enteredbyuser?.username ?? holeScore.enteredby,
      timestamp: holeScore.enteredat.toISOString(),
      teamPoints,
    };

    getSSEManager().broadcastToMatch(matchId, 'score_update', scoreUpdateEvent);

    return this.formatHoleScore(holeScore, teamId, netScore);
  }

  async advanceHole(
    matchId: bigint,
    userId: string,
    accountId: bigint,
    holeNumber: number,
  ): Promise<void> {
    const session = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this match');
    }

    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    await this.validateUserIsMatchParticipant(userId, accountId, match.team1, match.team2);

    if (holeNumber < 1 || holeNumber > 18) {
      throw new ValidationError('Hole number must be between 1 and 18');
    }

    await this.liveScoringRepository.updateCurrentHole(session.id, holeNumber);

    getSSEManager().broadcastToMatch(matchId, 'hole_advanced', {
      holeNumber,
      advancedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async finalizeSession(matchId: bigint, userId: string, accountId: bigint): Promise<void> {
    const session = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this match');
    }

    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    await this.validateUserIsMatchParticipant(userId, accountId, match.team1, match.team2);

    if (!match.courseid || !match.teeid) {
      throw new ValidationError('Match must have a course and tee assigned to save scores');
    }

    // Build the payload for submitMatchResults (same API as manual score entry)
    const payload = await this.buildMatchResultsPayload(session, {
      team1: match.team1,
      team2: match.team2,
      courseid: match.courseid,
      teeid: match.teeid,
      matchdate: match.matchdate,
    });

    // Use the same service as manual entry - this handles:
    // - Creating/updating golf scores
    // - Setting match status to COMPLETED
    // - Calculating handicap indexes (time-based, using match date)
    // - Calculating and storing match points
    const golfScoreService = ServiceFactory.getGolfScoreService();
    await golfScoreService.submitMatchResults(matchId, payload);

    // Mark live session as finalized
    await this.liveScoringRepository.updateStatus(session.id, LIVE_SESSION_STATUS.FINALIZED);

    // Clean up cached course data
    sessionCourseDataCache.delete(matchId.toString());

    // Broadcast finalization event
    getSSEManager().broadcastToMatch(matchId, 'session_finalized', {
      sessionId: session.id.toString(),
      matchId: matchId.toString(),
      finalizedBy: userId,
      finalizedAt: new Date().toISOString(),
    });
  }

  private async buildMatchResultsPayload(
    session: LiveScoringSessionWithScores,
    match: { team1: bigint; team2: bigint; courseid: bigint; teeid: bigint; matchdate: Date },
  ): Promise<SubmitMatchResultsType> {
    // Group scores by golfer
    const scoresByGolfer = new Map<bigint, LiveHoleScoreWithDetails[]>();
    for (const score of session.scores) {
      const existing = scoresByGolfer.get(score.golferid) ?? [];
      existing.push(score);
      scoresByGolfer.set(score.golferid, existing);
    }

    // Batch load rosters for both teams
    const [team1Roster, team2Roster] = await Promise.all([
      this.rosterRepository.findByTeamSeasonId(match.team1),
      this.rosterRepository.findByTeamSeasonId(match.team2),
    ]);

    // Build golfer → roster mapping
    const golferToRoster = new Map<string, { rosterId: bigint; teamSeasonId: bigint }>();
    for (const entry of team1Roster) {
      golferToRoster.set(entry.golferid.toString(), {
        rosterId: entry.id,
        teamSeasonId: match.team1,
      });
    }
    for (const entry of team2Roster) {
      golferToRoster.set(entry.golferid.toString(), {
        rosterId: entry.id,
        teamSeasonId: match.team2,
      });
    }

    // Build PlayerMatchScoreType array
    const scores: PlayerMatchScoreType[] = [];
    for (const [golferId, holeScores] of scoresByGolfer) {
      const rosterInfo = golferToRoster.get(golferId.toString());
      if (!rosterInfo) {
        console.warn(`Golfer ${golferId} not found in either team roster, skipping`);
        continue;
      }

      // Build hole scores array (18 holes, 0 if not entered)
      const holeScoresArray: number[] = Array(18).fill(0);
      for (const hs of holeScores) {
        if (hs.holenumber >= 1 && hs.holenumber <= 18) {
          holeScoresArray[hs.holenumber - 1] = hs.score;
        }
      }

      scores.push({
        teamSeasonId: rosterInfo.teamSeasonId.toString(),
        rosterId: rosterInfo.rosterId.toString(),
        isAbsent: false,
        isSubstitute: false,
        score: {
          courseId: match.courseid.toString(),
          teeId: match.teeid.toString(),
          datePlayed: match.matchdate.toISOString().split('T')[0],
          holesPlayed: 18,
          totalsOnly: false,
          holeScores: holeScoresArray,
          // startIndex intentionally omitted - server will calculate based on match date
        },
      });
    }

    return {
      courseId: match.courseid.toString(),
      scores,
    };
  }

  async stopSession(matchId: bigint, userId: string, accountId: bigint): Promise<void> {
    const session = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this match');
    }

    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    await this.validateUserIsMatchParticipant(userId, accountId, match.team1, match.team2);

    await this.liveScoringRepository.updateStatus(session.id, LIVE_SESSION_STATUS.STOPPED);

    // Clean up cached course data
    sessionCourseDataCache.delete(matchId.toString());

    getSSEManager().broadcastToMatch(matchId, 'session_stopped', {
      sessionId: session.id.toString(),
      matchId: matchId.toString(),
      stoppedBy: userId,
      stoppedAt: new Date().toISOString(),
    });
  }

  async getActiveSessionsForAccount(
    accountId: bigint,
  ): Promise<{ matchId: string; sessionId: string }[]> {
    const sessions = await this.liveScoringRepository.findActiveSessionsForAccount(accountId);
    return sessions.map((s) => ({
      matchId: s.matchId.toString(),
      sessionId: s.sessionId.toString(),
    }));
  }

  private async validateUserIsMatchParticipant(
    userId: string,
    accountId: bigint,
    team1Id: bigint,
    team2Id: bigint,
  ): Promise<void> {
    const contact = await this.contactRepository.findByUserId(userId, accountId);
    if (!contact) {
      throw new AuthorizationError('User is not a member of this account');
    }

    const golfer = await this.rosterRepository.findGolferByContactId(contact.id);
    if (!golfer) {
      throw new AuthorizationError('User does not have a golfer profile');
    }

    const teamId = await this.findGolferTeamId(golfer.id, team1Id, team2Id);
    if (!teamId) {
      throw new AuthorizationError('User is not a participant in this match');
    }
  }

  private async validateGolferInMatch(
    golferId: bigint,
    team1Id: bigint,
    team2Id: bigint,
  ): Promise<void> {
    const teamId = await this.findGolferTeamId(golferId, team1Id, team2Id);
    if (!teamId) {
      throw new ValidationError('Golfer is not a participant in this match');
    }
  }

  private async findGolferTeamId(
    golferId: bigint,
    team1Id: bigint,
    team2Id: bigint,
  ): Promise<bigint | undefined> {
    const team1Roster = await this.rosterRepository.findByGolferAndTeam(golferId, team1Id);
    if (team1Roster) return team1Id;

    const team2Roster = await this.rosterRepository.findByGolferAndTeam(golferId, team2Id);
    if (team2Roster) return team2Id;

    return undefined;
  }

  private formatSessionState(
    session: LiveScoringSessionWithScores,
    matchId: bigint,
  ): LiveScoringStateType {
    const viewerCount = getSSEManager().getMatchViewerCount(matchId);
    const cacheKey = matchId.toString();
    const courseData = sessionCourseDataCache.get(cacheKey);

    const scoresByGolfer = new Map<bigint, LiveHoleScoreWithDetails[]>();
    for (const score of session.scores) {
      const existing = scoresByGolfer.get(score.golferid) ?? [];
      existing.push(score);
      scoresByGolfer.set(score.golferid, existing);
    }

    // Format scores with net scores calculated
    const formattedScores: LiveHoleScoreType[] = session.scores.map((score) => {
      let netScore: number | undefined;
      if (courseData) {
        const courseHandicap = courseData.courseHandicaps[score.golferid.toString()];
        if (courseHandicap !== undefined) {
          const strokesOnHole = this.calculateStrokesOnHole(
            courseHandicap,
            score.holenumber,
            courseData.holeHandicapIndexes,
          );
          netScore = score.score - strokesOnHole;
        }
      }
      return this.formatHoleScore(score, undefined, netScore);
    });

    // Calculate team points if we have course data
    let teamPoints:
      | { team1Name: string; team1Points: number; team2Name: string; team2Points: number }
      | undefined;
    if (courseData) {
      const points = this.calculateTeamPoints(scoresByGolfer, courseData);
      teamPoints = {
        team1Name: courseData.team1Name,
        team1Points: points.team1,
        team2Name: courseData.team2Name,
        team2Points: points.team2,
      };
    }

    return {
      sessionId: session.id.toString(),
      matchId: session.matchid.toString(),
      status: LIVE_SESSION_STATUS_MAP[session.status] ?? 'active',
      currentHole: session.currenthole,
      holesPlayed: 18,
      startedAt: session.startedat.toISOString(),
      startedBy: session.startedbyuser?.username ?? session.startedby,
      viewerCount,
      scores: formattedScores,
      coursePars: courseData?.coursePars,
      courseHandicaps: courseData?.courseHandicaps,
      teamPoints,
    };
  }

  private formatHoleScore(
    score: LiveHoleScoreWithDetails,
    teamId?: bigint,
    netScore?: number,
  ): LiveHoleScoreType {
    return {
      id: score.id.toString(),
      golferId: score.golferid.toString(),
      golferName: `${score.golfer.contact.firstname} ${score.golfer.contact.lastname}`,
      teamId: teamId?.toString(),
      holeNumber: score.holenumber,
      score: score.score,
      netScore,
      enteredBy: score.enteredbyuser?.username ?? score.enteredby,
      enteredAt: score.enteredat.toISOString(),
    };
  }

  private async loadAndCacheSessionCourseData(
    matchId: bigint,
    match: {
      team1: bigint;
      team2: bigint;
      teeid: bigint | null;
      leagueid: bigint;
      teamsseason_golfmatch_team1Toteamsseason: { name: string };
      teamsseason_golfmatch_team2Toteamsseason: { name: string };
    },
  ): Promise<void> {
    const cacheKey = matchId.toString();

    // Skip if no tee assigned (can't calculate handicaps without tee info)
    if (!match.teeid) {
      return;
    }

    // Load league setup for scoring configuration
    const leagueSetup = await this.leagueRepository.findByLeagueSeasonId(match.leagueid);
    if (!leagueSetup) {
      return;
    }

    // Load course data via handicap service
    const handicapService = ServiceFactory.getGolfHandicapService();

    // Get golfer IDs from both teams
    const [team1Roster, team2Roster] = await Promise.all([
      this.rosterRepository.findByTeamSeasonId(match.team1),
      this.rosterRepository.findByTeamSeasonId(match.team2),
    ]);

    const allGolferIds = [
      ...team1Roster.map((r) => r.golferid),
      ...team2Roster.map((r) => r.golferid),
    ];

    // Calculate course handicaps for all golfers
    const batchHandicaps = await handicapService.calculateBatchCourseHandicaps(
      allGolferIds,
      match.teeid,
      18, // assuming 18 holes for now
    );

    // Build course handicaps map (golferId -> courseHandicap)
    const courseHandicaps: Record<string, number> = {};
    for (const player of batchHandicaps.players) {
      if (player.courseHandicap !== null) {
        courseHandicaps[player.golferId] = player.courseHandicap;
      }
    }

    // Build golfer-to-team mapping
    const golferTeamMap: Record<string, 1 | 2> = {};
    for (const roster of team1Roster) {
      golferTeamMap[roster.golferid.toString()] = 1;
    }
    for (const roster of team2Roster) {
      golferTeamMap[roster.golferid.toString()] = 2;
    }

    // Load course for pars and handicap indexes
    const course = await this.courseRepository.findByIdWithTees(
      BigInt(batchHandicaps.teeId.split('/')[0]) || match.teeid,
    );

    // Get course pars using whsCalculator utility
    let coursePars: number[] = [];
    let holeHandicapIndexes: number[] = [];

    if (course) {
      // Use 'M' as default gender for pars display (pars are typically same for both)
      coursePars = getHolePars(course, 'M');
      holeHandicapIndexes = getHoleHandicapIndexes(course, 'M');
    }

    // Cache the data for this session
    sessionCourseDataCache.set(cacheKey, {
      coursePars,
      holeHandicapIndexes,
      courseHandicaps,
      golferTeamMap,
      team1Id: match.team1.toString(),
      team2Id: match.team2.toString(),
      team1Name: match.teamsseason_golfmatch_team1Toteamsseason.name,
      team2Name: match.teamsseason_golfmatch_team2Toteamsseason.name,
      scoringConfig: {
        perHolePoints: leagueSetup.perholepoints,
        perNinePoints: leagueSetup.perninepoints,
        perMatchPoints: leagueSetup.permatchpoints,
        useHandicapScoring: leagueSetup.usehandicapscoring,
      },
    });
  }

  private calculateStrokesOnHole(
    courseHandicap: number,
    holeNumber: number,
    holeHandicapIndexes: number[],
  ): number {
    if (courseHandicap <= 0 || holeHandicapIndexes.length === 0) {
      return 0;
    }

    const holeHandicapIndex = holeHandicapIndexes[holeNumber - 1];
    if (holeHandicapIndex === undefined) {
      return 0;
    }

    // Distribute strokes based on hole handicap index
    // Lower handicap index = harder hole = gets strokes first
    let strokes = 0;
    let remainingHandicap = courseHandicap;

    // First pass: one stroke per hole starting from hardest
    if (holeHandicapIndex <= remainingHandicap) {
      strokes++;
      remainingHandicap -= 18; // After 18 holes get a stroke, continue to second pass
    }

    // Second pass: additional strokes for very high handicaps
    while (remainingHandicap > 0 && holeHandicapIndex <= remainingHandicap) {
      strokes++;
      remainingHandicap -= 18;
    }

    return strokes;
  }

  private calculateTeamPoints(
    scoresByGolfer: Map<bigint, LiveHoleScoreWithDetails[]>,
    courseData: LiveSessionCourseData,
  ): { team1: number; team2: number } {
    const scoringService = ServiceFactory.getGolfIndividualScoringService();

    const team1Scores = this.buildTeamScoreData(scoresByGolfer, courseData, 1);
    const team2Scores = this.buildTeamScoreData(scoresByGolfer, courseData, 2);

    // Determine which nines are complete (both teams have scores for all 9 holes)
    const front9Complete = this.isNineComplete(
      team1Scores.holeScores,
      team2Scores.holeScores,
      0,
      9,
    );
    const back9Complete = this.isNineComplete(
      team1Scores.holeScores,
      team2Scores.holeScores,
      9,
      18,
    );

    // Only award per-nine points if that nine is complete
    // We need to calculate this manually since calculateIndividualMatchPoints
    // doesn't support partial nine completion
    let perNinePoints = 0;
    if (front9Complete && back9Complete) {
      // Both nines complete - use standard calculation
      perNinePoints = courseData.scoringConfig.perNinePoints;
    }

    // Calculate base points (per-hole only, no nine/match points yet)
    const result = scoringService.calculateIndividualMatchPoints(
      team1Scores,
      team2Scores,
      courseData.holeHandicapIndexes,
      courseData.coursePars,
      {
        perHolePoints: courseData.scoringConfig.perHolePoints,
        perNinePoints: perNinePoints,
        perMatchPoints: 0,
        useHandicapScoring: courseData.scoringConfig.useHandicapScoring,
      },
      18,
    );

    let team1Points = result.team1Points;
    let team2Points = result.team2Points;

    // If only one nine is complete, calculate that nine's points manually
    if (courseData.scoringConfig.perNinePoints > 0 && front9Complete !== back9Complete) {
      const ninePoints = this.calculateCompletedNinePoints(
        team1Scores,
        team2Scores,
        courseData,
        front9Complete,
        back9Complete,
      );
      team1Points += ninePoints.team1;
      team2Points += ninePoints.team2;
    }

    return { team1: team1Points, team2: team2Points };
  }

  private isNineComplete(
    team1Scores: number[],
    team2Scores: number[],
    startHole: number,
    endHole: number,
  ): boolean {
    for (let i = startHole; i < endHole; i++) {
      if (team1Scores[i] === 0 || team2Scores[i] === 0) {
        return false;
      }
    }
    return true;
  }

  private calculateCompletedNinePoints(
    team1Scores: PlayerScoreData,
    team2Scores: PlayerScoreData,
    courseData: LiveSessionCourseData,
    front9Complete: boolean,
    back9Complete: boolean,
  ): { team1: number; team2: number } {
    let team1Points = 0;
    let team2Points = 0;
    const perNinePoints = courseData.scoringConfig.perNinePoints;

    // Calculate stroke distribution for handicap adjustment
    const scoringService = ServiceFactory.getGolfIndividualScoringService();
    const { team1Strokes, team2Strokes } = courseData.scoringConfig.useHandicapScoring
      ? scoringService.calculateStrokeDistribution(
          team1Scores.courseHandicap,
          team2Scores.courseHandicap,
          courseData.holeHandicapIndexes,
          18,
        )
      : { team1Strokes: new Array(18).fill(0), team2Strokes: new Array(18).fill(0) };

    if (front9Complete) {
      let front9Team1 = 0;
      let front9Team2 = 0;
      for (let i = 0; i < 9; i++) {
        front9Team1 += team1Scores.holeScores[i] - team1Strokes[i];
        front9Team2 += team2Scores.holeScores[i] - team2Strokes[i];
      }
      if (front9Team1 < front9Team2) {
        team1Points += perNinePoints;
      } else if (front9Team2 < front9Team1) {
        team2Points += perNinePoints;
      } else {
        team1Points += perNinePoints / 2;
        team2Points += perNinePoints / 2;
      }
    }

    if (back9Complete) {
      let back9Team1 = 0;
      let back9Team2 = 0;
      for (let i = 9; i < 18; i++) {
        back9Team1 += team1Scores.holeScores[i] - team1Strokes[i];
        back9Team2 += team2Scores.holeScores[i] - team2Strokes[i];
      }
      if (back9Team1 < back9Team2) {
        team1Points += perNinePoints;
      } else if (back9Team2 < back9Team1) {
        team2Points += perNinePoints;
      } else {
        team1Points += perNinePoints / 2;
        team2Points += perNinePoints / 2;
      }
    }

    return { team1: team1Points, team2: team2Points };
  }

  private buildTeamScoreData(
    scoresByGolfer: Map<bigint, LiveHoleScoreWithDetails[]>,
    courseData: LiveSessionCourseData,
    teamNumber: 1 | 2,
  ): PlayerScoreData {
    const holeScores: number[] = new Array(18).fill(0);
    let representativeGolferId = 0n;
    let courseHandicap = 0;

    for (const [golferId, scores] of scoresByGolfer) {
      const golferIdStr = golferId.toString();
      if (courseData.golferTeamMap[golferIdStr] !== teamNumber) continue;

      if (representativeGolferId === 0n) {
        representativeGolferId = golferId;
        courseHandicap = courseData.courseHandicaps[golferIdStr] ?? 0;
      }

      for (const score of scores) {
        const holeIdx = score.holenumber - 1;
        if (holeScores[holeIdx] === 0 || score.score < holeScores[holeIdx]) {
          holeScores[holeIdx] = score.score;
        }
      }
    }

    return {
      golferId: representativeGolferId,
      holeScores,
      totalScore: holeScores.reduce((sum, s) => sum + s, 0),
      courseHandicap,
      gender: 'M',
    };
  }

  async cleanupStaleSessions(): Promise<number> {
    const count = await this.liveScoringRepository.markAllActiveSessionsAbandoned();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale live scoring session(s)`);
    }
    return count;
  }

  async cleanupStaleSessionsByAge(staleThresholdMs: number): Promise<number> {
    const count =
      await this.liveScoringRepository.markStaleActiveSessionsAbandoned(staleThresholdMs);
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale live scoring session(s) by age`);
    }
    return count;
  }
}
