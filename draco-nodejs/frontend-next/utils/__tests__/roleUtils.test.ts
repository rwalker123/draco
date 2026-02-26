import { describe, expect, it } from 'vitest';
import {
  getRoleDisplayName,
  getRoleId,
  getRoleName,
  isRoleGuid,
  getAvailableRoleNames,
  getAvailableRoleIds,
  isTeamBasedRole,
  isLeagueBasedRole,
  ROLE_NAME_TO_ID,
} from '../roleUtils';

describe('getRoleDisplayName', () => {
  it('returns display name for a role name string', () => {
    expect(getRoleDisplayName('Administrator')).toBe('Administrator');
    expect(getRoleDisplayName('AccountAdmin')).toBe('Account Administrator');
    expect(getRoleDisplayName('TeamAdmin')).toBe('Team Administrator');
  });

  it('returns display name for a role GUID string', () => {
    const adminGuid = ROLE_NAME_TO_ID.Administrator;
    expect(getRoleDisplayName(adminGuid)).toBe('Administrator');
  });

  it('returns the raw value for unknown role', () => {
    expect(getRoleDisplayName('unknown-role')).toBe('unknown-role');
  });

  it('handles role object with contextName for account-level role (no context shown)', () => {
    const result = getRoleDisplayName({
      roleId: ROLE_NAME_TO_ID.AccountAdmin,
      contextName: 'My League',
    });
    expect(result).toBe('Account Administrator');
  });

  it('handles role object with contextName for team-level role (context shown)', () => {
    const result = getRoleDisplayName({
      roleId: ROLE_NAME_TO_ID.TeamAdmin,
      contextName: 'Tigers',
    });
    expect(result).toBe('Tigers Team Administrator');
  });

  it('handles role object with contextName for league-level role (context shown)', () => {
    const result = getRoleDisplayName({
      roleId: ROLE_NAME_TO_ID.LeagueAdmin,
      contextName: 'National League',
    });
    expect(result).toBe('National League League Administrator');
  });
});

describe('getRoleId', () => {
  it('returns GUID for known role name', () => {
    expect(getRoleId('Administrator')).toBe(ROLE_NAME_TO_ID.Administrator);
  });

  it('returns input for unknown role', () => {
    expect(getRoleId('UnknownRole')).toBe('UnknownRole');
  });
});

describe('getRoleName', () => {
  it('returns name for known GUID', () => {
    const guid = ROLE_NAME_TO_ID.TeamAdmin;
    expect(getRoleName(guid)).toBe('TeamAdmin');
  });

  it('returns input for unknown GUID', () => {
    expect(getRoleName('unknown-guid')).toBe('unknown-guid');
  });
});

describe('isRoleGuid', () => {
  it('returns true for known GUID', () => {
    expect(isRoleGuid(ROLE_NAME_TO_ID.Administrator)).toBe(true);
  });

  it('returns false for role name', () => {
    expect(isRoleGuid('Administrator')).toBe(false);
  });

  it('returns false for unknown string', () => {
    expect(isRoleGuid('random-string')).toBe(false);
  });
});

describe('getAvailableRoleNames', () => {
  it('returns all role names', () => {
    const names = getAvailableRoleNames();
    expect(names).toContain('Administrator');
    expect(names).toContain('TeamAdmin');
    expect(names).toContain('LeagueAdmin');
    expect(names.length).toBe(Object.keys(ROLE_NAME_TO_ID).length);
  });
});

describe('getAvailableRoleIds', () => {
  it('returns all role GUIDs', () => {
    const ids = getAvailableRoleIds();
    expect(ids).toContain(ROLE_NAME_TO_ID.Administrator);
    expect(ids.length).toBe(Object.keys(ROLE_NAME_TO_ID).length);
  });
});

describe('isTeamBasedRole', () => {
  it('returns true for TeamAdmin by name', () => {
    expect(isTeamBasedRole('TeamAdmin')).toBe(true);
  });

  it('returns true for TeamAdmin by GUID', () => {
    expect(isTeamBasedRole(ROLE_NAME_TO_ID.TeamAdmin)).toBe(true);
  });

  it('returns true for TeamPhotoAdmin', () => {
    expect(isTeamBasedRole('TeamPhotoAdmin')).toBe(true);
  });

  it('returns false for non-team roles', () => {
    expect(isTeamBasedRole('Administrator')).toBe(false);
    expect(isTeamBasedRole('LeagueAdmin')).toBe(false);
  });
});

describe('isLeagueBasedRole', () => {
  it('returns true for LeagueAdmin by name', () => {
    expect(isLeagueBasedRole('LeagueAdmin')).toBe(true);
  });

  it('returns true for LeagueAdmin by GUID', () => {
    expect(isLeagueBasedRole(ROLE_NAME_TO_ID.LeagueAdmin)).toBe(true);
  });

  it('returns false for non-league roles', () => {
    expect(isLeagueBasedRole('TeamAdmin')).toBe(false);
    expect(isLeagueBasedRole('Administrator')).toBe(false);
  });
});
