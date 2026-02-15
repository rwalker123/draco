import { league, leagueseason, season } from '#prisma/client';

export type GolfFlightWithDetails = leagueseason & {
  league: league;
  season: season;
};

export type GolfFlightWithCounts = GolfFlightWithDetails & {
  teamCount: number;
  playerCount: number;
};

export interface IGolfFlightRepository {
  findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]>;
  findById(flightId: bigint): Promise<GolfFlightWithDetails | null>;
  create(accountId: bigint, seasonId: bigint, name: string): Promise<GolfFlightWithDetails>;
  update(flightId: bigint, name: string): Promise<GolfFlightWithDetails>;
  delete(flightId: bigint): Promise<void>;
  getPlayerCountForFlight(flightId: bigint): Promise<number>;
  flightNameExistsInSeason(accountId: bigint, seasonId: bigint, name: string): Promise<boolean>;
  seasonHasFlights(seasonId: bigint): Promise<boolean>;
  findByLeagueAndSeason(leagueId: bigint, seasonId: bigint): Promise<{ id: bigint } | null>;
}
