import { Prisma, availablefields } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbAvailableField } from '../types/dbTypes.js';

export interface IFieldRepository
  extends IBaseRepository<
    availablefields,
    Prisma.availablefieldsCreateInput,
    Prisma.availablefieldsUpdateInput
  > {
  findByAccount(
    accountId: bigint,
    options: {
      skip: number;
      take: number;
      orderBy: Prisma.availablefieldsOrderByWithRelationInput;
    },
  ): Promise<dbAvailableField[]>;
  countByAccount(accountId: bigint): Promise<number>;
  findByName(accountId: bigint, name: string): Promise<availablefields | null>;
  findByNameExcludingId(
    accountId: bigint,
    name: string,
    excludeFieldId: bigint,
  ): Promise<availablefields | null>;
  findAccountField(accountId: bigint, fieldId: bigint): Promise<availablefields | null>;
  isFieldInUse(fieldId: bigint): Promise<boolean>;
}
