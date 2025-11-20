import { PrismaClient } from '#prisma/client';
import {
  HofNominationSetupData,
  IHofNominationSetupRepository,
} from '../interfaces/IHofNominationSetupRepository.js';
import { dbHofNominationSetup } from '../types/dbTypes.js';

export class PrismaHofNominationSetupRepository implements IHofNominationSetupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(accountId: bigint): Promise<dbHofNominationSetup | null> {
    return this.prisma.hofnominationsetup.findUnique({
      where: {
        accountid: accountId,
      },
      select: {
        accountid: true,
        enablenomination: true,
        criteriatext: true,
      },
    });
  }

  async upsert(accountId: bigint, data: HofNominationSetupData): Promise<dbHofNominationSetup> {
    return this.prisma.hofnominationsetup.upsert({
      where: {
        accountid: accountId,
      },
      create: {
        accountid: accountId,
        enablenomination: data.enableNomination,
        criteriatext: data.criteriaText,
      },
      update: {
        enablenomination: data.enableNomination,
        criteriatext: data.criteriaText,
      },
      select: {
        accountid: true,
        enablenomination: true,
        criteriatext: true,
      },
    });
  }
}
