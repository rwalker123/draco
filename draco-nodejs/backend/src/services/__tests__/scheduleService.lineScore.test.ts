import { describe, it, expect, beforeEach, afterEach, vi, type Mocked } from 'vitest';

import { ScheduleService } from '../scheduleService.js';
import { ServiceFactory } from '../serviceFactory.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../../repositories/interfaces/IScheduleRepository.js';
import type { IRoleService } from '../../services/interfaces/roleInterfaces.js';
import type { ContactService } from '../contactService.js';
import type { DiscordIntegrationService } from '../discordIntegrationService.js';
import type { TwitterIntegrationService } from '../twitterIntegrationService.js';
import type { BlueskyIntegrationService } from '../blueskyIntegrationService.js';
import type { FacebookIntegrationService } from '../facebookIntegrationService.js';
import type { AccountSettingsService } from '../accountSettingsService.js';
import type { EmailService } from '../emailService.js';
import type { RosterService } from '../rosterService.js';
import type { AccountsService } from '../accountsService.js';
import type { dbScheduleGameForAccount } from '../../repositories/types/index.js';
import type { gamelinescore, Prisma } from '#prisma/client';
import type { UserRolesType, RoleCheckType } from '@draco/shared-schemas';
import { ROLE_IDS } from '../../config/roles.js';
import { RoleNamesType } from '../../types/roles.js';
import { AuthorizationError } from '../../utils/customErrors.js';
import { partialMock } from '../../test-utils/partialMock.js';

const accountId = 99n;
const seasonId = 5n;
const gameId = 1n;
const homeTeamId = 100n;
const awayTeamId = 200n;

const makeGame = (hscore: number, vscore: number): dbScheduleGameForAccount =>
  ({
    id: gameId,
    leagueid: 10n,
    hteamid: homeTeamId,
    vteamid: awayTeamId,
    gamedate: new Date('2026-06-06T19:00:00Z'),
    fieldid: null,
    gamestatus: 1,
    gametype: 0,
    hscore,
    vscore,
    comment: '',
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    leagueseason: {
      id: 10n,
      seasonid: seasonId,
      leagueid: 1n,
      league: { id: 1n, name: 'League', accountid: accountId },
      season: { id: seasonId, name: 'Season', accountid: accountId },
    },
  }) as dbScheduleGameForAccount;

const makeRow = (home: Prisma.JsonValue, away: Prisma.JsonValue): gamelinescore => ({
  id: 1n,
  gameid: gameId,
  home,
  away,
  createdat: new Date('2026-06-06T00:00:00.000Z'),
  updatedat: new Date('2026-06-06T00:00:00.000Z'),
});

const teamManagerRoles: UserRolesType = { globalRoles: [], contactRoles: [] };
const administratorRoles: UserRolesType = {
  globalRoles: [ROLE_IDS[RoleNamesType.ADMINISTRATOR]],
  contactRoles: [],
};

const sideJson = (
  overrides: Partial<{
    runsByInning: (number | null)[];
    errors: number | null;
    hitsOverride: number | null;
    enteredByTeamSeasonId: string;
    enteredByContactId: string | null;
    enteredAt: string;
  }> = {},
): Prisma.JsonValue =>
  ({
    runsByInning: overrides.runsByInning ?? [0, 1, 0],
    errors: overrides.errors ?? 1,
    hitsOverride: overrides.hitsOverride ?? null,
    enteredByContactId: overrides.enteredByContactId ?? null,
    enteredByTeamSeasonId: overrides.enteredByTeamSeasonId ?? null,
    enteredAt: overrides.enteredAt ?? '2026-06-06T00:00:00.000Z',
  }) as Prisma.JsonValue;

