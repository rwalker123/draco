import { playerswantedclassified, Prisma } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbClassifiedPageResponse,
  dbClassifiedSearchParams,
  dbPlayersWanted,
  dbPlayersWantedWithRelations,
} from '../types/dbTypes.js';

export interface IPlayersWantedRepository extends IBaseRepository<playerswantedclassified> {
  createPlayersWantedRecord(
    dbData: Prisma.playerswantedclassifiedUncheckedCreateInput,
  ): Promise<playerswantedclassified>;
  getPlayersWanted(
    accountId: bigint,
    params: dbClassifiedSearchParams,
  ): Promise<dbClassifiedPageResponse<playerswantedclassified>>;
  findPlayersWantedById(classifiedId: bigint, accountId: bigint): Promise<dbPlayersWanted | null>;
  updatePlayersWanted(
    classifiedId: bigint,
    updateData: Prisma.playerswantedclassifiedUpdateInput,
  ): Promise<dbPlayersWantedWithRelations | null>;
  deletePlayersWanted(classifiedId: bigint): Promise<void>;
}
