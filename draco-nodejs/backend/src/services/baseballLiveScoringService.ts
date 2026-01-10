import {
  BaseballLiveScoringStateType,
  BaseballLiveInningScoreType,
  SubmitBaseballLiveInningScoreType,
  BaseballLiveSessionStatusType,
  BaseballScoreUpdateEventType,
} from '@draco/shared-schemas';
import {
  IBaseballLiveScoringRepository,
  BaseballLiveScoringSessionWithScores,
  BaseballLiveInningScoreWithDetails,
} from '../repositories/interfaces/IBaseballLiveScoringRepository.js';
import { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { getSSEManager } from './sseManager.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { LIVE_SESSION_STATUS, LIVE_SESSION_STATUS_MAP } from '../constants/liveSessionConstants.js';

// Game status constants (from game.ts schema)
const GAME_STATUS = {
  SCHEDULED: 0,
  FINAL: 1,
} as const;

export class BaseballLiveScoringService {
  private readonly baseballLiveScoringRepository: IBaseballLiveScoringRepository;
  private readonly scheduleRepository: IScheduleRepository;

  constructor(
    baseballLiveScoringRepository?: IBaseballLiveScoringRepository,
    scheduleRepository?: IScheduleRepository,
  ) {
    this.baseballLiveScoringRepository =
      baseballLiveScoringRepository ?? RepositoryFactory.getBaseballLiveScoringRepository();
    this.scheduleRepository = scheduleRepository ?? RepositoryFactory.getScheduleRepository();
  }

  async getSessionStatus(gameId: bigint): Promise<BaseballLiveSessionStatusType> {
    const session = await this.baseballLiveScoringRepository.findActiveByGame(gameId);
    if (!session) {
      return { hasActiveSession: false };
    }

    const viewerCount = getSSEManager().getGameViewerCount(gameId);
    return {
      hasActiveSession: true,
      sessionId: session.id.toString(),
      viewerCount,
    };
  }

  async getSessionState(gameId: bigint): Promise<BaseballLiveScoringStateType | null> {
    const session = await this.baseballLiveScoringRepository.findActiveByGame(gameId);
    if (!session) {
      return null;
    }

    return this.formatSessionState(session, gameId);
  }

  async startSession(gameId: bigint, userId: string): Promise<BaseballLiveScoringStateType> {
    const game = await this.scheduleRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError('Game not found');
    }

    if (game.gamestatus === GAME_STATUS.FINAL) {
      throw new ValidationError('Cannot start live scoring for a completed game');
    }

    const existingSession = await this.baseballLiveScoringRepository.findByGame(gameId);
    if (existingSession) {
      if (existingSession.status === LIVE_SESSION_STATUS.ACTIVE) {
        throw new ValidationError('A live scoring session is already active for this game');
      }
      await this.baseballLiveScoringRepository.deleteSession(existingSession.id);
    }

    const session = await this.baseballLiveScoringRepository.create({
      gameid: gameId,
      startedby: userId,
      currentinning: 1,
    });

    const fullSession = await this.baseballLiveScoringRepository.findById(session.id);
    if (!fullSession) {
      throw new Error('Failed to retrieve created session');
    }

    getSSEManager().broadcastToGame(gameId, 'session_started', {
      sessionId: session.id.toString(),
      gameId: gameId.toString(),
      startedBy: userId,
      startedAt: session.startedat.toISOString(),
    });

    return this.formatSessionState(fullSession, gameId);
  }

  async submitInningScore(
    gameId: bigint,
    userId: string,
    data: SubmitBaseballLiveInningScoreType,
  ): Promise<BaseballLiveInningScoreType> {
    const session = await this.baseballLiveScoringRepository.findActiveByGame(gameId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this game');
    }

    if (session.status !== LIVE_SESSION_STATUS.ACTIVE) {
      throw new ValidationError('Live scoring session is not active');
    }

    const inningScore = await this.baseballLiveScoringRepository.upsertInningScore({
      sessionid: session.id,
      inningnumber: data.inningNumber,
      ishometeam: data.isHomeTeam,
      runs: data.runs,
      enteredby: userId,
    });

    const scoreUpdateEvent: BaseballScoreUpdateEventType = {
      inningNumber: inningScore.inningnumber,
      isHomeTeam: inningScore.ishometeam,
      runs: inningScore.runs,
      enteredBy: inningScore.enteredbyuser?.username ?? inningScore.enteredby,
      timestamp: inningScore.enteredat.toISOString(),
    };

    getSSEManager().broadcastToGame(gameId, 'score_update', scoreUpdateEvent);

    return this.formatInningScore(inningScore);
  }

  async advanceInning(gameId: bigint, userId: string, inningNumber: number): Promise<void> {
    const session = await this.baseballLiveScoringRepository.findActiveByGame(gameId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this game');
    }

    if (inningNumber < 1 || inningNumber > 99) {
      throw new ValidationError('Inning number must be between 1 and 99');
    }

    await this.baseballLiveScoringRepository.updateCurrentInning(session.id, inningNumber);

    getSSEManager().broadcastToGame(gameId, 'inning_advanced', {
      inningNumber,
      advancedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async finalizeSession(gameId: bigint, userId: string): Promise<void> {
    const session = await this.baseballLiveScoringRepository.findActiveByGame(gameId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this game');
    }

    const game = await this.scheduleRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError('Game not found');
    }

    // Calculate totals from inning scores
    const { homeTeamTotal, visitorTeamTotal } = this.calculateTotals(session.scores);

    // Update game with final scores and mark as complete
    await this.scheduleRepository.updateGameResults(gameId, {
      hscore: homeTeamTotal,
      vscore: visitorTeamTotal,
      gamestatus: GAME_STATUS.FINAL,
    });

    // Mark live session as finalized
    await this.baseballLiveScoringRepository.updateStatus(
      session.id,
      LIVE_SESSION_STATUS.FINALIZED,
    );

    // Broadcast finalization event
    getSSEManager().broadcastToGame(gameId, 'session_finalized', {
      sessionId: session.id.toString(),
      gameId: gameId.toString(),
      finalizedBy: userId,
      finalizedAt: new Date().toISOString(),
      homeTeamTotal,
      visitorTeamTotal,
    });
  }

  async stopSession(gameId: bigint, userId: string): Promise<void> {
    const session = await this.baseballLiveScoringRepository.findActiveByGame(gameId);
    if (!session) {
      throw new NotFoundError('No active live scoring session for this game');
    }

    await this.baseballLiveScoringRepository.updateStatus(session.id, LIVE_SESSION_STATUS.STOPPED);

    getSSEManager().broadcastToGame(gameId, 'session_stopped', {
      sessionId: session.id.toString(),
      gameId: gameId.toString(),
      stoppedBy: userId,
      stoppedAt: new Date().toISOString(),
    });
  }

  async getActiveSessionsForAccount(
    accountId: bigint,
  ): Promise<{ gameId: string; sessionId: string }[]> {
    const sessions =
      await this.baseballLiveScoringRepository.findActiveSessionsForAccount(accountId);
    return sessions.map((s) => ({
      gameId: s.gameId.toString(),
      sessionId: s.sessionId.toString(),
    }));
  }

  private calculateTotals(scores: BaseballLiveInningScoreWithDetails[]): {
    homeTeamTotal: number;
    visitorTeamTotal: number;
  } {
    let homeTeamTotal = 0;
    let visitorTeamTotal = 0;

    for (const score of scores) {
      if (score.ishometeam) {
        homeTeamTotal += score.runs;
      } else {
        visitorTeamTotal += score.runs;
      }
    }

    return { homeTeamTotal, visitorTeamTotal };
  }

  private formatSessionState(
    session: BaseballLiveScoringSessionWithScores,
    gameId: bigint,
  ): BaseballLiveScoringStateType {
    const sseManager = getSSEManager();
    const viewerCount = sseManager.getGameViewerCount(gameId);
    const scorerCount = sseManager.getGameScorerCount(gameId);
    const { homeTeamTotal, visitorTeamTotal } = this.calculateTotals(session.scores);

    const formattedScores: BaseballLiveInningScoreType[] = session.scores.map((score) =>
      this.formatInningScore(score),
    );

    return {
      sessionId: session.id.toString(),
      gameId: session.gameid.toString(),
      status: LIVE_SESSION_STATUS_MAP[session.status] ?? 'active',
      currentInning: session.currentinning,
      startedAt: session.startedat.toISOString(),
      startedBy: session.startedbyuser?.username ?? session.startedby,
      viewerCount,
      scorerCount,
      scores: formattedScores,
      homeTeamTotal,
      visitorTeamTotal,
    };
  }

  private formatInningScore(
    score: BaseballLiveInningScoreWithDetails,
  ): BaseballLiveInningScoreType {
    return {
      id: score.id.toString(),
      inningNumber: score.inningnumber,
      isHomeTeam: score.ishometeam,
      runs: score.runs,
      enteredBy: score.enteredbyuser?.username ?? score.enteredby,
      enteredAt: score.enteredat.toISOString(),
    };
  }

  async cleanupStaleSessions(): Promise<number> {
    const count = await this.baseballLiveScoringRepository.markAllActiveSessionsAbandoned();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale baseball live scoring session(s)`);
    }
    return count;
  }
}