describe('ScheduleService — line score', () => {
  let scheduleRepositoryMock: Mocked<IScheduleRepository>;
  let roleServiceMock: Mocked<IRoleService>;
  let contactServiceMock: Mocked<ContactService>;
  let service: ScheduleService;

  beforeEach(() => {
    scheduleRepositoryMock = partialMock<IScheduleRepository>({
      findGameWithAccountContext: vi.fn().mockResolvedValue(makeGame(4, 3)),
      findLineScore: vi.fn().mockResolvedValue(null),
      upsertLineScoreSides: vi.fn().mockResolvedValue({} as gamelinescore),
      sumBattingHitsByGame: vi.fn().mockResolvedValue(new Map<string, number>()),
      getTeamNames: vi.fn().mockResolvedValue(
        new Map([
          [homeTeamId.toString(), 'Home Team'],
          [awayTeamId.toString(), 'Away Team'],
        ]),
      ),
    });

    roleServiceMock = partialMock<IRoleService>({
      getUserRoles: vi.fn().mockResolvedValue(teamManagerRoles),
      hasRole: vi.fn().mockImplementation(
        async (userId: string, roleId: string, context): Promise<RoleCheckType> => ({
          userId,
          roleId,
          hasRole: false,
          roleLevel: 'none',
          context: context?.teamId?.toString(),
        }),
      ),
    });

    contactServiceMock = partialMock<ContactService>({
      getContactByUserId: vi.fn().mockRejectedValue(new Error('no contact')),
    });

    vi.spyOn(RepositoryFactory, 'getScheduleRepository').mockReturnValue(scheduleRepositoryMock);
    vi.spyOn(ServiceFactory, 'getRoleService').mockReturnValue(roleServiceMock);
    vi.spyOn(ServiceFactory, 'getContactService').mockReturnValue(contactServiceMock);
    vi.spyOn(ServiceFactory, 'getDiscordIntegrationService').mockReturnValue(
      partialMock<DiscordIntegrationService>({}),
    );
    vi.spyOn(ServiceFactory, 'getTwitterIntegrationService').mockReturnValue(
      partialMock<TwitterIntegrationService>({}),
    );
    vi.spyOn(ServiceFactory, 'getBlueskyIntegrationService').mockReturnValue(
      partialMock<BlueskyIntegrationService>({}),
    );
    vi.spyOn(ServiceFactory, 'getFacebookIntegrationService').mockReturnValue(
      partialMock<FacebookIntegrationService>({}),
    );
    vi.spyOn(ServiceFactory, 'getAccountSettingsService').mockReturnValue(
      partialMock<AccountSettingsService>({}),
    );
    vi.spyOn(ServiceFactory, 'getEmailService').mockReturnValue(partialMock<EmailService>({}));
    vi.spyOn(ServiceFactory, 'getRosterService').mockReturnValue(partialMock<RosterService>({}));
    vi.spyOn(ServiceFactory, 'getAccountsService').mockReturnValue(
      partialMock<AccountsService>({}),
    );

    service = new ScheduleService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Lets userId manage only the given team (simulates that team's TeamAdmin).
  const grantTeamManager = (managedTeamId: bigint) => {
    roleServiceMock.hasRole.mockImplementation(
      async (userId: string, roleId: string, context): Promise<RoleCheckType> => ({
        userId,
        roleId,
        hasRole: context?.teamId === managedTeamId,
        roleLevel: 'none',
      }),
    );
  };

  const capturedSide = (call: number, side: 'home' | 'away') => {
    const arg = scheduleRepositoryMock.upsertLineScoreSides.mock.calls[call][1];
    return arg[side] as
      | { runsByInning: (number | null)[]; errors: number | null; enteredByTeamSeasonId: string }
      | undefined;
  };

  describe('getGameLineScore — derivation', () => {
    it('takes total runs from the game result, not from the innings', async () => {
      scheduleRepositoryMock.findLineScore.mockResolvedValue(
        makeRow(sideJson({ runsByInning: [1, 0, 0] }), sideJson({ runsByInning: [0, 0, 0] })),
      );

      const result = await service.getGameLineScore(accountId, seasonId, gameId);

      // ...but R reflects the final score (hscore=4 / vscore=3).
      expect(result.home.runs).toBe(4);
      expect(result.away.runs).toBe(3);
    });

    it('derives hits from batting stats when no override is present', async () => {
      scheduleRepositoryMock.findLineScore.mockResolvedValue(
        makeRow(sideJson({ hitsOverride: null }), sideJson({ hitsOverride: null })),
      );
      scheduleRepositoryMock.sumBattingHitsByGame.mockResolvedValue(
        new Map([[homeTeamId.toString(), 9]]),
      );

      const result = await service.getGameLineScore(accountId, seasonId, gameId);

      expect(result.home.hits).toBe(9); // from batstatsum sum
      expect(result.away.hits).toBeNull(); // no stats, no override
    });

    it('uses the manual hits override when set, ignoring derived stats', async () => {
      scheduleRepositoryMock.findLineScore.mockResolvedValue(
        makeRow(sideJson({ hitsOverride: 7 }), sideJson()),
      );
      scheduleRepositoryMock.sumBattingHitsByGame.mockResolvedValue(
        new Map([[homeTeamId.toString(), 9]]),
      );

      const result = await service.getGameLineScore(accountId, seasonId, gameId);

      expect(result.home.hits).toBe(7);
    });

    it('marks a side authoritative only when entered by its own team', async () => {
      scheduleRepositoryMock.findLineScore.mockResolvedValue(
        makeRow(
          sideJson({ enteredByTeamSeasonId: homeTeamId.toString() }),
          sideJson({ enteredByTeamSeasonId: homeTeamId.toString() }), // away filled by home
        ),
      );

      const result = await service.getGameLineScore(accountId, seasonId, gameId);

      expect(result.home.authoritative).toBe(true);
      expect(result.away.authoritative).toBe(false);
    });
  });

  describe('upsertGameLineScore — per-side authorization', () => {
    const input = { runsByInning: [0, 1, 2], errors: 1, hitsOverride: null };

    it('lets a team manager write their own side as authoritative', async () => {
      grantTeamManager(homeTeamId);

      await service.upsertGameLineScore(accountId, seasonId, gameId, 'user-home', { home: input });

      const home = capturedSide(0, 'home');
      expect(home?.enteredByTeamSeasonId).toBe(homeTeamId.toString());
    });

    it('lets the opposing manager provisionally fill an unclaimed side', async () => {
      grantTeamManager(awayTeamId); // away manager...
      scheduleRepositoryMock.findLineScore.mockResolvedValue(null); // home side unclaimed

      await service.upsertGameLineScore(accountId, seasonId, gameId, 'user-away', { home: input });

      // ...writes the home side, but attributed to the away team (not authoritative).
      const home = capturedSide(0, 'home');
      expect(home?.enteredByTeamSeasonId).toBe(awayTeamId.toString());
    });

    it('blocks the opposing manager once the owning team has claimed the side', async () => {
      grantTeamManager(awayTeamId);
      scheduleRepositoryMock.findLineScore.mockResolvedValue(
        makeRow(sideJson({ enteredByTeamSeasonId: homeTeamId.toString() }), null), // home claimed it
      );

      await expect(
        service.upsertGameLineScore(accountId, seasonId, gameId, 'user-away', { home: input }),
      ).rejects.toBeInstanceOf(AuthorizationError);
      expect(scheduleRepositoryMock.upsertLineScoreSides).not.toHaveBeenCalled();
    });

    it('rejects a user who manages neither team', async () => {
      grantTeamManager(999n); // manages some other team

      await expect(
        service.upsertGameLineScore(accountId, seasonId, gameId, 'user-none', { home: input }),
      ).rejects.toBeInstanceOf(AuthorizationError);
      expect(scheduleRepositoryMock.upsertLineScoreSides).not.toHaveBeenCalled();
    });

    it('lets an administrator write either side authoritatively', async () => {
      roleServiceMock.getUserRoles.mockResolvedValue(administratorRoles);

      await service.upsertGameLineScore(accountId, seasonId, gameId, 'user-admin', {
        home: input,
        away: input,
      });

      expect(capturedSide(0, 'home')?.enteredByTeamSeasonId).toBe(homeTeamId.toString());
      expect(capturedSide(0, 'away')?.enteredByTeamSeasonId).toBe(awayTeamId.toString());
    });
  });
});
