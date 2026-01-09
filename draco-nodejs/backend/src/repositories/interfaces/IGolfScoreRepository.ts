import { golfscore, golfmatchscores, golfcourse, golfteeinformation } from '#prisma/client';
import { GolferWithContact } from './IGolfRosterRepository.js';

export type GolfScoreWithDetails = golfscore & {
  golfer: GolferWithContact;
  golfcourse: golfcourse;
  golfteeinformation: golfteeinformation;
};

export type GolfMatchScoreWithDetails = golfmatchscores & {
  golfscore: GolfScoreWithDetails;
};

export type CreateGolfScoreData = {
  courseid: bigint;
  golferid: bigint;
  teeid: bigint;
  dateplayed: Date;
  holesplayed: number;
  totalscore: number;
  totalsonly: boolean;
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
  startindex?: number | null;
  startindex9?: number | null;
};

export type UpdateGolfScoreData = Partial<Omit<CreateGolfScoreData, 'golferid'>>;

export type CreateMatchScoreData = {
  matchid: bigint;
  teamid: bigint;
  golferid: bigint;
  scoreid: bigint;
  substitutefor?: bigint | null;
};

export type MatchScoreSubmission = {
  teamId: bigint;
  golferId: bigint;
  scoreData: CreateGolfScoreData;
};

export type SubmitMatchScoresResult = {
  createdScoreIds: bigint[];
};

export interface IGolfScoreRepository {
  findById(scoreId: bigint): Promise<GolfScoreWithDetails | null>;
  findByGolferId(golferId: bigint, limit?: number): Promise<GolfScoreWithDetails[]>;
  findByGolferIdBeforeDate(
    golferId: bigint,
    beforeDate: Date,
    limit?: number,
  ): Promise<GolfScoreWithDetails[]>;
  findByMatchId(matchId: bigint): Promise<GolfMatchScoreWithDetails[]>;
  findByMatchIds(matchIds: bigint[]): Promise<Map<bigint, GolfMatchScoreWithDetails[]>>;
  findByTeamAndMatch(matchId: bigint, teamId: bigint): Promise<GolfMatchScoreWithDetails[]>;
  create(data: CreateGolfScoreData): Promise<golfscore>;
  update(scoreId: bigint, data: UpdateGolfScoreData): Promise<golfscore>;
  delete(scoreId: bigint): Promise<golfscore>;
  createMatchScore(data: CreateMatchScoreData): Promise<golfmatchscores>;
  deleteMatchScores(matchId: bigint): Promise<number>;
  deleteMatchScoresForTeam(matchId: bigint, teamId: bigint): Promise<number>;
  getPlayerScoresForSeason(contactId: bigint, seasonId: bigint): Promise<GolfScoreWithDetails[]>;
  calculateDifferential(score: golfscore, teeInfo: golfteeinformation): number;
  submitMatchScoresTransactional(
    matchId: bigint,
    teamIds: bigint[],
    submissions: MatchScoreSubmission[],
  ): Promise<SubmitMatchScoresResult>;
}
