import { RoleService } from '../roleService.js';
import { PrismaClient } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPrisma = {
  aspnetuserroles: {
    findMany: vi.fn(),
  },
  contacts: {
    findFirst: vi.fn(),
  },
  contactroles: {
    findMany: vi.fn(),
  },
};

describe('RoleService', () => {
  const roleService = new RoleService(mockPrisma as unknown as PrismaClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGlobalRoles', () => {
    it('returns role IDs for a user', async () => {
      mockPrisma.aspnetuserroles.findMany.mockResolvedValue([
        { roleid: 'role-id-1' },
        { roleid: 'role-id-2' },
      ]);
      const roles = await roleService.getGlobalRoles('user123');
      expect(roles).toEqual(['role-id-1', 'role-id-2']);
      expect(mockPrisma.aspnetuserroles.findMany).toHaveBeenCalledWith({
        where: { userid: 'user123' },
        select: { roleid: true },
      });
    });
  });

  describe('getContactRoles', () => {
    it('returns contact roles for a user in an account', async () => {
      mockPrisma.contacts.findFirst.mockResolvedValue({ id: 42 });
      mockPrisma.contactroles.findMany.mockResolvedValue([
        { id: 1, contactid: 42, roleid: 'AccountAdmin', roledata: 0, accountid: 99 },
      ]);
      const roles = await roleService.getContactRoles('user123', BigInt(99));
      expect(roles).toEqual([
        { id: 1, contactId: 42, roleId: 'AccountAdmin', roleData: 0, accountId: 99 },
      ]);
    });
    it('returns empty array if no contact found', async () => {
      mockPrisma.contacts.findFirst.mockResolvedValue(null);
      const roles = await roleService.getContactRoles('user123', BigInt(99));
      expect(roles).toEqual([]);
    });
  });
});
