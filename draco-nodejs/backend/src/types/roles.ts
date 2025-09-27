// Role system types and interfaces for Draco Sports Manager

export enum RoleNamesType {
  ADMINISTRATOR = 'Administrator',
  ACCOUNT_ADMIN = 'AccountAdmin',
  ACCOUNT_PHOTO_ADMIN = 'AccountPhotoAdmin',
  LEAGUE_ADMIN = 'LeagueAdmin',
  TEAM_ADMIN = 'TeamAdmin',
  TEAM_PHOTO_ADMIN = 'TeamPhotoAdmin',
}

export interface RolePermission {
  roleId: string;
  permissions: string[];
  context: 'global' | 'account' | 'team' | 'league';
}

// Role hierarchy definition
export const ROLE_HIERARCHY: Record<string, string[]> = {
  [RoleNamesType.ADMINISTRATOR]: [
    RoleNamesType.ACCOUNT_ADMIN,
    RoleNamesType.ACCOUNT_PHOTO_ADMIN,
    RoleNamesType.LEAGUE_ADMIN,
    RoleNamesType.TEAM_ADMIN,
    RoleNamesType.TEAM_PHOTO_ADMIN,
  ],
  [RoleNamesType.ACCOUNT_ADMIN]: [
    RoleNamesType.ACCOUNT_PHOTO_ADMIN,
    RoleNamesType.LEAGUE_ADMIN,
    RoleNamesType.TEAM_ADMIN,
    RoleNamesType.TEAM_PHOTO_ADMIN,
  ],
  [RoleNamesType.LEAGUE_ADMIN]: [RoleNamesType.TEAM_ADMIN, RoleNamesType.TEAM_PHOTO_ADMIN],
  [RoleNamesType.TEAM_ADMIN]: [RoleNamesType.TEAM_PHOTO_ADMIN],
};

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<string, RolePermission> = {
  [RoleNamesType.ADMINISTRATOR]: {
    roleId: RoleNamesType.ADMINISTRATOR,
    permissions: ['*'], // All permissions including database.cleanup
    context: 'global',
  },
  [RoleNamesType.ACCOUNT_ADMIN]: {
    roleId: RoleNamesType.ACCOUNT_ADMIN,
    permissions: [
      'account.manage',
      'account.users.manage',
      'account.roles.manage',
      'account.umpires.manage',
      'account.fields.manage',
      'account.games.manage',
      'league.manage',
      'team.manage',
      'account.sponsors.manage',
      'player.manage',
      'photo.manage',
      'workout.manage',
      'player-classified.manage',
      'player-classified.create-players-wanted',
      'player-classified.edit-players-wanted',
      'player-classified.delete-players-wanted',
      'account.polls.manage',
    ],
    context: 'account',
  },
  [RoleNamesType.ACCOUNT_PHOTO_ADMIN]: {
    roleId: RoleNamesType.ACCOUNT_PHOTO_ADMIN,
    permissions: ['account.photos.manage', 'account.photos.view'],
    context: 'account',
  },
  [RoleNamesType.LEAGUE_ADMIN]: {
    roleId: RoleNamesType.LEAGUE_ADMIN,
    permissions: [
      'league.manage',
      'league.teams.manage',
      'league.players.manage',
      'league.schedule.manage',
      'player-classified.create-players-wanted',
      'player-classified.edit-players-wanted',
      'player-classified.delete-players-wanted',
    ],
    context: 'league',
  },
  [RoleNamesType.TEAM_ADMIN]: {
    roleId: RoleNamesType.TEAM_ADMIN,
    permissions: [
      'team.manage',
      'team.players.manage',
      'team.stats.manage',
      'team.sponsors.manage',
      'player-classified.create-players-wanted',
      'player-classified.edit-players-wanted',
      'player-classified.delete-players-wanted',
    ],
    context: 'team',
  },
  [RoleNamesType.TEAM_PHOTO_ADMIN]: {
    roleId: RoleNamesType.TEAM_PHOTO_ADMIN,
    permissions: ['team.photos.manage', 'team.photos.view'],
    context: 'team',
  },
};
