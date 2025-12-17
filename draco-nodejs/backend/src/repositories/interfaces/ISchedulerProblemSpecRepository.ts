import type {
  availablefields,
  accounts,
  leagueumpires,
  leagueschedule,
  teamsseason,
} from '#prisma/client';

export interface ISchedulerProblemSpecRepository {
  findAccount(accountId: bigint): Promise<accounts | null>;
  listSeasonTeams(seasonId: bigint): Promise<teamsseason[]>;
  listAccountFields(accountId: bigint): Promise<availablefields[]>;
  listAccountUmpires(accountId: bigint): Promise<leagueumpires[]>;
  listSeasonGames(seasonId: bigint): Promise<leagueschedule[]>;
}
