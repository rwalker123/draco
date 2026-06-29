export type RoleLevel = 'global' | 'account' | 'team' | 'league';

export interface ContactRoleLike {
  roleId: string;
  accountId?: string;
  roleData?: string;
}

export interface PermissionContextLike {
  accountId?: string;
  teamId?: string;
  leagueId?: string;
}

export function validateRoleContext(
  contactRole: ContactRoleLike,
  level: RoleLevel | string | undefined,
  context: PermissionContextLike | undefined,
): boolean {
  if (level === 'account') {
    return Boolean(context?.accountId) && contactRole.accountId === context!.accountId;
  }

  if (level === 'team') {
    return (
      Boolean(context?.accountId) &&
      Boolean(context?.teamId) &&
      contactRole.accountId === context!.accountId &&
      contactRole.roleData === context!.teamId
    );
  }

  if (level === 'league') {
    return (
      Boolean(context?.accountId) &&
      Boolean(context?.leagueId) &&
      contactRole.accountId === context!.accountId &&
      contactRole.roleData === context!.leagueId
    );
  }

  return false;
}
