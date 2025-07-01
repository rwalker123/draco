import { RoleService } from '../roleService';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  aspnetuserroles: {
    findMany: jest.fn(),
  },
  contacts: {
    findFirst: jest.fn(),
  },
  contactroles: {
    findMany: jest.fn(),
  },
};

describe('RoleService', () => {
  const roleService = new RoleService(mockPrisma as unknown as PrismaClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalRoles', () => {
    it('returns role names for a user', async () => {
      mockPrisma.aspnetuserroles.findMany.mockResolvedValue([
        { aspnetroles: { name: 'Administrator' } },
        { aspnetroles: { name: 'User' } },
      ]);
      const roles = await roleService.getGlobalRoles('user123');
      expect(roles).toEqual(['Administrator', 'User']);
      expect(mockPrisma.aspnetuserroles.findMany).toHaveBeenCalledWith({
        where: { userid: 'user123' },
        include: { aspnetroles: true },
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
