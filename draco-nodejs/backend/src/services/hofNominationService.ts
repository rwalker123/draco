import {
  HofMemberType,
  HofNominationInductType,
  HofNominationListType,
  HofNominationQueryType,
  HofNominationType,
  SubmitHofNominationType,
  UpdateHofNominationType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IHofNominationRepository } from '../repositories/interfaces/IHofNominationRepository.js';
import { IHofNominationSetupRepository } from '../repositories/interfaces/IHofNominationSetupRepository.js';
import HallOfFameResponseFormatter from '../responseFormatters/HallOfFameResponseFormatter.js';
import { ConflictError, NotFoundError } from '../utils/customErrors.js';
import { ServiceFactory } from './serviceFactory.js';
import { HallOfFameService } from './hallOfFameService.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export class HofNominationService {
  private readonly nominationRepository: IHofNominationRepository;
  private readonly setupRepository: IHofNominationSetupRepository;
  private readonly hallOfFameService: HallOfFameService;

  constructor() {
    this.nominationRepository = RepositoryFactory.getHofNominationRepository();
    this.setupRepository = RepositoryFactory.getHofNominationSetupRepository();
    this.hallOfFameService = ServiceFactory.getHallOfFameService();
  }

  async submitNomination(accountId: bigint, payload: SubmitHofNominationType): Promise<void> {
    const setup = await this.setupRepository.get(accountId);
    if (!setup || !setup.enablenomination) {
      throw new ConflictError('Hall of Fame nominations are not currently enabled.');
    }

    await this.nominationRepository.create(accountId, {
      nominator: payload.nominator.trim(),
      phoneNumber: payload.phoneNumber?.trim() ?? '',
      email: payload.email.trim(),
      nominee: payload.nominee.trim(),
      reason: payload.reason.trim(),
    });
  }

  async listNominations(
    accountId: bigint,
    query: HofNominationQueryType,
  ): Promise<HofNominationListType> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(
      MAX_PAGE_SIZE,
      query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE,
    );
    const skip = (page - 1) * limit;

    const result = await this.nominationRepository.list(accountId, skip, limit);
    const hasNext = skip + result.nominations.length < result.total;

    return HallOfFameResponseFormatter.formatNominationList(result.nominations, {
      page,
      limit,
      hasNext,
      hasPrev: page > 1,
      total: result.total,
    });
  }

  async deleteNomination(accountId: bigint, nominationId: bigint): Promise<void> {
    const deleted = await this.nominationRepository.delete(accountId, nominationId);
    if (!deleted) {
      throw new NotFoundError('Hall of Fame nomination not found.');
    }
  }

  async updateNomination(
    accountId: bigint,
    nominationId: bigint,
    payload: UpdateHofNominationType,
  ): Promise<HofNominationType> {
    const updated = await this.nominationRepository.update(accountId, nominationId, {
      nominator: payload.nominator.trim(),
      phoneNumber: (payload.phoneNumber ?? '').trim(),
      email: payload.email.trim(),
      nominee: payload.nominee.trim(),
      reason: payload.reason.trim(),
    });

    if (!updated) {
      throw new NotFoundError('Hall of Fame nomination not found.');
    }

    return HallOfFameResponseFormatter.formatNomination(updated);
  }

  async inductNomination(
    accountId: bigint,
    nominationId: bigint,
    payload: HofNominationInductType,
  ): Promise<HofMemberType> {
    const nomination = await this.nominationRepository.findById(accountId, nominationId);

    if (!nomination) {
      throw new NotFoundError('Hall of Fame nomination not found.');
    }

    const biographyHtml = payload.biographyHtml?.trim() || nomination.reason?.trim() || '';

    const member = await this.hallOfFameService.createMember(accountId, {
      contactId: payload.contactId,
      yearInducted: payload.yearInducted,
      biographyHtml,
    });

    // Best effort removal of the processed nomination
    try {
      await this.nominationRepository.delete(accountId, nominationId);
    } catch (_error) {
      // Intentionally ignore failures when cleaning up the processed nomination.
    }

    return member;
  }
}

export default HofNominationService;
