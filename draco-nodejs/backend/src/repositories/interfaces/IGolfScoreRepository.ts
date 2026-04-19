import {
  golfscore,
  golfmatchscores,
  golfcourse,
  golfteeinformation,
  teamsseason,
} from '#prisma/client';
import { GolferWithContact } from './IGolfRosterRepository.js';

export type GolfScoreWithDetails = golfscore & {
  golfer: GolferWithContact;
  golfcourse: golfcourse;
  golfteeinformation: golfteeinformation;
};

export type GolfMatchScoreWithDetails = golfmatchscores & {
  golfscore: GolfScoreWithDetails;
  teamsseason: teamsseason;
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
  isabsent?: boolean;
  putts1?: number | null;
  putts2?: number | null;
  putts3?: number | null;
  putts4?: number | null;
  putts5?: number | null;
  putts6?: number | null;
  putts7?: number | null;
  putts8?: number | null;
  putts9?: number | null;
  putts10?: number | null;
  putts11?: number | null;
  putts12?: number | null;
  putts13?: number | null;
  putts14?: number | null;
  putts15?: number | null;
  putts16?: number | null;
  putts17?: number | null;
  putts18?: number | null;
  fairway1?: boolean | null;
  fairway2?: boolean | null;
  fairway3?: boolean | null;
  fairway4?: boolean | null;
  fairway5?: boolean | null;
  fairway6?: boolean | null;
  fairway7?: boolean | null;
  fairway8?: boolean | null;
  fairway9?: boolean | null;
  fairway10?: boolean | null;
  fairway11?: boolean | null;
  fairway12?: boolean | null;
  fairway13?: boolean | null;
  fairway14?: boolean | null;
  fairway15?: boolean | null;
  fairway16?: boolean | null;
  fairway17?: boolean | null;
  fairway18?: boolean | null;
  gir1?: boolean | null;
  gir2?: boolean | null;
  gir3?: boolean | null;
  gir4?: boolean | null;
  gir5?: boolean | null;
  gir6?: boolean | null;
  gir7?: boolean | null;
  gir8?: boolean | null;
  gir9?: boolean | null;
  gir10?: boolean | null;
  gir11?: boolean | null;
  gir12?: boolean | null;
  gir13?: boolean | null;
  gir14?: boolean | null;
  gir15?: boolean | null;
  gir16?: boolean | null;
  gir17?: boolean | null;
  gir18?: boolean | null;
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
  rosterGolferId: bigint;
  rosterEntryId: bigint;
  scoreData: CreateGolfScoreData;
  substituteForRosterId?: bigint;
};

export type SubmitMatchScoresResult = {
  createdScoreIds: bigint[];
};

export interface IGolfScoreRepository {
  findById(scoreId: bigint): Promise<GolfScoreWithDetails | null>;
  findByGolferId(golferId: bigint, limit?: number): Promise<GolfScoreWithDetails[]>;
  findAllByGolferId(golferId: bigint, limit?: number): Promise<GolfScoreWithDetails[]>;
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
  getPlayerLeagueScores(contactId: bigint, limit?: number): Promise<GolfScoreWithDetails[]>;
  calculateDifferential(score: golfscore, teeInfo: golfteeinformation): number;
  submitMatchScoresTransactional(
    matchId: bigint,
    teamIds: bigint[],
    submissions: MatchScoreSubmission[],
  ): Promise<SubmitMatchScoresResult>;
}
