import { describe, expect, it, beforeAll } from 'vitest';
import {
  PERMISSION_TEST_CASES,
  ROLE_PERMISSIONS_FIXTURE,
  RoleName,
} from '@draco/shared-role-fixtures';
import { RoleService } from '../roleService.js';
import { RoleContextData } from '../interfaces/roleInterfaces.js';
import { ROLE_IDS, ROLE_PERMISSIONS_BY_ID, initializeRoleIds } from '../../config/roles.js';
import { ROLE_PERMISSIONS } from '../../types/roles.js';
import { RoleWithContactType, UserRolesType } from '@draco/shared-schemas';

const ROLE_GUIDS: Record<RoleName, string> = {
  Administrator: '00000000-0000-0000-0000-000000000001',
  AccountAdmin: '00000000-0000-0000-0000-000000000002',
  AccountPhotoAdmin: '00000000-0000-0000-0000-000000000003',
  LeagueAdmin: '00000000-0000-0000-0000-000000000004',
  TeamAdmin: '00000000-0000-0000-0000-000000000005',
  TeamPhotoAdmin: '00000000-0000-0000-0000-000000000006',
};

const sorted = (values: string[]): string[] => [...values].sort();

const toContext = (context: {
  accountId?: string;
  teamId?: string;
  leagueId?: string;
}): RoleContextData => ({
  accountId: BigInt(context.accountId ?? '0'),
  teamId: context.teamId === undefined ? undefined : BigInt(context.teamId),
  leagueId: context.leagueId === undefined ? undefined : BigInt(context.leagueId),
});

const buildService = (userRoles: UserRolesType): RoleService => {
  const service = Object.create(RoleService.prototype) as RoleService;
  service.getUserRoles = async () => userRoles;
  return service;
};

beforeAll(async () => {
  await initializeRoleIds({
    aspnetroles: {
      findMany: async () => Object.entries(ROLE_GUIDS).map(([name, id]) => ({ id, name })),
    },
  });
});

describe('permission fixtures — backend RoleService.hasPermission', () => {
  it('fixture role table matches backend ROLE_PERMISSIONS (drift guard)', () => {
    const fixtureNames = Object.keys(ROLE_PERMISSIONS_FIXTURE).sort();
    const backendNames = Object.keys(ROLE_PERMISSIONS).sort();
    expect(fixtureNames).toEqual(backendNames);

    for (const name of fixtureNames) {
      const fixture = ROLE_PERMISSIONS_FIXTURE[name as RoleName];
      const backend = ROLE_PERMISSIONS[name];
      expect(fixture.context, `context for ${name}`).toBe(backend.context);
      expect(sorted(fixture.permissions), `permissions for ${name}`).toEqual(
        sorted(backend.permissions),
      );
    }
  });

  it('every role is exercised by at least one fixture case (exhaustiveness)', () => {
    const exercised = new Set<string>();
    for (const testCase of PERMISSION_TEST_CASES) {
      for (const role of testCase.contactRoles) exercised.add(ROLE_IDS[role.roleName]);
      for (const role of testCase.globalRoles) exercised.add(ROLE_IDS[role]);
    }
    for (const roleId of Object.keys(ROLE_PERMISSIONS_BY_ID)) {
      expect(exercised.has(roleId), `role id ${roleId} not exercised`).toBe(true);
    }
  });

  for (const testCase of PERMISSION_TEST_CASES) {
    it(testCase.name, async () => {
      const contactRoles: RoleWithContactType[] = testCase.contactRoles.map((role) => ({
        id: '0',
        roleId: ROLE_IDS[role.roleName],
        roleName: role.roleName,
        roleData: role.roleData,
        accountId: role.accountId,
        contact: { id: '0' },
      }));

      const userRoles: UserRolesType = {
        globalRoles: testCase.globalRoles.map((name) => ROLE_IDS[name]),
        contactRoles,
      };

      const service = buildService(userRoles);
      const result = await service.hasPermission(
        'user-1',
        testCase.permission,
        toContext(testCase.context),
      );

      expect(result, testCase.rationale ?? testCase.name).toBe(testCase.expected);
    });
  }
});
