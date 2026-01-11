import { CreateGolfScoreType } from '@draco/shared-schemas';
import {
  IIndividualLiveScoringRepository,
  IndividualLiveScoringSessionWithScores,
  IndividualLiveHoleScoreWithDetails,
} from '../repositories/interfaces/IIndividualLiveScoringRepository.js';
import { IAccountRepository } from '../repositories/interfaces/IAccountRepository.js';
import { IGolferRepository } from '../repositories/interfaces/IGolferRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { IGolfTeeRepository } from '../repositories/interfaces/IGolfTeeRepository.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { getSSEManager } from './sseManager.js';
import { ServiceFactory } from './serviceFactory.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/customErrors.js';
import { LIVE_SESSION_STATUS, LIVE_SESSION_STATUS_MAP } from '../constants/liveSessionConstants.js';

export interface IndividualLiveSessionStatusType {
  hasActiveSession: boolean;
  sessionId?: string;
  viewerCount?: number;
}

export interface IndividualLiveHoleScoreType {
  id: string;
  holeNumber: number;
  score: number;
  enteredBy: string;
  enteredAt: string;
}

export interface IndividualLiveScoringStateType {
  sessionId: string;
  accountId: string;
  status: 'active' | 'paused' | 'finalized' | 'stopped';
  currentHole: number;
  holesPlayed: number;
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  datePlayed: string;
  startedAt: string;
  startedBy: string;
  viewerCount?: number;
  scores: IndividualLiveHoleScoreType[];
}

export interface StartIndividualLiveScoringData {
  courseId: string;
  teeId: string;
  datePlayed: string;
  startingHole?: number;
  holesPlayed?: number;
}

export interface SubmitIndividualLiveHoleScoreData {
  holeNumber: number;
  score: number;
}

export interface IndividualScoreUpdateEventType {
  holeNumber: number;
  score: number;
  enteredBy: string;
  timestamp: string;
}

export class IndividualLiveScoringService {
  private readonly individualLiveScoringRepository: IIndividualLiveScoringRepository;
  private readonly accountRepository: IAccountRepository;
  private readonly golferRepository: IGolferRepository;
  private readonly golfCourseRepository: IGolfCourseRepository;
  private readonly golfTeeRepository: IGolfTeeRepository;
  private readonly contactRepository: IContactRepository;

  constructor(
    individualLiveScoringRepository?: IIndividualLiveScoringRepository,
    accountRepository?: IAccountRepository,
    golferRepository?: IGolferRepository,
    golfCourseRepository?: IGolfCourseRepository,
    golfTeeRepository?: IGolfTeeRepository,
    contactRepository?: IContactRepository,
  ) {
    this.individualLiveScoringRepository =
      individualLiveScoringRepository ?? RepositoryFactory.getIndividualLiveScoringRepository();
    this.accountRepository = accountRepository ?? RepositoryFactory.getAccountRepository();
    this.golferRepository = golferRepository ?? RepositoryFactory.getGolferRepository();
    this.golfCourseRepository = golfCourseRepository ?? RepositoryFactory.getGolfCourseRepository();
    this.golfTeeRepository = golfTeeRepository ?? RepositoryFactory.getGolfTeeRepository();
    this.contactRepository = contactRepository ?? RepositoryFactory.getContactRepository();
  }

  async getSessionStatus(accountId: bigint): Promise<IndividualLiveSessionStatusType> {
    const session = await this.individualLiveScoringRepository.findActiveByAccount(accountId);
    if (!session) {
      return { hasActiveSession: false };
    }

    const viewerCount = getSSEManager().getAccountViewerCount(accountId);
    return {
      hasActiveSession: true,
      sessionId: session.id.toString(),
      viewerCount,
    };
  }

  async getSessionState(accountId: bigint): Promise<IndividualLiveScoringStateType | null> {
    const session = await this.individualLiveScoringRepository.findActiveByAccount(accountId);
    if (!session) {
      return null;
    }

    return this.formatSessionState(session, accountId);
  }

