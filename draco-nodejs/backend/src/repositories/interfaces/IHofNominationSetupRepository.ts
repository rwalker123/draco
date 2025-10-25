import { dbHofNominationSetup } from '../types/dbTypes.js';

export interface HofNominationSetupData {
  enableNomination: boolean;
  criteriaText: string;
}

export interface IHofNominationSetupRepository {
  get(accountId: bigint): Promise<dbHofNominationSetup | null>;
  upsert(accountId: bigint, data: HofNominationSetupData): Promise<dbHofNominationSetup>;
}
