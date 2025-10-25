import {
  CreateHofMemberType,
  HofClassSummaryType,
  HofClassWithMembersType,
  HofEligibleContactsQueryType,
  HofEligibleContactsResponseType,
  HofMemberType,
  UpdateHofMemberType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IHallOfFameRepository } from '../repositories/interfaces/IHallOfFameRepository.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import HallOfFameResponseFormatter from '../responseFormatters/HallOfFameResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

const DEFAULT_ELIGIBLE_PAGE_SIZE = 20;
const MAX_ELIGIBLE_PAGE_SIZE = 50;

export class HallOfFameService {
  private readonly hallOfFameRepository: IHallOfFameRepository;
  private readonly contactRepository: IContactRepository;

  constructor() {
    this.hallOfFameRepository = RepositoryFactory.getHallOfFameRepository();
    this.contactRepository = RepositoryFactory.getContactRepository();
  }

  async listClasses(accountId: bigint): Promise<HofClassSummaryType[]> {
    const classes = await this.hallOfFameRepository.listClasses(accountId);
    return classes.map((entry) => HallOfFameResponseFormatter.formatClassSummary(entry));
  }

  async getClass(accountId: bigint, year: number): Promise<HofClassWithMembersType> {
    const members = await this.hallOfFameRepository.listMembersByYear(accountId, year);

    if (members.length === 0) {
      throw new NotFoundError('Hall of Fame class not found.');
    }

    const classSummary = {
      year,
      memberCount: members.length,
    };

    return HallOfFameResponseFormatter.formatClassWithMembers(accountId, classSummary, members);
  }

  async getRandomMember(accountId: bigint): Promise<HofMemberType> {
    const member = await this.hallOfFameRepository.getRandomMember(accountId);
    if (!member) {
      throw new NotFoundError('No Hall of Fame members found.');
    }

    return HallOfFameResponseFormatter.formatMember(accountId, member);
  }

  async createMember(accountId: bigint, payload: CreateHofMemberType): Promise<HofMemberType> {
    const contactId = BigInt(payload.contactId);

    const contact = await this.contactRepository.findContactInAccount(contactId, accountId);
    if (!contact) {
      throw new ValidationError('Contact not found for this account.');
    }

    const existing = await this.hallOfFameRepository.findMemberByContact(accountId, contactId);
    if (existing) {
      throw new ValidationError('Contact is already inducted into the Hall of Fame.');
    }

    const created = await this.hallOfFameRepository.createMember(accountId, {
      contactId,
      yearInducted: payload.yearInducted,
      biographyHtml: payload.biographyHtml?.trim() ?? '',
    });

    return HallOfFameResponseFormatter.formatMember(accountId, created);
  }

  async updateMember(
    accountId: bigint,
    memberId: bigint,
    payload: UpdateHofMemberType,
  ): Promise<HofMemberType> {
    const existing = await this.hallOfFameRepository.findMemberById(accountId, memberId);
    if (!existing) {
      throw new NotFoundError('Hall of Fame member not found.');
    }

    const updated = await this.hallOfFameRepository.updateMember(accountId, memberId, {
      yearInducted: payload.yearInducted,
      biographyHtml: payload.biographyHtml?.trim(),
    });

    if (!updated) {
      throw new NotFoundError('Hall of Fame member not found.');
    }

    return HallOfFameResponseFormatter.formatMember(accountId, updated);
  }

  async deleteMember(accountId: bigint, memberId: bigint): Promise<void> {
    const deleted = await this.hallOfFameRepository.deleteMember(accountId, memberId);
    if (!deleted) {
      throw new NotFoundError('Hall of Fame member not found.');
    }
  }

  async listEligibleContacts(
    accountId: bigint,
    query: HofEligibleContactsQueryType,
  ): Promise<HofEligibleContactsResponseType> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(
      MAX_ELIGIBLE_PAGE_SIZE,
      query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_ELIGIBLE_PAGE_SIZE,
    );
    const skip = (page - 1) * limit;

    const { contacts, total } = await this.hallOfFameRepository.findEligibleContacts(
      accountId,
      query.search?.trim(),
      skip,
      limit,
    );

    const hasNext = skip + contacts.length < total;
    const pagination = {
      page,
      limit,
      hasNext,
      hasPrev: page > 1,
    };

    return HallOfFameResponseFormatter.formatEligibleContacts(accountId, contacts, pagination);
  }
}

export default HallOfFameService;
