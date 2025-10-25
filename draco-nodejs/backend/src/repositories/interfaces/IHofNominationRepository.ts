import { dbHofNomination } from '../types/dbTypes.js';

export interface CreateHofNominationData {
  nominator: string;
  phoneNumber: string;
  email: string;
  nominee: string;
  reason: string;
}

export interface HofNominationListResult {
  nominations: dbHofNomination[];
  total: number;
}

export interface IHofNominationRepository {
  create(accountId: bigint, data: CreateHofNominationData): Promise<dbHofNomination>;
  list(accountId: bigint, skip: number, take: number): Promise<HofNominationListResult>;
  delete(accountId: bigint, nominationId: bigint): Promise<boolean>;
}
