import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getCurrentSeason,
  getSeasonParticipantCount,
  listSeasonLeagueSeasons,
  listSeasonTeams,
  listSeasonManagers,
  getTeamRosterMembers,
  searchContacts as apiSearchContacts,
  getGroupContacts as apiGetGroupContacts,
} from '@draco/shared-api-client';
import { EmailRecipientService } from '../emailRecipientService';

vi.mock('@draco/shared-api-client', () => ({
  getCurrentSeason: vi.fn(),
  getSeasonParticipantCount: vi.fn(),
  listSeasonLeagueSeasons: vi.fn(),
  listSeasonTeams: vi.fn(),
  listSeasonManagers: vi.fn(),
  getTeamRosterMembers: vi.fn(),
  searchContacts: vi.fn(),
  getGroupContacts: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('../../utils/leagueSeasonMapper', () => ({
  mapLeagueSetup: vi.fn((data) => ({
    leagueSeasons: data ?? [],
    season: null,
  })),
}));

vi.mock('@draco/shared-schemas', () => ({
  ContactSearchParamsSchema: {
    parse: vi.fn((v) => v),
  },
}));

vi.mock('../../utils/errorHandling', () => ({
  handleApiError: vi.fn((_res, data) => new Error(String(data))),
  withRetry: vi.fn((fn) => fn()),
  safeAsync: vi.fn(async (fn, _ctx) => {
    try {
      return { success: true, data: await fn() };
    } catch (err) {
      return { success: false, error: err };
    }
  }),
  logError: vi.fn(),
  createEmailRecipientError: vi.fn((code, message) => ({ code, message, retryable: false })),
}));

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, statusCode = 400) =>
  ({
    data: undefined,
    error: { message, statusCode },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-9';
const SEASON_ID = 'season-1';
const TOKEN = 'tok-123';

describe('EmailRecipientService', () => {
  let service: EmailRecipientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailRecipientService({ enableRetries: false });
  });

  describe('fetchContacts', () => {
    it('returns contacts and pagination from search results', async () => {
      vi.mocked(apiSearchContacts).mockResolvedValue(
        makeOk({
          contacts: [
            { id: 'c-1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
          ],
          pagination: { page: 1, limit: 20, hasNext: false, hasPrev: false },
        }),
      );

      const result = await service.fetchContacts(ACCOUNT_ID, TOKEN, { page: 1, limit: 20 });

      expect(apiSearchContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          throwOnError: false,
        }),
      );
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].id).toBe('c-1');
      expect(result.pagination?.page).toBe(1);
    });

    it('throws when accountId is empty', async () => {
      await expect(service.fetchContacts('', TOKEN)).rejects.toMatchObject({
        code: expect.any(String),
      });
    });
  });

  describe('searchContacts', () => {
    it('returns contacts matching the query', async () => {
      vi.mocked(apiSearchContacts).mockResolvedValue(
        makeOk({
          contacts: [{ id: 'c-2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' }],
          pagination: { page: 1, limit: 10, hasNext: false, hasPrev: false },
        }),
      );

      const result = await service.searchContacts(ACCOUNT_ID, TOKEN, 'Bob');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contacts).toHaveLength(1);
        expect(result.data.contacts[0].id).toBe('c-2');
        expect(result.data.pagination?.page).toBe(1);
      }
    });

    it('returns failure result when accountId is empty', async () => {
      const result = await service.searchContacts('', TOKEN, 'query');
      expect(result.success).toBe(false);
    });

    it('returns failure result when query is empty', async () => {
      const result = await service.searchContacts(ACCOUNT_ID, TOKEN, '');
      expect(result.success).toBe(false);
    });
  });

  describe('fetchCurrentSeason', () => {
    it('returns the current season', async () => {
      vi.mocked(getCurrentSeason).mockResolvedValue(
        makeOk({ id: SEASON_ID, name: 'Spring 2026', accountId: ACCOUNT_ID }),
      );

      const result = await service.fetchCurrentSeason(ACCOUNT_ID, TOKEN);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(SEASON_ID);
        expect(result.data?.name).toBe('Spring 2026');
      }
    });

    it('returns failure result when accountId is empty', async () => {
      const result = await service.fetchCurrentSeason('', TOKEN);
      expect(result.success).toBe(false);
    });

    it('returns failure result when API errors', async () => {
      vi.mocked(getCurrentSeason).mockResolvedValue(makeError('Server error', 500));
      const result = await service.fetchCurrentSeason(ACCOUNT_ID, TOKEN);
      expect(result.success).toBe(false);
    });
  });

  describe('fetchTeams', () => {
    it('returns mapped teams for a season', async () => {
      vi.mocked(listSeasonTeams).mockResolvedValue(
        makeOk([
          {
            id: 'ts-1',
            name: 'Eagles',
            team: {
              id: 'team-1',
              webAddress: null,
              youtubeUserId: null,
              defaultVideo: null,
              autoPlayVideo: false,
            },
            league: { id: 'lg-1', name: 'Major' },
            division: { id: 'div-1', name: 'East' },
          },
        ]),
      );

      const result = await service.fetchTeams(ACCOUNT_ID, TOKEN, SEASON_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Eagles');
        expect(result.data[0].leagueId).toBe('lg-1');
        expect(result.data[0].divisionName).toBe('East');
      }
    });

    it('returns failure when seasonId is empty', async () => {
      const result = await service.fetchTeams(ACCOUNT_ID, TOKEN, '');
      expect(result.success).toBe(false);
    });

    it('returns failure when accountId is empty', async () => {
      const result = await service.fetchTeams('', TOKEN, SEASON_ID);
      expect(result.success).toBe(false);
    });
  });

  describe('fetchTeamRoster', () => {
    it('returns mapped contacts from roster members', async () => {
      vi.mocked(getTeamRosterMembers).mockResolvedValue(
        makeOk({
          rosterMembers: [
            {
              player: {
                contact: {
                  id: 'c-r1',
                  firstName: 'Player',
                  lastName: 'One',
                  email: 'p1@example.com',
                },
              },
            },
          ],
        }),
      );

      const result = await service.fetchTeamRoster(ACCOUNT_ID, TOKEN, SEASON_ID, 'ts-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('c-r1');
        expect(result.data[0].firstName).toBe('Player');
      }
    });

    it('filters out roster members without a player contact', async () => {
      vi.mocked(getTeamRosterMembers).mockResolvedValue(
        makeOk({
          rosterMembers: [{ player: null }, { player: { contact: null } }],
        }),
      );

      const result = await service.fetchTeamRoster(ACCOUNT_ID, TOKEN, SEASON_ID, 'ts-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('returns failure when token is missing', async () => {
      const result = await service.fetchTeamRoster(ACCOUNT_ID, null, SEASON_ID, 'ts-1');
      expect(result.success).toBe(false);
    });
  });

  describe('fetchTeamManagers', () => {
    it('returns managers filtered to the specified team', async () => {
      vi.mocked(listSeasonManagers).mockResolvedValue(
        makeOk({
          managers: [
            {
              contact: {
                id: 'mgr-1',
                firstName: 'Coach',
                lastName: 'Ray',
                email: 'coach@example.com',
                contactDetails: null,
              },
              allTeams: [{ id: 'ts-1' }, { id: 'ts-9' }],
            },
            {
              contact: {
                id: 'mgr-2',
                firstName: 'Other',
                lastName: 'Guy',
                email: 'other@example.com',
                contactDetails: null,
              },
              allTeams: [{ id: 'ts-9' }],
            },
          ],
        }),
      );

      const result = await service.fetchTeamManagers(ACCOUNT_ID, TOKEN, SEASON_ID, 'ts-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('mgr-1');
      }
    });
  });

  describe('fetchLeagues', () => {
    it('returns mapped league seasons', async () => {
      const leagueData = [{ id: 'ls-1', name: 'Spring League' }];
      vi.mocked(listSeasonLeagueSeasons).mockResolvedValue(makeOk(leagueData));

      const result = await service.fetchLeagues(ACCOUNT_ID, TOKEN, SEASON_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(leagueData);
      }
    });

    it('returns failure when accountId is empty', async () => {
      const result = await service.fetchLeagues('', TOKEN, SEASON_ID);
      expect(result.success).toBe(false);
    });

    it('returns failure when seasonId is empty', async () => {
      const result = await service.fetchLeagues(ACCOUNT_ID, TOKEN, '');
      expect(result.success).toBe(false);
    });

    it('returns failure when token is missing', async () => {
      const result = await service.fetchLeagues(ACCOUNT_ID, null, SEASON_ID);
      expect(result.success).toBe(false);
    });
  });

  describe('fetchSeasonParticipantsCount', () => {
    it('returns the participant count', async () => {
      vi.mocked(getSeasonParticipantCount).mockResolvedValue(makeOk({ participantCount: 42 }));

      const result = await service.fetchSeasonParticipantsCount(ACCOUNT_ID, TOKEN, SEASON_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('returns failure when participantCount is not a number', async () => {
      vi.mocked(getSeasonParticipantCount).mockResolvedValue(makeOk({ participantCount: null }));

      const result = await service.fetchSeasonParticipantsCount(ACCOUNT_ID, TOKEN, SEASON_ID);
      expect(result.success).toBe(false);
    });

    it('returns failure when accountId is empty', async () => {
      const result = await service.fetchSeasonParticipantsCount('', TOKEN, SEASON_ID);
      expect(result.success).toBe(false);
    });

    it('returns failure when seasonId is empty', async () => {
      const result = await service.fetchSeasonParticipantsCount(ACCOUNT_ID, TOKEN, '');
      expect(result.success).toBe(false);
    });
  });

  describe('getRecipientData', () => {
    it('returns contacts and current season', async () => {
      vi.mocked(getCurrentSeason).mockResolvedValue(
        makeOk({ id: SEASON_ID, name: 'Spring 2026', accountId: ACCOUNT_ID }),
      );
      vi.mocked(apiSearchContacts).mockResolvedValue(
        makeOk({
          contacts: [{ id: 'c-1', firstName: 'Alice', lastName: 'Doe', email: 'a@example.com' }],
          pagination: { page: 1, limit: 50, hasNext: false, hasPrev: false },
        }),
      );

      const result = await service.getRecipientData(ACCOUNT_ID, TOKEN);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contacts).toHaveLength(1);
        expect(result.data.contacts[0].displayName).toBe('Alice Doe');
        expect(result.data.contacts[0].hasValidEmail).toBe(true);
        expect(result.data.currentSeason?.id).toBe(SEASON_ID);
      }
    });

    it('returns failure when accountId is empty', async () => {
      const result = await service.getRecipientData('', TOKEN);
      expect(result.success).toBe(false);
    });

    it('returns failure when token is empty', async () => {
      const result = await service.getRecipientData(ACCOUNT_ID, '');
      expect(result.success).toBe(false);
    });

    it('uses the provided seasonId instead of fetching current season', async () => {
      vi.mocked(apiSearchContacts).mockResolvedValue(makeOk({ contacts: [], pagination: null }));

      await service.getRecipientData(ACCOUNT_ID, TOKEN, SEASON_ID);

      expect(getCurrentSeason).not.toHaveBeenCalled();
    });
  });

  describe('fetchGroupContacts', () => {
    it('returns group contacts', async () => {
      vi.mocked(apiGetGroupContacts).mockResolvedValue(
        makeOk({
          contacts: [
            {
              id: 'gc-1',
              firstName: 'Group',
              lastName: 'Member',
              email: 'gm@example.com',
              hasValidEmail: true,
              isManager: false,
            },
          ],
        }),
      );

      const result = await service.fetchGroupContacts(
        ACCOUNT_ID,
        TOKEN,
        SEASON_ID,
        'team',
        'ts-1',
        false,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('gc-1');
      }
    });

    it('returns failure when accountId is empty', async () => {
      const result = await service.fetchGroupContacts('', TOKEN, SEASON_ID, 'team', 'ts-1', false);
      expect(result.success).toBe(false);
    });

    it('returns failure when seasonId is empty', async () => {
      const result = await service.fetchGroupContacts(ACCOUNT_ID, TOKEN, '', 'team', 'ts-1', false);
      expect(result.success).toBe(false);
    });

    it('returns failure when groupId is empty', async () => {
      const result = await service.fetchGroupContacts(
        ACCOUNT_ID,
        TOKEN,
        SEASON_ID,
        'team',
        '',
        false,
      );
      expect(result.success).toBe(false);
    });

    it('returns failure when token is missing', async () => {
      const result = await service.fetchGroupContacts(
        ACCOUNT_ID,
        null,
        SEASON_ID,
        'team',
        'ts-1',
        false,
      );
      expect(result.success).toBe(false);
    });
  });
});
