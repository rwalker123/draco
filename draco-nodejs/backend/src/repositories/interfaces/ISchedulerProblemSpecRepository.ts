import type { availablefields, accounts, leagueschedule, teamsseason } from '#prisma/client';
import type { dbLeagueUmpireWithContact } from '../types/dbTypes.js';

export interface ISchedulerProblemSpecRepository {
  findAccount(accountId: bigint): Promise<accounts | null>;
  listSeasonTeams(seasonId: bigint): Promise<teamsseason[]>;
  listAccountFields(accountId: bigint): Promise<availablefields[]>;
  listAccountUmpires(accountId: bigint): Promise<dbLeagueUmpireWithContact[]>;
  listSeasonGames(seasonId: bigint): Promise<leagueschedule[]>;
}
