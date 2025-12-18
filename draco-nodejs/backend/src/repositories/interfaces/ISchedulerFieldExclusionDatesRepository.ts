import { schedulerfieldexclusiondates } from '#prisma/client';

export interface ISchedulerFieldExclusionDatesRepository {
  findById(id: bigint): Promise<schedulerfieldexclusiondates | null>;
  findForAccount(id: bigint, accountId: bigint): Promise<schedulerfieldexclusiondates | null>;
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerfieldexclusiondates[]>;
  create(data: Partial<schedulerfieldexclusiondates>): Promise<schedulerfieldexclusiondates>;
  update(
    id: bigint,
    data: Partial<schedulerfieldexclusiondates>,
  ): Promise<schedulerfieldexclusiondates>;
  delete(id: bigint): Promise<schedulerfieldexclusiondates>;
}
