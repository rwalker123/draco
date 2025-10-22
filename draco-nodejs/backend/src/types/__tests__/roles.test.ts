import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS, RoleNamesType } from '../roles.js';

describe('ROLE_PERMISSIONS', () => {
  it('grants Team Admins team photo management permissions', () => {
    const teamAdminPermissions = ROLE_PERMISSIONS[RoleNamesType.TEAM_ADMIN]?.permissions ?? [];

    expect(teamAdminPermissions).toContain('team.photos.manage');
  });
});
