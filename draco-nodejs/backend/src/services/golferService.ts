import { GolferType } from '@draco/shared-schemas';
import { IGolferRepository } from '../repositories/interfaces/IGolferRepository.js';
import { IAccountRepository } from '../repositories/interfaces/IAccountRepository.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { GolferResponseFormatter } from '../responseFormatters/golferResponseFormatter.js';
import { NotFoundError, AuthorizationError } from '../utils/customErrors.js';

export class GolferService {
  private readonly golferRepository: IGolferRepository;
  private readonly accountRepository: IAccountRepository;
  private readonly contactRepository: IContactRepository;
  private readonly golfCourseRepository: IGolfCourseRepository;

  constructor(
    golferRepository?: IGolferRepository,
    accountRepository?: IAccountRepository,
    contactRepository?: IContactRepository,
  ) {
    this.golferRepository = golferRepository ?? RepositoryFactory.getGolferRepository();
    this.golfCourseRepository = RepositoryFactory.getGolfCourseRepository();
    this.accountRepository = accountRepository ?? RepositoryFactory.getAccountRepository();
    this.contactRepository = contactRepository ?? RepositoryFactory.getContactRepository();
  }

  async getGolferByContactId(contactId: bigint): Promise<GolferType | null> {
    const golfer = await this.golferRepository.findByContactId(contactId);
    return golfer ? GolferResponseFormatter.format(golfer) : null;
  }

  async getGolferForAccount(accountId: bigint): Promise<GolferType> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new NotFoundError('Account does not have an owner contact');
    }

    const golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      throw new NotFoundError('Golfer profile not found for this account');
    }

    return GolferResponseFormatter.format(golfer);
  }

  async updateHomeCourse(golferId: bigint, homeCourseId: bigint | null): Promise<GolferType> {
    const golfer = await this.golferRepository.findById(golferId);
    if (!golfer) {
      throw new NotFoundError('Golfer not found');
    }

    if (homeCourseId !== null) {
      const courseExists = await this.golfCourseRepository.findById(homeCourseId);
      if (!courseExists) {
        throw new NotFoundError('Golf course not found');
      }
    }

    const updated = await this.golferRepository.updateHomeCourse(golferId, homeCourseId);
    return GolferResponseFormatter.format(updated);
  }

  async updateHomeCourseForAccount(
    accountId: bigint,
    homeCourseId: bigint | null,
  ): Promise<GolferType> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new AuthorizationError('Owner contact for the specified account was not found');
    }

    if (homeCourseId !== null) {
      const courseExists = await this.golfCourseRepository.findById(homeCourseId);
      if (!courseExists) {
        throw new NotFoundError('Golf course not found');
      }
    }

    let golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      golfer = await this.golferRepository.create(ownerContact.id, homeCourseId ?? undefined);
      return GolferResponseFormatter.format(golfer);
    }

    const updated = await this.golferRepository.updateHomeCourse(golfer.id, homeCourseId);
    return GolferResponseFormatter.format(updated);
  }

  async createGolfer(contactId: bigint, homeCourseId?: bigint): Promise<GolferType> {
    const existing = await this.golferRepository.findByContactId(contactId);
    if (existing) {
      return GolferResponseFormatter.format(existing);
    }

    const golfer = await this.golferRepository.create(contactId, homeCourseId);
    return GolferResponseFormatter.format(golfer);
  }

  private async findOwnerContact(
    accountId: bigint,
    ownerUserId: string | null,
  ): Promise<{ id: bigint } | null> {
    if (!ownerUserId) {
      return null;
    }

    const contacts = await this.contactRepository.findContactsByUserIds([ownerUserId]);
    const ownerContact = contacts.find(
      (contact) => contact.userid === ownerUserId && contact.creatoraccountid === accountId,
    );

    return ownerContact ? { id: ownerContact.id } : null;
  }
}
