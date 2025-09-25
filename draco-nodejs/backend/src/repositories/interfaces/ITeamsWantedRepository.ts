import { Prisma, teamswantedclassified } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbClassifiedPageResponse,
  dbClassifiedSearchParams,
  dbContactInfo,
  dbTeamsWanted,
  dbTeamsWantedPublic,
} from '../types/dbTypes.js';

export interface ITeamsWantedRepository extends IBaseRepository<teamswantedclassified> {
  createTeamsWantedRecord(
    dbData: Prisma.teamswantedclassifiedUncheckedCreateInput,
  ): Promise<dbTeamsWanted>;
  getTeamsWanted(
    accountId: bigint,
    params: dbClassifiedSearchParams,
  ): Promise<dbClassifiedPageResponse<dbTeamsWantedPublic>>;
  getTeamsWantedContactInfo(classifiedId: bigint, accountId: bigint): Promise<dbContactInfo | null>;
  findTeamsWantedById(classifiedId: bigint, accountId: bigint): Promise<dbTeamsWanted | null>;
  updateTeamsWanted(
    classifiedId: bigint,
    updateData: Prisma.teamswantedclassifiedUpdateInput,
  ): Promise<dbTeamsWanted>;
  deleteTeamsWanted(classifiedId: bigint): Promise<void>;
  findAllTeamsWantedByAccount(accountId: bigint): Promise<dbTeamsWanted[]>;
}
