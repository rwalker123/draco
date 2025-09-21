import { leagueseason } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbLeagueSeason } from '../types/dbTypes.js';

export interface ILeagueRepository extends IBaseRepository<leagueseason> {
  findLeagueSeason(
    leagueId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeason | null>;
}
