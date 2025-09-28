import { Prisma, leagueumpires } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbLeagueUmpireWithContact } from '../types/dbTypes.js';

export interface IUmpireRepository
  extends IBaseRepository<
    leagueumpires,
    Prisma.leagueumpiresCreateInput,
    Prisma.leagueumpiresUpdateInput
  > {
  findByAccount(
    accountId: bigint,
    options: {
      skip: number;
      take: number;
      orderBy: Prisma.leagueumpiresOrderByWithRelationInput;
    },
  ): Promise<dbLeagueUmpireWithContact[]>;
  countByAccount(accountId: bigint): Promise<number>;
}
