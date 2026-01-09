import { baseballlivescoringsession, baseballliveinningscore, aspnetusers } from '#prisma/client';

export type BaseballLiveScoringSessionWithScores = baseballlivescoringsession & {
  scores: (baseballliveinningscore & {
    enteredbyuser: aspnetusers;
  })[];
  startedbyuser: aspnetusers;
};

export type BaseballLiveInningScoreWithDetails = baseballliveinningscore & {
  enteredbyuser: aspnetusers;
};

export type CreateBaseballLiveScoringSessionData = {
  gameid: bigint;
  startedby: string;
  currentinning?: number;
};

export type UpsertBaseballLiveInningScoreData = {
  sessionid: bigint;
  inningnumber: number;
  ishometeam: boolean;
  runs: number;
  enteredby: string;
};

export interface IBaseballLiveScoringRepository {
  /**
   * Find an active live scoring session for a game.
   */
  findActiveByGame(gameId: bigint): Promise<BaseballLiveScoringSessionWithScores | null>;

  /**
   * Find any session for a game (regardless of status).
   */
  findByGame(gameId: bigint): Promise<BaseballLiveScoringSessionWithScores | null>;

  /**
   * Find a session by its ID.
   */
  findById(sessionId: bigint): Promise<BaseballLiveScoringSessionWithScores | null>;

  /**
   * Create a new live scoring session.
   */
  create(data: CreateBaseballLiveScoringSessionData): Promise<baseballlivescoringsession>;

  /**
   * Update session status (1=active, 2=paused, 3=finalized, 4=stopped, 5=abandoned).
   */
  updateStatus(sessionId: bigint, status: number): Promise<baseballlivescoringsession>;

  /**
   * Update the current inning number.
   */
  updateCurrentInning(sessionId: bigint, inningNumber: number): Promise<baseballlivescoringsession>;

  /**
   * Update last activity timestamp.
   */
  updateLastActivity(sessionId: bigint): Promise<baseballlivescoringsession>;

  /**
   * Upsert an inning score (create or update if exists).
   * Uses the unique constraint on (sessionid, inningnumber, ishometeam).
   */
  upsertInningScore(
    data: UpsertBaseballLiveInningScoreData,
  ): Promise<BaseballLiveInningScoreWithDetails>;

  /**
   * Get all scores for a session.
   */
  getSessionScores(sessionId: bigint): Promise<BaseballLiveInningScoreWithDetails[]>;

  /**
   * Delete a session and all its scores (cascade).
   */
  deleteSession(sessionId: bigint): Promise<baseballlivescoringsession>;

  /**
   * Find all games with active live scoring sessions for an account.
   */
  findActiveSessionsForAccount(accountId: bigint): Promise<{ gameId: bigint; sessionId: bigint }[]>;

  /**
   * Mark all active sessions as abandoned (for server restart cleanup).
   * Returns the count of sessions marked as abandoned.
   */
  markAllActiveSessionsAbandoned(): Promise<number>;
}
