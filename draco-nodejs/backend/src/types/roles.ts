// Role system types and interfaces for Draco Sports Manager

export enum RoleType {
  ADMINISTRATOR = 'Administrator',
  ACCOUNT_ADMIN = 'AccountAdmin',
  ACCOUNT_PHOTO_ADMIN = 'AccountPhotoAdmin',
  LEAGUE_ADMIN = 'LeagueAdmin',
  TEAM_ADMIN = 'TeamAdmin',
  TEAM_PHOTO_ADMIN = 'TeamPhotoAdmin',
}

export interface ContactRole {
  id: bigint;
  contactId: bigint;
  roleId: string;
  roleData: bigint; // Context-specific data (team ID, league ID, etc.)
  accountId: bigint;
}

export interface RolePermission {
  roleId: string;
  permissions: string[];
  context: 'global' | 'account' | 'team' | 'league';
}

export interface RoleContext {
  accountId?: bigint;
  teamId?: bigint;
  leagueId?: bigint;
  seasonId?: bigint;
}

export interface UserRoles {
  globalRoles: string[];
  contactRoles: ContactRole[];
}

export interface RoleCheckResult {
  hasRole: boolean;
  roleLevel: 'global' | 'account' | 'team' | 'league' | 'none';
  context?: RoleContext;
}

// Role hierarchy definition
export const ROLE_HIERARCHY: Record<string, string[]> = {
  [RoleType.ADMINISTRATOR]: [
    RoleType.ACCOUNT_ADMIN,
    RoleType.ACCOUNT_PHOTO_ADMIN,
    RoleType.LEAGUE_ADMIN,
    RoleType.TEAM_ADMIN,
    RoleType.TEAM_PHOTO_ADMIN,
  ],
  [RoleType.ACCOUNT_ADMIN]: [
    RoleType.ACCOUNT_PHOTO_ADMIN,
    RoleType.LEAGUE_ADMIN,
    RoleType.TEAM_ADMIN,
    RoleType.TEAM_PHOTO_ADMIN,
  ],
  [RoleType.LEAGUE_ADMIN]: [RoleType.TEAM_ADMIN, RoleType.TEAM_PHOTO_ADMIN],
  [RoleType.TEAM_ADMIN]: [RoleType.TEAM_PHOTO_ADMIN],
};

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<string, RolePermission> = {
  [RoleType.ADMINISTRATOR]: {
    roleId: RoleType.ADMINISTRATOR,
    permissions: ['*'], // All permissions
    context: 'global',
  },
  [RoleType.ACCOUNT_ADMIN]: {
    roleId: RoleType.ACCOUNT_ADMIN,
    permissions: [
      'account.manage',
      'account.users.manage',
      'account.roles.manage',
      'account.umpires.manage',
      'account.fields.manage',
      'league.manage',
      'team.manage',
      'player.manage',
      'photo.manage',
      'workout.manage',
      'player-classified.manage',
    ],
    context: 'account',
  },
  [RoleType.ACCOUNT_PHOTO_ADMIN]: {
    roleId: RoleType.ACCOUNT_PHOTO_ADMIN,
    permissions: ['account.photos.manage', 'account.photos.view'],
    context: 'account',
  },
  [RoleType.LEAGUE_ADMIN]: {
    roleId: RoleType.LEAGUE_ADMIN,
    permissions: [
      'league.manage',
      'league.teams.manage',
      'league.players.manage',
      'league.schedule.manage',
      'player-classified.create-players-wanted',
    ],
    context: 'league',
  },
  [RoleType.TEAM_ADMIN]: {
    roleId: RoleType.TEAM_ADMIN,
    permissions: [
      'team.manage',
      'team.players.manage',
      'team.stats.manage',
      'player-classified.create-players-wanted',
    ],
    context: 'team',
  },
  [RoleType.TEAM_PHOTO_ADMIN]: {
    roleId: RoleType.TEAM_PHOTO_ADMIN,
    permissions: ['team.photos.manage', 'team.photos.view'],
    context: 'team',
  },
};
