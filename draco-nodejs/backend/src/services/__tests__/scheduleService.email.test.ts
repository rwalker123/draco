import { describe, it, expect, beforeEach, afterEach, vi, type Mocked } from 'vitest';

vi.mock('../../utils/frontendBaseUrl.js', () => ({
  getFrontendBaseUrlOrFallback: vi.fn().mockReturnValue('https://test.example.com'),
  resolveAccountFrontendBaseUrl: vi.fn().mockResolvedValue('https://test.example.com'),
}));

import { ScheduleService } from '../scheduleService.js';
import { ServiceFactory } from '../serviceFactory.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../../repositories/interfaces/IScheduleRepository.js';
import type { EmailService } from '../emailService.js';
import type { RosterService } from '../rosterService.js';
import type { AccountsService } from '../accountsService.js';
import type { AccountSettingsService } from '../accountSettingsService.js';
import type { DiscordIntegrationService } from '../discordIntegrationService.js';
import type { TwitterIntegrationService } from '../twitterIntegrationService.js';
import type { BlueskyIntegrationService } from '../blueskyIntegrationService.js';
import type { FacebookIntegrationService } from '../facebookIntegrationService.js';
import type { dbScheduleGameWithDetails } from '../../repositories/types/index.js';

const makeGame = (overrides: Partial<dbScheduleGameWithDetails> = {}): dbScheduleGameWithDetails =>
  ({
    id: 1n,
    leagueid: 10n,
    hteamid: 100n,
    vteamid: 200n,
    gamedate: new Date('2025-06-15T19:00:00Z'),
    fieldid: null,
    gamestatus: 0,
    gametype: 0,
    hscore: 0,
    vscore: 0,
    comment: '',
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    availablefields: null,
    leagueseason: {
      id: 10n,
      seasonid: 5n,
      leagueid: 1n,
      league: {
        id: 1n,
        name: 'Summer League',
        accountid: 99n,
        divisiondefs: [],
        scheduler: false,
        sport: 0,
        teamsperleague: 0,
        leaguetype: 0,
        inactive: false,
        teamlimit: 0,
        divisionlimit: 0,
      },
      season: {
        id: 5n,
        name: '2025 Season',
        accountid: 99n,
        schedulevisible: true,
      },
    },
    _count: { gamerecap: 0 },
    ...overrides,
  }) as dbScheduleGameWithDetails;

const makeGameForAccount = (overrides: Partial<dbScheduleGameWithDetails> = {}) => ({
  id: 1n,
  leagueid: 10n,
  hteamid: 100n,
  vteamid: 200n,
  gamedate: new Date('2025-06-15T19:00:00Z'),
  fieldid: null,
  gamestatus: 0,
  gametype: 0,
  hscore: 0,
  vscore: 0,
  comment: '',
  umpire1: null,
  umpire2: null,
  umpire3: null,
  umpire4: null,
  leagueseason: {
    id: 10n,
    seasonid: 5n,
    leagueid: 1n,
    league: {
      id: 1n,
      name: 'Summer League',
      accountid: 99n,
    },
    season: {
      id: 5n,
      name: '2025 Season',
      accountid: 99n,
      schedulevisible: true,
    },
  },
  ...overrides,
});

