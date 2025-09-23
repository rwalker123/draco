import { contactroles } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbAspnetRoleName, dbAspnetRolesId, dbGlobalRoles } from '../types/dbTypes.js';

export interface IRoleRepository extends IBaseRepository<contactroles> {
  findGlobalRoles(userId: string): Promise<dbGlobalRoles[]>;
  findRoleId(roleName: string): Promise<dbAspnetRolesId | null>;
  findRoleName(roleId: string): Promise<dbAspnetRoleName | null>;
  removeContactRole(
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<contactroles | null>;
  findRole(
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<contactroles | null>;
  getUsersWithRole(roleId: string, accountId: bigint): Promise<contactroles[]>;
  findAccountIdsForUserRoles(userId: string, roleIds: string[]): Promise<bigint[]>;
}
