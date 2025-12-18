import { schedulerfieldavailabilityrules } from '#prisma/client';

export interface ISchedulerFieldAvailabilityRulesRepository {
  findById(id: bigint): Promise<schedulerfieldavailabilityrules | null>;
  findForAccount(id: bigint, accountId: bigint): Promise<schedulerfieldavailabilityrules | null>;
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerfieldavailabilityrules[]>;
  create(data: Partial<schedulerfieldavailabilityrules>): Promise<schedulerfieldavailabilityrules>;
  update(
    id: bigint,
    data: Partial<schedulerfieldavailabilityrules>,
  ): Promise<schedulerfieldavailabilityrules>;
  delete(id: bigint): Promise<schedulerfieldavailabilityrules>;
}