describe('ScheduleService — schedule change emails', () => {
  let scheduleRepositoryMock: Mocked<IScheduleRepository>;
  let emailServiceMock: Mocked<EmailService>;
  let rosterServiceMock: Mocked<RosterService>;
  let accountsServiceMock: Mocked<AccountsService>;
  let accountSettingsServiceMock: Mocked<AccountSettingsService>;
  let discordMock: Mocked<DiscordIntegrationService>;
  let twitterMock: Mocked<TwitterIntegrationService>;
  let blueskyMock: Mocked<BlueskyIntegrationService>;
  let facebookMock: Mocked<FacebookIntegrationService>;
  let service: ScheduleService;

  const accountId = 99n;
  const seasonId = 5n;
  const userId = 'user-abc';

  const rosterWithTwoMembers = {
    rosterMembers: [
      {
        inactive: false,
        player: {
          contact: { id: '10', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
        },
      },
      {
        inactive: false,
        player: {
          contact: { id: '11', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
        },
      },
    ],
  };

  const emptyRoster = { rosterMembers: [] };

  beforeEach(() => {
    scheduleRepositoryMock = {
      findGameWithAccountContext: vi.fn(),
      findGameWithDetails: vi.fn(),
      createGame: vi.fn(),
      updateGame: vi.fn(),
      updateGameResults: vi.fn(),
      deleteGame: vi.fn(),
      listSeasonGames: vi.fn(),
      countSeasonGames: vi.fn(),
      findTeamsInLeagueSeason: vi.fn(),
      findFieldConflict: vi.fn(),
      findRecap: vi.fn(),
      upsertRecap: vi.fn(),
      getTeamNames: vi.fn(),
      listUpcomingGamesForTeam: vi.fn(),
      listRecentGamesForTeam: vi.fn(),
      listAllGamesForTeam: vi.fn(),
      getTeamScheduleFingerprint: vi.fn(),
      findTeamSeasonCalendarContext: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      countFieldBookingsAtTime: vi.fn(),
      countTeamBookingsAtTime: vi.fn(),
      countUmpireBookingsAtTime: vi.fn(),
      countTeamGamesInRange: vi.fn(),
      countUmpireGamesInRange: vi.fn(),
      countUmpireAssignmentsForAccount: vi.fn(),
    } as unknown as Mocked<IScheduleRepository>;

    emailServiceMock = {
      composeAndSendEmailFromUser: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<EmailService>;

    rosterServiceMock = {
      getTeamRosterMembers: vi.fn().mockResolvedValue(rosterWithTwoMembers),
    } as unknown as Mocked<RosterService>;

    accountsServiceMock = {
      getAccountHeader: vi.fn().mockResolvedValue({ id: '99', name: 'Test League' }),
    } as unknown as Mocked<AccountsService>;

    accountSettingsServiceMock = {
      getAccountSettings: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<AccountSettingsService>;

    discordMock = { publishGameResult: vi.fn() } as unknown as Mocked<DiscordIntegrationService>;
    twitterMock = { publishGameResult: vi.fn() } as unknown as Mocked<TwitterIntegrationService>;
    blueskyMock = { publishGameResult: vi.fn() } as unknown as Mocked<BlueskyIntegrationService>;
    facebookMock = { publishGameResult: vi.fn() } as unknown as Mocked<FacebookIntegrationService>;

    vi.spyOn(RepositoryFactory, 'getScheduleRepository').mockReturnValue(scheduleRepositoryMock);
    vi.spyOn(ServiceFactory, 'getEmailService').mockReturnValue(emailServiceMock);
    vi.spyOn(ServiceFactory, 'getRosterService').mockReturnValue(rosterServiceMock);
    vi.spyOn(ServiceFactory, 'getAccountsService').mockReturnValue(accountsServiceMock);
    vi.spyOn(ServiceFactory, 'getAccountSettingsService').mockReturnValue(
      accountSettingsServiceMock,
    );
    vi.spyOn(ServiceFactory, 'getDiscordIntegrationService').mockReturnValue(discordMock);
    vi.spyOn(ServiceFactory, 'getTwitterIntegrationService').mockReturnValue(twitterMock);
    vi.spyOn(ServiceFactory, 'getBlueskyIntegrationService').mockReturnValue(blueskyMock);
    vi.spyOn(ServiceFactory, 'getFacebookIntegrationService').mockReturnValue(facebookMock);

    scheduleRepositoryMock.getTeamNames.mockResolvedValue(
      new Map([
        ['100', 'Home Team'],
        ['200', 'Visitor Team'],
      ]),
    );

    service = new ScheduleService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseCreatePayload = {
    leagueSeasonId: '10',
    gameDate: '2025-06-15T19:00:00Z',
    homeTeam: { id: '100' },
    visitorTeam: { id: '200' },
    field: null,
    comment: '',
    gameStatus: 0,
    gameType: 0,
  };

  const baseUpdatePayload = {
    ...baseCreatePayload,
    gameStatus: 0,
  };

  describe('createGame', () => {
    beforeEach(() => {
      scheduleRepositoryMock.findTeamsInLeagueSeason.mockResolvedValue([
        { id: 100n } as never,
        { id: 200n } as never,
      ]);
      scheduleRepositoryMock.createGame.mockResolvedValue(makeGame());
    });

    it('does not send email when notifyTeams is false', async () => {
      await service.createGame(
        accountId,
        seasonId,
        { ...baseCreatePayload, notifyTeams: false },
        userId,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('does not send email when notifyTeams is omitted', async () => {
      await service.createGame(accountId, seasonId, baseCreatePayload, userId);

      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('sends email when notifyTeams is true', async () => {
      await service.createGame(
        accountId,
        seasonId,
        { ...baseCreatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });

      const [calledAccountId, calledUserId, emailRequest] =
        emailServiceMock.composeAndSendEmailFromUser.mock.calls[0];
      expect(calledAccountId).toBe(accountId);
      expect(calledUserId).toBe(userId);
      expect(emailRequest.subject).toContain('Schedule Update:');
      expect(emailRequest.subject).toContain('Test League');
      expect(emailRequest.recipients.contacts).toHaveLength(2);
    });

    it('does not send email when schedulevisible is false', async () => {
      scheduleRepositoryMock.createGame.mockResolvedValue(
        makeGame({
          leagueseason: {
            ...makeGame().leagueseason,
            season: { id: 5n, name: '2025 Season', accountid: 99n, schedulevisible: false },
          },
        }),
      );

      await service.createGame(
        accountId,
        seasonId,
        { ...baseCreatePayload, notifyTeams: true },
        userId,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('does not send email when there are no recipients', async () => {
      rosterServiceMock.getTeamRosterMembers.mockResolvedValue(emptyRoster as never);

      await service.createGame(
        accountId,
        seasonId,
        { ...baseCreatePayload, notifyTeams: true },
        userId,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('uses Schedule Update prefix for a scheduled game', async () => {
      await service.createGame(
        accountId,
        seasonId,
        { ...baseCreatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });

      const [, , emailRequest] = emailServiceMock.composeAndSendEmailFromUser.mock.calls[0];
      expect(emailRequest.subject).toMatch(/^Schedule Update:/);
    });

    it('uses CANCELLED prefix for a Rainout game', async () => {
      scheduleRepositoryMock.createGame.mockResolvedValue(makeGame({ gamestatus: 2 }));

      await service.createGame(
        accountId,
        seasonId,
        { ...baseCreatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });

      const [, , emailRequest] = emailServiceMock.composeAndSendEmailFromUser.mock.calls[0];
      expect(emailRequest.subject).toMatch(/^CANCELLED:/);
    });
  });

  describe('updateGame', () => {
    const gameId = 1n;

    const existingGame = makeGameForAccount({
      id: gameId,
      gamedate: new Date('2025-06-10T19:00:00Z'),
      fieldid: null,
      gamestatus: 0,
      hteamid: 100n,
      vteamid: 200n,
    });

    beforeEach(() => {
      scheduleRepositoryMock.findGameWithAccountContext.mockResolvedValue(existingGame as never);
      scheduleRepositoryMock.findTeamsInLeagueSeason.mockResolvedValue([
        { id: 100n } as never,
        { id: 200n } as never,
      ]);
    });

    it('does not send email when notifyTeams is false', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(
        makeGame({ gamedate: new Date('2025-06-20T19:00:00Z') }),
      );

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: false },
        userId,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('does not send email when no material field changed', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(
        makeGame({
          gamedate: existingGame.gamedate,
          fieldid: existingGame.fieldid,
          gamestatus: existingGame.gamestatus,
          hteamid: existingGame.hteamid,
          vteamid: existingGame.vteamid,
        }),
      );

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('sends email when gamedate changed', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(
        makeGame({ gamedate: new Date('2025-06-20T19:00:00Z') }),
      );

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });
    });

    it('sends email when gamestatus changed', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(makeGame({ gamestatus: 2 }));

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });
    });

    it('includes old and new home team recipients when hteamid changed', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(makeGame({ hteamid: 300n }));
      scheduleRepositoryMock.getTeamNames.mockResolvedValue(
        new Map([
          ['100', 'Old Home Team'],
          ['200', 'Visitor Team'],
          ['300', 'New Home Team'],
        ]),
      );

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(rosterServiceMock.getTeamRosterMembers).toHaveBeenCalled();
      });

      const calledTeamIds = rosterServiceMock.getTeamRosterMembers.mock.calls.map(
        (call) => call[0],
      );
      expect(calledTeamIds).toContain(100n);
      expect(calledTeamIds).toContain(300n);
      expect(calledTeamIds).toContain(200n);
    });

    it('does not send email when schedulevisible is false', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(
        makeGame({
          gamedate: new Date('2025-06-20T19:00:00Z'),
          leagueseason: {
            ...makeGame().leagueseason,
            season: { id: 5n, name: '2025 Season', accountid: 99n, schedulevisible: false },
          },
        }),
      );

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(emailServiceMock.composeAndSendEmailFromUser).not.toHaveBeenCalled();
    });

    it('uses POSTPONED prefix when status changed from Postponed to Rainout', async () => {
      const existingPostponedGame = makeGameForAccount({ gamestatus: 3 });
      scheduleRepositoryMock.findGameWithAccountContext.mockResolvedValue(
        existingPostponedGame as never,
      );
      scheduleRepositoryMock.updateGame.mockResolvedValue(makeGame({ gamestatus: 2 }));

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });

      const [, , emailRequest] = emailServiceMock.composeAndSendEmailFromUser.mock.calls[0];
      expect(emailRequest.subject).toMatch(/^POSTPONED:/);
    });

    it('uses CANCELLED prefix when directly set to Rainout from non-Postponed', async () => {
      scheduleRepositoryMock.updateGame.mockResolvedValue(makeGame({ gamestatus: 2 }));

      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, notifyTeams: true },
        userId,
      );

      await vi.waitFor(() => {
        expect(emailServiceMock.composeAndSendEmailFromUser).toHaveBeenCalledTimes(1);
      });

      const [, , emailRequest] = emailServiceMock.composeAndSendEmailFromUser.mock.calls[0];
      expect(emailRequest.subject).toMatch(/^CANCELLED:/);
    });
  });

  describe('getTeamRecipientCount', () => {
    it('returns deduplicated count of recipients across teams', async () => {
      rosterServiceMock.getTeamRosterMembers.mockResolvedValue(rosterWithTwoMembers as never);

      const result = await service.getTeamRecipientCount(accountId, seasonId, [100n]);
      expect(result.count).toBe(2);
    });

    it('deduplicates contacts that appear on multiple teams', async () => {
      const sharedRoster = {
        rosterMembers: [
          {
            inactive: false,
            player: {
              contact: {
                id: '10',
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice@example.com',
              },
            },
          },
        ],
      };

      rosterServiceMock.getTeamRosterMembers.mockResolvedValue(sharedRoster as never);

      const result = await service.getTeamRecipientCount(accountId, seasonId, [100n, 200n]);
      expect(result.count).toBe(1);
    });

    it('returns 0 when teams have no active members with emails', async () => {
      rosterServiceMock.getTeamRosterMembers.mockResolvedValue(emptyRoster as never);

      const result = await service.getTeamRecipientCount(accountId, seasonId, [100n]);
      expect(result.count).toBe(0);
    });
  });
});
