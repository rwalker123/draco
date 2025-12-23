import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { UmpireResponseFormatter } from '../responseFormatters/index.js';
import { PaginationHelper } from '../utils/pagination.js';
import { ConflictError, NotFoundError } from '../utils/customErrors.js';
import { CreateUmpireType, PagingType, UmpireType, UmpiresType } from '@draco/shared-schemas';

const UMPIRE_SORT_FIELDS = ['contacts.firstname', 'contacts.lastname', 'contacts.email', 'id'];

export class UmpireService {
  private readonly umpireRepository = RepositoryFactory.getUmpireRepository();
  private readonly contactRepository = RepositoryFactory.getContactRepository();
  private readonly scheduleRepository = RepositoryFactory.getScheduleRepository();

  async listUmpires(accountId: bigint, paging: PagingType): Promise<UmpiresType> {
    const sortBy = PaginationHelper.validateSortField(paging.sortBy, UMPIRE_SORT_FIELDS);

    const [umpires, total] = await Promise.all([
      this.umpireRepository.findByAccount(accountId, {
        skip: paging.skip,
        take: paging.limit,
        sortField: sortBy,
        sortOrder: paging.sortOrder,
      }),
      this.umpireRepository.countByAccount(accountId),
    ]);

    return UmpireResponseFormatter.formatPagedUmpires(umpires, paging.page, paging.limit, total);
  }

  async createUmpire(accountId: bigint, payload: CreateUmpireType): Promise<UmpireType> {
    const contactId = BigInt(payload.contactId);
    const contact = await this.contactRepository.findContactInAccount(contactId, accountId);

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    const existing = await this.umpireRepository.findByAccountAndContact(accountId, contactId);

    if (existing) {
      throw new ConflictError('Umpire already exists for this contact');
    }

    const created = await this.umpireRepository.create({
      accountid: accountId,
      contactid: contactId,
    });

    const createdWithContact = await this.umpireRepository.findByAccountAndId(
      accountId,
      created.id,
    );

    if (!createdWithContact) {
      throw new NotFoundError('Umpire not found after creation');
    }

    return UmpireResponseFormatter.formatUmpire(createdWithContact);
  }

  async deleteUmpire(accountId: bigint, umpireId: bigint): Promise<UmpireType> {
    const umpire = await this.umpireRepository.findByAccountAndId(accountId, umpireId);

    if (!umpire) {
      throw new NotFoundError('Umpire not found');
    }

    const assignedCount = await this.scheduleRepository.countUmpireAssignmentsForAccount(
      umpireId,
      accountId,
    );

    if (assignedCount > 0) {
      throw new ConflictError('Cannot delete umpire because they are assigned to scheduled games');
    }

    await this.umpireRepository.delete(umpireId);

    return UmpireResponseFormatter.formatUmpire(umpire);
  }
}
