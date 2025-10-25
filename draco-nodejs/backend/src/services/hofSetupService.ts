import { HofNominationSetupType, UpdateHofNominationSetupType } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IHofNominationSetupRepository } from '../repositories/interfaces/IHofNominationSetupRepository.js';
import HallOfFameResponseFormatter from '../responseFormatters/HallOfFameResponseFormatter.js';

export class HofSetupService {
  private readonly setupRepository: IHofNominationSetupRepository;

  constructor() {
    this.setupRepository = RepositoryFactory.getHofNominationSetupRepository();
  }

  async getSetup(accountId: bigint): Promise<HofNominationSetupType> {
    const setup = await this.setupRepository.get(accountId);
    return HallOfFameResponseFormatter.formatNominationSetup(accountId, setup);
  }

  async updateSetup(
    accountId: bigint,
    payload: UpdateHofNominationSetupType,
  ): Promise<HofNominationSetupType> {
    const updated = await this.setupRepository.upsert(accountId, {
      enableNomination: payload.enableNomination,
      criteriaText: payload.criteriaText?.trim() ?? '',
    });

    return HallOfFameResponseFormatter.formatNominationSetup(accountId, updated);
  }
}

export default HofSetupService;
