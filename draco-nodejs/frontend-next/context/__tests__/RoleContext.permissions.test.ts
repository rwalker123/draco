import { describe, expect, it } from 'vitest';
import {
  PERMISSION_TEST_CASES,
  ROLE_PERMISSIONS_FIXTURE,
  RoleName,
} from '@draco/shared-role-fixtures';
import {
  evaluatePermission,
  ROLE_NAME_TO_ID,
  RolePermissionsByRoleId,
  UserRolesLike,
} from '../../utils/roleUtils';

const ROLE_NAMES = Object.keys(ROLE_PERMISSIONS_FIXTURE) as RoleName[];

const buildPermissions = (): RolePermissionsByRoleId => {
  const permissions: RolePermissionsByRoleId = {};
  for (const name of ROLE_NAMES) {
    const roleId = ROLE_NAME_TO_ID[name];
    permissions[roleId] = {
      roleId,
      permissions: ROLE_PERMISSIONS_FIXTURE[name].permissions,
      context: ROLE_PERMISSIONS_FIXTURE[name].context,
    };
  }
  return permissions;
};

describe('permission fixtures — frontend evaluatePermission', () => {
  const permissions = buildPermissions();

  it('every role in metadata is exercised by at least one fixture case (exhaustiveness)', () => {
    const exercised = new Set<string>();
    for (const testCase of PERMISSION_TEST_CASES) {
      for (const role of testCase.contactRoles) exercised.add(ROLE_NAME_TO_ID[role.roleName]);
      for (const role of testCase.globalRoles) exercised.add(ROLE_NAME_TO_ID[role]);
    }
    for (const roleId of Object.keys(permissions)) {
      expect(exercised.has(roleId), `role id ${roleId} not exercised`).toBe(true);
    }
  });

  for (const testCase of PERMISSION_TEST_CASES) {
    it(testCase.name, () => {
      const userRoles: UserRolesLike = {
        globalRoles: testCase.globalRoles,
        contactRoles: testCase.contactRoles.map((role) => ({
          roleId: role.roleName,
          accountId: role.accountId,
          roleData: role.roleData,
        })),
      };

      const result = evaluatePermission(
        userRoles,
        permissions,
        testCase.permission,
        testCase.context,
      );

      expect(result, testCase.rationale ?? testCase.name).toBe(testCase.expected);
    });
  }
});
