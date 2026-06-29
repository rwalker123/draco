export type RoleName =
  | 'Administrator'
  | 'AccountAdmin'
  | 'AccountPhotoAdmin'
  | 'LeagueAdmin'
  | 'TeamAdmin'
  | 'TeamPhotoAdmin';

export type RoleLevel = 'global' | 'account' | 'team' | 'league';

export interface RolePermissionFixture {
  permissions: string[];
  context: RoleLevel;
}

export interface RoleFixture {
  roleName: RoleName;
  accountId: string;
  roleData: string;
}

export interface PermissionTestContext {
  accountId?: string;
  teamId?: string;
  leagueId?: string;
}

export interface PermissionTestCase {
  name: string;
  contactRoles: RoleFixture[];
  globalRoles: RoleName[];
  permission: string;
  context: PermissionTestContext;
  expected: boolean;
  rationale?: string;
}

export const ROLE_PERMISSIONS_FIXTURE: Record<RoleName, RolePermissionFixture> = {
  Administrator: {
    permissions: ['*'],
    context: 'global',
  },
  AccountAdmin: {
    permissions: [
      'account.communications.manage',
      'account.contacts.manage',
      'account.contacts.photos.manage',
      'account.dashboard.view',
      'account.handouts.manage',
      'account.fields.manage',
      'account.games.manage',
      'account.manage',
      'account.settings.manage',
      'account.photos.manage',
      'account.polls.manage',
      'account.player-surveys.manage',
      'account.roles.manage',
      'account.rosters.view',
      'account.sponsors.manage',
      'account.umpires.manage',
      'league.faq.manage',
      'manage-users',
      'team.communications.send',
      'team.handouts.manage',
      'team.photos.manage',
      'team.sponsors.manage',
      'league.manage',
      'team.manage',
      'player.manage',
      'photo.manage',
      'workout.manage',
      'player-classified.manage',
      'player-classified.create-players-wanted',
      'player-classified.edit-players-wanted',
      'player-classified.delete-players-wanted',
      'team.managers.manage',
    ],
    context: 'account',
  },
  AccountPhotoAdmin: {
    permissions: ['account.photos.manage', 'account.contacts.photos.manage', 'team.photos.manage'],
    context: 'account',
  },
  LeagueAdmin: {
    permissions: [
      'league.manage',
      'league.teams.manage',
      'league.players.manage',
      'league.schedule.manage',
      'league.faq.manage',
      'account.contacts.photos.manage',
      'player-classified.create-players-wanted',
      'player-classified.edit-players-wanted',
      'player-classified.delete-players-wanted',
    ],
    context: 'league',
  },
  TeamAdmin: {
    permissions: [
      'team.communications.send',
      'team.manage',
      'team.handouts.manage',
      'team.players.manage',
      'team.stats.manage',
      'team.sponsors.manage',
      'team.photos.manage',
      'team.managers.manage',
      'player-classified.create-players-wanted',
      'player-classified.edit-players-wanted',
      'player-classified.delete-players-wanted',
    ],
    context: 'team',
  },
  TeamPhotoAdmin: {
    permissions: ['team.photos.manage', 'account.contacts.photos.manage'],
    context: 'team',
  },
};

