import {
  LiveScoringStateType,
  LiveHoleScoreType,
  StartLiveScoringType,
  SubmitLiveHoleScoreType,
  LiveSessionStatusType,
  ScoreUpdateEventType,
} from '@draco/shared-schemas';
import {
  ILiveScoringRepository,
  LiveScoringSessionWithScores,
  LiveHoleScoreWithDetails,
} from '../repositories/interfaces/ILiveScoringRepository.js';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { getSSEManager } from './sseManager.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/customErrors.js';
import { GolfMatchStatus } from '../utils/golfConstants.js';

const LIVE_SESSION_STATUS = {
  ACTIVE: 1,
  PAUSED: 2,
  FINALIZED: 3,
} as const;

const STATUS_MAP: Record<number, 'active' | 'paused' | 'finalized'> = {
  [LIVE_SESSION_STATUS.ACTIVE]: 'active',
  [LIVE_SESSION_STATUS.PAUSED]: 'paused',
  [LIVE_SESSION_STATUS.FINALIZED]: 'finalized',
};

export class LiveScoringService {
  private readonly liveScoringRepository: ILiveScoringRepository;
  private readonly matchRepository: IGolfMatchRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly contactRepository: IContactRepository;

  constructor(
    liveScoringRepository?: ILiveScoringRepository,
    matchRepository?: IGolfMatchRepository,
    rosterRepository?: IGolfRosterRepository,
    contactRepository?: IContactRepository,
  ) {
    this.liveScoringRepository =
      liveScoringRepository ?? RepositoryFactory.getLiveScoringRepository();
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.contactRepository = contactRepository ?? RepositoryFactory.getContactRepository();
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

    const existingSession = await this.liveScoringRepository.findActiveByMatch(matchId);
    if (existingSession) {
      throw new ValidationError('A live scoring session is already active for this match');
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
    const teamId = await this.getGolferTeamId(golferId, match.team1, match.team2);

    const scoreUpdateEvent: ScoreUpdateEventType = {
      golferId: holeScore.golferid.toString(),
      golferName,
      teamId: teamId?.toString(),
      holeNumber: holeScore.holenumber,
      score: holeScore.score,
      enteredBy: holeScore.enteredby,
      timestamp: holeScore.enteredat.toISOString(),
    };

    getSSEManager().broadcastToMatch(matchId, 'score_update', scoreUpdateEvent);

    return this.formatHoleScore(holeScore, teamId);
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

    await this.liveScoringRepository.updateStatus(session.id, LIVE_SESSION_STATUS.FINALIZED);

    getSSEManager().broadcastToMatch(matchId, 'session_finalized', {
      sessionId: session.id.toString(),
      matchId: matchId.toString(),
      finalizedBy: userId,
      finalizedAt: new Date().toISOString(),
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

    const team1Roster = await this.rosterRepository.findByGolferAndTeam(golfer.id, team1Id);
    const team2Roster = await this.rosterRepository.findByGolferAndTeam(golfer.id, team2Id);

    if (!team1Roster && !team2Roster) {
      throw new AuthorizationError('User is not a participant in this match');
    }
  }

  private async validateGolferInMatch(
    golferId: bigint,
    team1Id: bigint,
    team2Id: bigint,
  ): Promise<void> {
    const team1Roster = await this.rosterRepository.findByGolferAndTeam(golferId, team1Id);
    const team2Roster = await this.rosterRepository.findByGolferAndTeam(golferId, team2Id);

    if (!team1Roster && !team2Roster) {
      throw new ValidationError('Golfer is not a participant in this match');
    }
  }

  private async getGolferTeamId(
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

    const scoresByGolfer = new Map<bigint, LiveHoleScoreWithDetails[]>();
    for (const score of session.scores) {
      const existing = scoresByGolfer.get(score.golferid) ?? [];
      existing.push(score);
      scoresByGolfer.set(score.golferid, existing);
    }

    const formattedScores: LiveHoleScoreType[] = session.scores.map((score) =>
      this.formatHoleScore(score),
    );

    return {
      sessionId: session.id.toString(),
      matchId: session.matchid.toString(),
      status: STATUS_MAP[session.status] ?? 'active',
      currentHole: session.currenthole,
      holesPlayed: 18,
      startedAt: session.startedat.toISOString(),
      startedBy: session.startedbyuser?.username ?? session.startedby,
      viewerCount,
      scores: formattedScores,
    };
  }

  private formatHoleScore(score: LiveHoleScoreWithDetails, teamId?: bigint): LiveHoleScoreType {
    return {
      id: score.id.toString(),
      golferId: score.golferid.toString(),
      golferName: `${score.golfer.contact.firstname} ${score.golfer.contact.lastname}`,
      teamId: teamId?.toString(),
      holeNumber: score.holenumber,
      score: score.score,
      enteredBy: score.enteredbyuser?.username ?? score.enteredby,
      enteredAt: score.enteredat.toISOString(),
    };
  }
}
