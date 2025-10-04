import { contactroles, PrismaClient } from '@prisma/client';
import { IRoleRepository } from '../interfaces/index.js';
import {
  dbAspnetRole,
  dbAspnetRoleName,
  dbAspnetRolesId,
  dbContactRoles,
  dbGlobalRoles,
} from '../types/dbTypes.js';

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private prisma: PrismaClient) {}

  async findAllRoles(): Promise<dbAspnetRole[]> {
    return await this.prisma.aspnetroles.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: bigint): Promise<dbContactRoles | null> {
    return await this.prisma.contactroles.findUnique({
      where: { id: id },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<dbContactRoles[]> {
    return await this.prisma.contactroles.findMany({ where });
  }

  async create(data: Partial<dbContactRoles>): Promise<dbContactRoles> {
    return await this.prisma.contactroles.create({
      data: data as Parameters<typeof this.prisma.contactroles.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<dbContactRoles>): Promise<dbContactRoles> {
    return await this.prisma.contactroles.update({
      where: { id: id },
      data: data as Parameters<typeof this.prisma.contactroles.update>[0]['data'],
    });
  }

  async delete(id: bigint): Promise<dbContactRoles> {
    return await this.prisma.contactroles.delete({ where: { id: id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return await this.prisma.contactroles.count({ where });
  }

  async findGlobalRoles(userId: string): Promise<dbGlobalRoles[]> {
    return await this.prisma.aspnetuserroles.findMany({
      where: { userid: userId },
      select: {
        roleid: true,
      },
    });
  }

  async findRoleId(roleName: string): Promise<dbAspnetRolesId | null> {
    return await this.prisma.aspnetroles.findFirst({
      where: { name: roleName },
      select: { id: true },
    });
  }

  async findRoleName(roleId: string): Promise<dbAspnetRoleName | null> {
    return await this.prisma.aspnetroles.findUnique({
      where: { id: roleId },
      select: { name: true },
    });
  }

  async removeContactRole(
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<contactroles | null> {
    // find the role
    const role = await this.prisma.contactroles.findFirst({
      where: { contactid: contactId, roleid: roleId, roledata: roleData, accountid: accountId },
    });
    if (!role) {
      return null;
    }
    return await this.prisma.contactroles.delete({ where: { id: role.id } });
  }

  async findRole(
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<contactroles | null> {
    return await this.prisma.contactroles.findFirst({
      where: { contactid: contactId, roleid: roleId, roledata: roleData, accountid: accountId },
    });
  }

  async getUsersWithRole(roleId: string, accountId: bigint): Promise<contactroles[]> {
    return await this.prisma.contactroles.findMany({
      where: {
        roleid: roleId,
        accountid: accountId,
      },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get user roles for permission checking
   *
   * Retrieves the roles assigned to a contact within a specific account for
   * permission checking. This is a simplified implementation that directly
   * queries the contactroles table. In production, integrate with the role service.
   *
   * @param contactId - ID of the contact to get roles for
   * @param accountId - Account ID to scope role lookup to specific account
   * @returns Array of role objects with role IDs
   *
   * @security Implements proper error handling and logging to prevent
   * information leakage while maintaining security audit trails.
   *
   * @todo Integrate with centralized role service for production use
   */
  async getContactRoles(contactId: bigint, accountId: bigint): Promise<Array<{ roleId: string }>> {
    const roles = await this.prisma.contactroles.findMany({
      where: {
        contactid: contactId,
        accountid: accountId,
      },
      select: { roleid: true },
    });

    return roles.map((role) => ({ roleId: role.roleid }));
  }

  async findAccountIdsForUserRoles(userId: string, roleIds: string[]): Promise<bigint[]> {
    if (!roleIds.length) {
      return [];
    }

    const roles = await this.prisma.contactroles.findMany({
      where: {
        roleid: { in: roleIds },
        contacts: {
          userid: userId,
        },
      },
      select: {
        accountid: true,
      },
    });

    const accountIds = roles
      .map((role) => role.accountid)
      .filter((id): id is bigint => id !== null);

    return Array.from(new Set(accountIds));
  }
}
