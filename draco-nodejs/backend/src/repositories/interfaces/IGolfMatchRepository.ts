import {
  golfmatch,
  teamsseason,
  teams,
  golfcourse,
  golfteeinformation,
  golfmatchscores,
  golfscore,
  golfroster,
  contacts,
} from '#prisma/client';

export type GolfMatchTeamInfo = teamsseason & {
  teams: teams;
};

export type GolfMatchCourseInfo = golfcourse & {
  golfteeinformation: golfteeinformation[];
};

export type GolfMatchScoreEntry = golfmatchscores & {
  golfscore: golfscore;
  golfroster: golfroster & {
    contacts: contacts;
  };
  teamsseason: teamsseason;
};

export type GolfMatchWithTeams = golfmatch & {
  teamsseason_golfmatch_team1Toteamsseason: GolfMatchTeamInfo;
  teamsseason_golfmatch_team2Toteamsseason: GolfMatchTeamInfo;
  golfcourse: GolfMatchCourseInfo | null;
};

export type GolfMatchWithScores = GolfMatchWithTeams & {
  golfmatchscores: GolfMatchScoreEntry[];
};

export type CreateGolfMatchData = {
  team1: bigint;
  team2: bigint;
  leagueid: bigint;
  matchdate: Date;
  matchtime: Date;
  courseid?: bigint | null;
  matchstatus: number;
  matchtype: number;
  comment: string;
};

export type UpdateGolfMatchData = Partial<Omit<CreateGolfMatchData, 'leagueid'>>;

export interface IGolfMatchRepository {
  findBySeasonId(seasonId: bigint): Promise<GolfMatchWithTeams[]>;
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
  hasScores(matchId: bigint): Promise<boolean>;
}