export const PERMISSION_TEST_CASES: readonly PermissionTestCase[] = [
  {
    name: 'AccountAdmin granted account permission under team context',
    contactRoles: [{ roleName: 'AccountAdmin', accountId: '1', roleData: '1' }],
    globalRoles: [],
    permission: 'account.contacts.manage',
    context: { accountId: '1', teamId: '5' },
    expected: true,
    rationale: 'Defect 1: account-level grant must survive an extra teamId in context.',
  },
  {
    name: 'AccountAdmin granted team.communications.send under team context',
    contactRoles: [{ roleName: 'AccountAdmin', accountId: '1', roleData: '1' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '1', teamId: '5' },
    expected: true,
    rationale: 'Defect 1: the original team-page Email button regression.',
  },
  {
    name: 'AccountAdmin granted account permission under league context',
    contactRoles: [{ roleName: 'AccountAdmin', accountId: '1', roleData: '1' }],
    globalRoles: [],
    permission: 'account.contacts.manage',
    context: { accountId: '1', leagueId: '7' },
    expected: true,
    rationale: 'Defect 1: account-level grant must survive an extra leagueId in context.',
  },
  {
    name: 'LeagueAdmin denied team-scoped check on colliding id',
    contactRoles: [{ roleName: 'LeagueAdmin', accountId: '1', roleData: '7' }],
    globalRoles: [],
    permission: 'account.contacts.photos.manage',
    context: { accountId: '1', teamId: '7' },
    expected: false,
    rationale: 'Defect 2: leagueId 7 must not match teamId 7.',
  },
  {
    name: 'TeamAdmin denied league-scoped check on colliding id',
    contactRoles: [{ roleName: 'TeamAdmin', accountId: '1', roleData: '7' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '1', leagueId: '7' },
    expected: false,
    rationale: 'Defect 2: teamId 7 must not match leagueId 7.',
  },
  {
    name: 'TeamPhotoAdmin denied league-scoped check on colliding id',
    contactRoles: [{ roleName: 'TeamPhotoAdmin', accountId: '1', roleData: '9' }],
    globalRoles: [],
    permission: 'account.contacts.photos.manage',
    context: { accountId: '1', leagueId: '9' },
    expected: false,
    rationale: 'Defect 2: team-scoped role must not match a league context.',
  },
  {
    name: 'AccountAdmin denied across account boundary',
    contactRoles: [{ roleName: 'AccountAdmin', accountId: '1', roleData: '1' }],
    globalRoles: [],
    permission: 'account.contacts.manage',
    context: { accountId: '2' },
    expected: false,
    rationale: 'Account boundary: role in account 1, context account 2.',
  },
  {
    name: 'TeamAdmin denied right team wrong account',
    contactRoles: [{ roleName: 'TeamAdmin', accountId: '1', roleData: '5' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '2', teamId: '5' },
    expected: false,
    rationale: 'Account boundary: matching teamId but wrong account.',
  },
  {
    name: 'TeamAdmin granted matching team context',
    contactRoles: [{ roleName: 'TeamAdmin', accountId: '1', roleData: '5' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '1', teamId: '5' },
    expected: true,
    rationale: 'Team-scoped grant with the correct teamId.',
  },
  {
    name: 'TeamAdmin denied wrong team context',
    contactRoles: [{ roleName: 'TeamAdmin', accountId: '1', roleData: '5' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '1', teamId: '6' },
    expected: false,
    rationale: 'Team-scoped role for team 5 must not match team 6.',
  },
  {
    name: 'TeamAdmin denied missing team context',
    contactRoles: [{ roleName: 'TeamAdmin', accountId: '1', roleData: '5' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '1' },
    expected: false,
    rationale: 'Strict matching: missing required teamId denies.',
  },
  {
    name: 'LeagueAdmin granted matching league context',
    contactRoles: [{ roleName: 'LeagueAdmin', accountId: '1', roleData: '7' }],
    globalRoles: [],
    permission: 'league.faq.manage',
    context: { accountId: '1', leagueId: '7' },
    expected: true,
    rationale: 'League-scoped grant with the correct leagueId.',
  },
  {
    name: 'LeagueAdmin denied wrong league context',
    contactRoles: [{ roleName: 'LeagueAdmin', accountId: '1', roleData: '7' }],
    globalRoles: [],
    permission: 'league.faq.manage',
    context: { accountId: '1', leagueId: '8' },
    expected: false,
    rationale: 'League-scoped role for league 7 must not match league 8.',
  },
  {
    name: 'LeagueAdmin denied missing league context',
    contactRoles: [{ roleName: 'LeagueAdmin', accountId: '1', roleData: '7' }],
    globalRoles: [],
    permission: 'league.faq.manage',
    context: { accountId: '1' },
    expected: false,
    rationale: 'Strict matching: missing required leagueId denies.',
  },
  {
    name: 'Administrator granted account permission with account context',
    contactRoles: [],
    globalRoles: ['Administrator'],
    permission: 'account.contacts.manage',
    context: { accountId: '1' },
    expected: true,
    rationale: 'Global role holds wildcard.',
  },
  {
    name: 'Administrator granted with empty context',
    contactRoles: [],
    globalRoles: ['Administrator'],
    permission: 'database.cleanup',
    context: {},
    expected: true,
    rationale: 'Administrator wildcard needs no context.',
  },
  {
    name: 'Administrator granted regardless of context ids',
    contactRoles: [],
    globalRoles: ['Administrator'],
    permission: 'account.contacts.manage',
    context: { accountId: '999', teamId: '999', leagueId: '999' },
    expected: true,
    rationale: 'Global role bypasses context filtering entirely.',
  },
  {
    name: 'TeamAdmin denied permission it does not hold',
    contactRoles: [{ roleName: 'TeamAdmin', accountId: '1', roleData: '5' }],
    globalRoles: [],
    permission: 'account.contacts.manage',
    context: { accountId: '1', teamId: '5' },
    expected: false,
    rationale: 'TeamAdmin does not hold account.contacts.manage.',
  },
  {
    name: 'LeagueAdmin denied permission it does not hold',
    contactRoles: [{ roleName: 'LeagueAdmin', accountId: '1', roleData: '7' }],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '1', leagueId: '7' },
    expected: false,
    rationale: 'LeagueAdmin does not hold team.communications.send.',
  },
  {
    name: 'Multiple roles: TeamAdmin in second account grants',
    contactRoles: [
      { roleName: 'AccountAdmin', accountId: '1', roleData: '1' },
      { roleName: 'TeamAdmin', accountId: '2', roleData: '5' },
    ],
    globalRoles: [],
    permission: 'team.communications.send',
    context: { accountId: '2', teamId: '5' },
    expected: true,
    rationale: 'TeamAdmin in account 2 grants; AccountAdmin in account 1 does not apply.',
  },
  {
    name: 'AccountPhotoAdmin granted account photo permission',
    contactRoles: [{ roleName: 'AccountPhotoAdmin', accountId: '1', roleData: '1' }],
    globalRoles: [],
    permission: 'account.contacts.photos.manage',
    context: { accountId: '1' },
    expected: true,
    rationale: 'Account-scoped photo admin holds the permission.',
  },
  {
    name: 'AccountPhotoAdmin denied permission it does not hold',
    contactRoles: [{ roleName: 'AccountPhotoAdmin', accountId: '1', roleData: '1' }],
    globalRoles: [],
    permission: 'account.contacts.manage',
    context: { accountId: '1' },
    expected: false,
    rationale: 'AccountPhotoAdmin does not hold account.contacts.manage.',
  },
  {
    name: 'No roles denies everything',
    contactRoles: [],
    globalRoles: [],
    permission: 'account.contacts.manage',
    context: { accountId: '1' },
    expected: false,
    rationale: 'Unauthenticated / no roles.',
  },
];
