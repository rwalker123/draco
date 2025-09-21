import { season } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface ISeasonRepository extends IBaseRepository<season> {
  findCurrentSeason(accountId: bigint): Promise<season | null>;
}