  async startSession(
    accountId: bigint,
    userId: string,
    data: StartIndividualLiveScoringData,
  ): Promise<IndividualLiveScoringStateType> {
    await this.validateUserIsAccountOwner(userId, accountId);

    const existingSession = await this.individualLiveScoringRepository.findByAccount(accountId);
    if (existingSession) {
      if (existingSession.status === LIVE_SESSION_STATUS.ACTIVE) {
        throw new ValidationError('A live scoring session is already active for this account');
      }
      await this.individualLiveScoringRepository.deleteSession(existingSession.id);
    }

    const courseId = BigInt(data.courseId);
    const teeId = BigInt(data.teeId);

    const course = await this.golfCourseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const tee = await this.golfTeeRepository.findById(teeId);
    if (!tee || tee.courseid !== courseId) {
      throw new NotFoundError('Tee not found for this course');
    }

    const golfer = await this.getOrCreateGolferForAccount(accountId);

    const session = await this.individualLiveScoringRepository.create({
      accountid: accountId,
      golferid: golfer.id,
      courseid: courseId,
      teeid: teeId,
      startedby: userId,
      currenthole: data.startingHole ?? 1,
      holesplayed: data.holesPlayed ?? 18,
      dateplayed: new Date(data.datePlayed),
    });

    const fullSession = await this.individualLiveScoringRepository.findById(session.id);
    if (!fullSession) {
      throw new Error('Failed to retrieve created session');
    }

    getSSEManager().broadcastToAccount(accountId, 'session_started', {
      sessionId: session.id.toString(),
      accountId: accountId.toString(),
      startedBy: userId,
      startedAt: session.startedat.toISOString(),
    });

    return this.formatSessionState(fullSession, accountId);
  }

  async submitScore(
    accountId: bigint,
    userId: string,
    data: SubmitIndividualLiveHoleScoreData,
  ): Promise<IndividualLiveHoleScoreType> {
    const session = await this.individualLiveScoringRepository.findActiveByAccount(accountId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this account');
    }

    if (session.status !== LIVE_SESSION_STATUS.ACTIVE) {
      throw new ValidationError('Live scoring session is not active');
    }

    await this.validateUserIsAccountOwner(userId, accountId);

    if (data.holeNumber < 1 || data.holeNumber > session.holesplayed) {
      throw new ValidationError(`Hole number must be between 1 and ${session.holesplayed}`);
    }

    if (data.score < 1 || data.score > 20) {
      throw new ValidationError('Score must be between 1 and 20');
    }

    const holeScore = await this.individualLiveScoringRepository.upsertHoleScore({
      sessionid: session.id,
      holenumber: data.holeNumber,
      score: data.score,
      enteredby: userId,
    });

    const scoreUpdateEvent: IndividualScoreUpdateEventType = {
      holeNumber: holeScore.holenumber,
      score: holeScore.score,
      enteredBy: holeScore.enteredbyuser?.username ?? holeScore.enteredby,
      timestamp: holeScore.enteredat.toISOString(),
    };

    getSSEManager().broadcastToAccount(accountId, 'score_update', scoreUpdateEvent);

    return this.formatHoleScore(holeScore);
  }

