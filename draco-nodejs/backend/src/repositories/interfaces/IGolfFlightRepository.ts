import { divisionseason, divisiondefs, leagueseason, season } from '#prisma/client';

export type LeagueSeasonWithSeason = leagueseason & {
  season: season;
};

export type GolfFlightWithDetails = divisionseason & {
  divisiondefs: divisiondefs;
  leagueseason: LeagueSeasonWithSeason;
};

export type GolfFlightWithCounts = GolfFlightWithDetails & {
  _count: {
    teamsseason: number;
  };
  playerCount?: number;
};

export interface IGolfFlightRepository {
  findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]>;
  findById(flightId: bigint): Promise<GolfFlightWithDetails | null>;
  create(seasonId: bigint, divisionId: bigint, priority?: number): Promise<divisionseason>;
  update(flightId: bigint, data: Partial<divisionseason>): Promise<divisionseason>;
  delete(flightId: bigint): Promise<divisionseason>;
  findOrCreateDivision(accountId: bigint, name: string): Promise<divisiondefs>;
  getPlayerCountForFlight(flightId: bigint): Promise<number>;
  leagueSeasonExists(seasonId: bigint): Promise<boolean>;
}
