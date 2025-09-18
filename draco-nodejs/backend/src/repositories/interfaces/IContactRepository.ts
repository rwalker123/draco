import { contacts } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbRosterPlayer } from '../types/dbTypes.js';

export interface IContactRepository extends IBaseRepository<contacts> {
  findRosterByContactId(contactId: bigint): Promise<dbRosterPlayer | null>;
}
