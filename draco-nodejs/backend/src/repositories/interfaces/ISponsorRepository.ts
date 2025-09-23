import { sponsors } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbSponsor } from '../types/index.js';

export interface ISponsorRepository extends IBaseRepository<sponsors> {
  findByIdAndAccount(sponsorId: bigint, accountId: bigint): Promise<dbSponsor | null>;
  listAccountSponsors(accountId: bigint): Promise<dbSponsor[]>;
  listTeamSponsors(accountId: bigint, teamId: bigint): Promise<dbSponsor[]>;
}
