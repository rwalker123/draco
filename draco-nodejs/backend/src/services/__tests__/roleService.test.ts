import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  dbBaseContact,
  dbContactRoles,
  dbGlobalRoles,
} from '../../repositories/types/dbTypes.js';
import type { IContactRepository } from '../../repositories/interfaces/IContactRepository.js';
import type { IRoleRepository } from '../../repositories/interfaces/IRoleRepository.js';
import { ROLE_IDS, ROLE_NAMES } from '../../config/roles.js';
import { RoleNamesType } from '../../types/roles.js';
import { RoleService } from '../roleService.js';

vi.mock(
  '@draco/shared-schemas',
  () => ({
    formatDateToUtcString: (date: Date) => date.toISOString().split('T')[0],
  }),
  { virtual: true },
);

const contactRepositoryMockImpl: Pick<IContactRepository, 'findByUserId'> = {
  findByUserId: vi.fn<Promise<dbBaseContact | null>, [string, bigint]>(),
};

const roleRepositoryMockImpl: Pick<
  IRoleRepository,
  'findGlobalRoles' | 'findMany' | 'findAccountIdsForUserRoles'
> = {
  findGlobalRoles: vi.fn<Promise<dbGlobalRoles[]>, [string]>(),
  findMany: vi.fn<Promise<dbContactRoles[]>, [Record<string, unknown>]>(),
  findAccountIdsForUserRoles: vi.fn<Promise<bigint[]>, [string, string[]]>(),
};

const seasonRepositoryMock = {};
const teamRepositoryMock = {};
const leagueRepositoryMock = {};

vi.mock('../../repositories/index.js', async () => {
  const interfaces = await vi.importActual<typeof import('../../repositories/interfaces/index.js')>(
    '../../repositories/interfaces/index.js',
  );
  const types = await vi.importActual<typeof import('../../repositories/types/index.js')>(
    '../../repositories/types/index.js',
  );

  class MockRepositoryFactory {
    static getContactRepository() {
      return contactRepositoryMockImpl;
    }

    static getRoleRepository() {
      return roleRepositoryMockImpl;
    }

    static getSeasonRepository() {
      return seasonRepositoryMock;
    }

    static getTeamRepository() {
      return teamRepositoryMock;
    }

    static getLeagueRepository() {
      return leagueRepositoryMock;
    }
  }

  return {
    ...interfaces,
    ...types,
    RepositoryFactory: MockRepositoryFactory,
  };
});

const createDbContact = (id: bigint, accountId: bigint, userId: string): dbBaseContact => ({
  id,
  firstname: 'Test',
  lastname: 'User',
  email: 'test@example.com',
  phone1: null,
  phone2: null,
  phone3: null,
  streetaddress: null,
  city: null,
  state: null,
  zip: null,
  dateofbirth: null,
  middlename: null,
  creatoraccountid: accountId,
  userid: userId,
});

const createDbContactRole = (
  id: bigint,
  contactId: bigint,
  accountId: bigint,
  roleId: string,
): dbContactRoles => ({
  id,
  contactid: contactId,
  roleid: roleId,
  roledata: BigInt(0),
  accountid: accountId,
});

describe('RoleService#getUserRoles', () => {
  let roleService: InstanceType<typeof RoleService>;

  beforeEach(() => {
    contactRepositoryMockImpl.findByUserId.mockReset();
    roleRepositoryMockImpl.findGlobalRoles.mockReset();
    roleRepositoryMockImpl.findMany.mockReset();
    roleRepositoryMockImpl.findAccountIdsForUserRoles.mockReset();

    ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] = 'account-admin-role';
    ROLE_IDS[RoleNamesType.ADMINISTRATOR] = 'administrator-role';
    ROLE_NAMES['account-admin-role'] = RoleNamesType.ACCOUNT_ADMIN;
    ROLE_NAMES['administrator-role'] = RoleNamesType.ADMINISTRATOR;

    roleService = new RoleService();
  });

  afterEach(() => {
    ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] = '';
    ROLE_IDS[RoleNamesType.ADMINISTRATOR] = '';
    delete ROLE_NAMES['account-admin-role'];
    delete ROLE_NAMES['administrator-role'];
  });

  it('aggregates contact roles across managed accounts when accountId is omitted', async () => {
    const userId = 'user-1';
    const firstAccountId = BigInt(1);
    const secondAccountId = BigInt(2);

    roleRepositoryMockImpl.findGlobalRoles.mockResolvedValue([]);
    roleRepositoryMockImpl.findAccountIdsForUserRoles.mockResolvedValue([
      firstAccountId,
      secondAccountId,
    ]);

    const firstContact = createDbContact(BigInt(101), firstAccountId, userId);
    const secondContact = createDbContact(BigInt(202), secondAccountId, userId);

    contactRepositoryMockImpl.findByUserId.mockImplementation(async (_, accountId) => {
      if (accountId === firstAccountId) {
        return firstContact;
      }
      if (accountId === secondAccountId) {
        return secondContact;
      }
      return null;
    });

    const adminRoleId = ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN];

    const rolesByAccount: Record<string, dbContactRoles[]> = {
      [firstAccountId.toString()]: [
        createDbContactRole(BigInt(301), firstContact.id, firstAccountId, adminRoleId),
      ],
      [secondAccountId.toString()]: [
        createDbContactRole(BigInt(302), secondContact.id, secondAccountId, adminRoleId),
      ],
    };

    roleRepositoryMockImpl.findMany.mockImplementation(async (where) => {
      const accountKey = (where.accountid as bigint).toString();
      return rolesByAccount[accountKey] ?? [];
    });

    const result = await roleService.getUserRoles(userId);

    expect(roleRepositoryMockImpl.findAccountIdsForUserRoles).toHaveBeenCalledWith(userId, [
      'account-admin-role',
      'administrator-role',
    ]);
    expect(result.contactRoles).toHaveLength(2);
    expect(result.contactRoles.map((role) => role.accountId)).toEqual(
      expect.arrayContaining(['1', '2']),
    );
  });

  it('returns no contact roles when the user has no managed accounts', async () => {
    const userId = 'user-2';

    roleRepositoryMockImpl.findGlobalRoles.mockResolvedValue([]);
    roleRepositoryMockImpl.findAccountIdsForUserRoles.mockResolvedValue([]);

    const result = await roleService.getUserRoles(userId);

    expect(result.contactRoles).toEqual([]);
    expect(contactRepositoryMockImpl.findByUserId).not.toHaveBeenCalled();
    expect(roleRepositoryMockImpl.findMany).not.toHaveBeenCalled();
  });
});
