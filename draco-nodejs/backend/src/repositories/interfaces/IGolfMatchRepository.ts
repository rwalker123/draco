import {
  golfmatch,
  teamsseason,
  teams,
  golfcourse,
  golfteeinformation,
  golfmatchscores,
  golfscore,
} from '#prisma/client';
import { GolferWithContact } from './IGolfRosterRepository.js';

export type GolfMatchTeamInfo = teamsseason & {
  teams: teams;
};

export type GolfMatchCourseInfo = golfcourse;

export type GolfScoreWithGolfer = golfscore & {
  golfer: GolferWithContact;
};

export type GolfMatchScoreEntry = golfmatchscores & {
  golfscore: GolfScoreWithGolfer;
  golfer: GolferWithContact;
  teamsseason: teamsseason;
};

export type GolfMatchWithTeams = golfmatch & {
  teamsseason_golfmatch_team1Toteamsseason: GolfMatchTeamInfo;
  teamsseason_golfmatch_team2Toteamsseason: GolfMatchTeamInfo;
  golfcourse: GolfMatchCourseInfo | null;
  golfteeinformation: golfteeinformation | null;
};

export type GolfMatchWithScores = GolfMatchWithTeams & {
  golfmatchscores: GolfMatchScoreEntry[];
};

export type CreateGolfMatchData = {
  team1: bigint;
  team2: bigint;
  leagueid: bigint;
  matchdate: Date;
  courseid?: bigint | null;
  teeid?: bigint | null;
  matchstatus: number;
  matchtype: number;
  comment: string;
};

export type UpdateGolfMatchData = Partial<Omit<CreateGolfMatchData, 'leagueid'>>;

export interface IGolfMatchRepository {
  findBySeasonId(seasonId: bigint): Promise<GolfMatchWithTeams[]>;
  findBySeasonIdWithDateRange(
    seasonId: bigint,
    startDate?: Date,
    endDate?: Date,
  ): Promise<GolfMatchWithTeams[]>;
  findByFlightId(flightId: bigint): Promise<GolfMatchWithTeams[]>;
  findById(matchId: bigint): Promise<GolfMatchWithTeams | null>;
  findByIdWithScores(matchId: bigint): Promise<GolfMatchWithScores | null>;
  findUpcoming(seasonId: bigint, limit?: number): Promise<GolfMatchWithTeams[]>;
  findCompleted(seasonId: bigint, limit?: number): Promise<GolfMatchWithTeams[]>;
  findByTeam(teamSeasonId: bigint): Promise<GolfMatchWithTeams[]>;
  findByDate(seasonId: bigint, date: Date): Promise<GolfMatchWithTeams[]>;
  create(data: CreateGolfMatchData): Promise<golfmatch>;
  update(matchId: bigint, data: UpdateGolfMatchData): Promise<golfmatch>;
  delete(matchId: bigint): Promise<golfmatch>;
  updateStatus(matchId: bigint, status: number): Promise<golfmatch>;

  updateTee(matchId: bigint, teeId: bigint): Promise<void>;
  hasScores(matchId: bigint): Promise<boolean>;
  seasonHasLeagueSeasons(seasonId: bigint): Promise<boolean>;
  changeMatchSeason(
    matchId: bigint,
    newLeagueSeasonId: bigint,
    newTeam1Id: bigint,
    newTeam2Id: bigint,
  ): Promise<GolfMatchWithTeams>;
  updatePoints(
    matchId: bigint,
    data: {
      team1points: number;
      team2points: number;
      team1totalscore: number;
      team2totalscore: number;
      team1netscore: number;
      team2netscore: number;
      team1holewins: number;
      team2holewins: number;
      team1ninewins: number;
      team2ninewins: number;
      team1matchwins: number;
      team2matchwins: number;
    },
  ): Promise<golfmatch>;
}