  async advanceHole(accountId: bigint, userId: string, holeNumber: number): Promise<void> {
    const session = await this.individualLiveScoringRepository.findActiveByAccount(accountId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this account');
    }

    await this.validateUserIsAccountOwner(userId, accountId);

    if (holeNumber < 1 || holeNumber > session.holesplayed) {
      throw new ValidationError(`Hole number must be between 1 and ${session.holesplayed}`);
    }

    await this.individualLiveScoringRepository.updateCurrentHole(session.id, holeNumber);

    getSSEManager().broadcastToAccount(accountId, 'hole_advanced', {
      holeNumber,
      advancedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async finalizeSession(accountId: bigint, userId: string): Promise<void> {
    const session = await this.individualLiveScoringRepository.findActiveByAccount(accountId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this account');
    }

    await this.validateUserIsAccountOwner(userId, accountId);

    const scorePayload = this.buildGolfScorePayload(session);

    const golferService = ServiceFactory.getGolferService();
    await golferService.createScoreForAccount(accountId, scorePayload);

    await this.individualLiveScoringRepository.updateStatus(
      session.id,
      LIVE_SESSION_STATUS.FINALIZED,
    );

    getSSEManager().broadcastToAccount(accountId, 'session_finalized', {
      sessionId: session.id.toString(),
      accountId: accountId.toString(),
      finalizedBy: userId,
      finalizedAt: new Date().toISOString(),
    });
  }

  private buildGolfScorePayload(
    session: IndividualLiveScoringSessionWithScores,
  ): CreateGolfScoreType {
    const holeScores: number[] = Array(session.holesplayed).fill(0);
    for (const score of session.scores) {
      if (score.holenumber >= 1 && score.holenumber <= session.holesplayed) {
        holeScores[score.holenumber - 1] = score.score;
      }
    }

    return {
      courseId: session.courseid.toString(),
      teeId: session.teeid.toString(),
      datePlayed: session.dateplayed.toISOString().split('T')[0],
      holesPlayed: session.holesplayed,
      totalsOnly: false,
      holeScores,
    };
  }

  async stopSession(accountId: bigint, userId: string): Promise<void> {
    const session = await this.individualLiveScoringRepository.findActiveByAccount(accountId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this account');
    }

    await this.validateUserIsAccountOwner(userId, accountId);

    await this.individualLiveScoringRepository.updateStatus(
      session.id,
      LIVE_SESSION_STATUS.STOPPED,
    );

    getSSEManager().broadcastToAccount(accountId, 'session_stopped', {
      sessionId: session.id.toString(),
      accountId: accountId.toString(),
      stoppedBy: userId,
      stoppedAt: new Date().toISOString(),
    });
  }

  private async validateUserIsAccountOwner(userId: string, accountId: bigint): Promise<void> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    if (account.owneruserid !== userId) {
      throw new AuthorizationError('Only the account owner can perform this action');
    }
  }

  private async getOrCreateGolferForAccount(accountId: bigint): Promise<{ id: bigint }> {
    const contact = await this.contactRepository.findAccountOwner(accountId);
    if (!contact) {
      throw new NotFoundError('Owner contact not found for account');
    }

    let golfer = await this.golferRepository.findByContactId(contact.id);
    if (!golfer) {
      golfer = await this.golferRepository.create(contact.id);
    }

    return golfer;
  }

  private formatSessionState(
    session: IndividualLiveScoringSessionWithScores,
    accountId: bigint,
  ): IndividualLiveScoringStateType {
    const viewerCount = getSSEManager().getAccountViewerCount(accountId);

    const formattedScores: IndividualLiveHoleScoreType[] = session.scores.map((score) =>
      this.formatHoleScore(score),
    );

    return {
      sessionId: session.id.toString(),
      accountId: session.accountid.toString(),
      status: LIVE_SESSION_STATUS_MAP[session.status] ?? 'active',
      currentHole: session.currenthole,
      holesPlayed: session.holesplayed,
      courseId: session.courseid.toString(),
      courseName: session.golfcourse.name,
      teeId: session.teeid.toString(),
      teeName: session.golfteeinformation.teename,
      datePlayed: session.dateplayed.toISOString().split('T')[0],
      startedAt: session.startedat.toISOString(),
      startedBy: session.startedbyuser?.username ?? session.startedby,
      viewerCount,
      scores: formattedScores,
    };
  }

  private formatHoleScore(score: IndividualLiveHoleScoreWithDetails): IndividualLiveHoleScoreType {
    return {
      id: score.id.toString(),
      holeNumber: score.holenumber,
      score: score.score,
      enteredBy: score.enteredbyuser?.username ?? score.enteredby,
      enteredAt: score.enteredat.toISOString(),
    };
  }

  async cleanupStaleSessions(): Promise<number> {
    const count = await this.individualLiveScoringRepository.markAllActiveSessionsAbandoned();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale individual live scoring session(s)`);
    }
    return count;
  }

  async cleanupStaleSessionsByAge(staleThresholdMs: number): Promise<number> {
    const count =
      await this.individualLiveScoringRepository.markStaleActiveSessionsAbandoned(staleThresholdMs);
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale individual live scoring session(s) by age`);
    }
    return count;
  }
}
