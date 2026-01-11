import {
  individuallivescoringsession,
  individualliveholescore,
  golfer,
  aspnetusers,
  golfcourse,
  golfteeinformation,
  contacts,
} from '#prisma/client';

export type IndividualLiveScoringSessionWithScores = individuallivescoringsession & {
  scores: (individualliveholescore & {
    enteredbyuser: aspnetusers;
  })[];
  startedbyuser: aspnetusers;
  golfer: golfer & {
    contact: Pick<contacts, 'firstname' | 'lastname'>;
  };
  golfcourse: golfcourse;
  golfteeinformation: golfteeinformation;
};

export type IndividualLiveHoleScoreWithDetails = individualliveholescore & {
  enteredbyuser: aspnetusers;
};

export type CreateIndividualLiveScoringSessionData = {
  accountid: bigint;
  golferid: bigint;
  courseid: bigint;
  teeid: bigint;
  startedby: string;
  currenthole?: number;
  holesplayed?: number;
  dateplayed: Date;
};

export type UpsertIndividualLiveHoleScoreData = {
  sessionid: bigint;
  holenumber: number;
  score: number;
  enteredby: string;
};

export interface IIndividualLiveScoringRepository {
  findActiveByAccount(accountId: bigint): Promise<IndividualLiveScoringSessionWithScores | null>;

  findByAccount(accountId: bigint): Promise<IndividualLiveScoringSessionWithScores | null>;

  findById(sessionId: bigint): Promise<IndividualLiveScoringSessionWithScores | null>;

  create(data: CreateIndividualLiveScoringSessionData): Promise<individuallivescoringsession>;

  updateStatus(sessionId: bigint, status: number): Promise<individuallivescoringsession>;

  updateCurrentHole(sessionId: bigint, holeNumber: number): Promise<individuallivescoringsession>;

  updateLastActivity(sessionId: bigint): Promise<individuallivescoringsession>;

  upsertHoleScore(
    data: UpsertIndividualLiveHoleScoreData,
  ): Promise<IndividualLiveHoleScoreWithDetails>;

  getSessionScores(sessionId: bigint): Promise<IndividualLiveHoleScoreWithDetails[]>;

  deleteSession(sessionId: bigint): Promise<individuallivescoringsession>;

  markAllActiveSessionsAbandoned(): Promise<number>;

  markStaleActiveSessionsAbandoned(staleThresholdMs: number): Promise<number>;
}
