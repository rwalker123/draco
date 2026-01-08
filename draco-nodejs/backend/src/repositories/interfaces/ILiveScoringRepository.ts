import { livescoringsession, liveholescore, golfer, aspnetusers } from '#prisma/client';

export type LiveScoringSessionWithScores = livescoringsession & {
  scores: (liveholescore & {
    golfer: golfer & {
      contact: { firstname: string; lastname: string };
    };
    enteredbyuser: aspnetusers;
  })[];
  startedbyuser: aspnetusers;
};

export type LiveHoleScoreWithDetails = liveholescore & {
  golfer: golfer & {
    contact: { firstname: string; lastname: string };
  };
  enteredbyuser: aspnetusers;
};

export type CreateLiveScoringSessionData = {
  matchid: bigint;
  startedby: string;
  currenthole?: number;
};

export type UpsertLiveHoleScoreData = {
  sessionid: bigint;
  golferid: bigint;
  holenumber: number;
  score: number;
  enteredby: string;
};

export interface ILiveScoringRepository {
  /**
   * Find an active live scoring session for a match.
   */
  findActiveByMatch(matchId: bigint): Promise<LiveScoringSessionWithScores | null>;

  /**
   * Find any session for a match (regardless of status).
   */
  findByMatch(matchId: bigint): Promise<LiveScoringSessionWithScores | null>;

  /**
   * Find a session by its ID.
   */
  findById(sessionId: bigint): Promise<LiveScoringSessionWithScores | null>;

  /**
   * Create a new live scoring session.
   */
  create(data: CreateLiveScoringSessionData): Promise<livescoringsession>;

  /**
   * Update session status (1=active, 2=paused, 3=finalized).
   */
  updateStatus(sessionId: bigint, status: number): Promise<livescoringsession>;

  /**
   * Update the current hole number.
   */
  updateCurrentHole(sessionId: bigint, holeNumber: number): Promise<livescoringsession>;

  /**
   * Update last activity timestamp.
   */
  updateLastActivity(sessionId: bigint): Promise<livescoringsession>;

  /**
   * Upsert a hole score (create or update if exists).
   * Uses the unique constraint on (sessionid, golferid, holenumber).
   */
  upsertHoleScore(data: UpsertLiveHoleScoreData): Promise<LiveHoleScoreWithDetails>;

  /**
   * Get all scores for a session.
   */
  getSessionScores(sessionId: bigint): Promise<LiveHoleScoreWithDetails[]>;

  /**
   * Get scores for a specific golfer in a session.
   */
  getGolferScores(sessionId: bigint, golferId: bigint): Promise<liveholescore[]>;

  /**
   * Delete a session and all its scores (cascade).
   */
  deleteSession(sessionId: bigint): Promise<livescoringsession>;

  /**
   * Find all matches with active live scoring sessions for an account.
   */
  findActiveSessionsForAccount(
    accountId: bigint,
  ): Promise<{ matchId: bigint; sessionId: bigint }[]>;

  /**
   * Mark all active sessions as abandoned (for server restart cleanup).
   * Returns the count of sessions marked as abandoned.
   */
  markAllActiveSessionsAbandoned(): Promise<number>;
}
