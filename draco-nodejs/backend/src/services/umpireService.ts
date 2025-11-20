import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { UmpireResponseFormatter } from '../responseFormatters/index.js';
import { PaginationHelper } from '../utils/pagination.js';
import { PagingType, UmpiresType } from '@draco/shared-schemas';
import { Prisma } from '#prisma/client';

const UMPIRE_SORT_FIELDS = ['contacts.firstname', 'contacts.lastname', 'contacts.email', 'id'];

export class UmpireService {
  private readonly umpireRepository = RepositoryFactory.getUmpireRepository();

  async listUmpires(accountId: bigint, paging: PagingType): Promise<UmpiresType> {
    const sortBy = PaginationHelper.validateSortField(paging.sortBy, UMPIRE_SORT_FIELDS);
    const orderBy = (
      sortBy
        ? PaginationHelper.getPrismaOrderBy(sortBy, paging.sortOrder)
        : { contacts: { lastname: 'asc' } }
    ) as Prisma.leagueumpiresOrderByWithRelationInput;

    const [umpires, total] = await Promise.all([
      this.umpireRepository.findByAccount(accountId, {
        skip: paging.skip,
        take: paging.limit,
        orderBy,
      }),
      this.umpireRepository.countByAccount(accountId),
    ]);

    return UmpireResponseFormatter.formatPagedUmpires(umpires, paging.page, paging.limit, total);
  }
}
