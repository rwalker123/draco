import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfRosterService } from '../golfRosterService.js';
import {
  type IGolfRosterRepository,
  type GolfRosterWithGolfer,
  type GolfLeagueSubWithGolfer,
} from '../../repositories/index.js';
import {
  type IGolfTeamRepository,
  type GolfTeamWithFlight,
} from '../../repositories/interfaces/IGolfTeamRepository.js';
import { type IGolfFlightRepository } from '../../repositories/interfaces/IGolfFlightRepository.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type { golfroster, golfer, golfleaguesub, contacts, teams, league } from '#prisma/client';

function createMockContact(overrides: Partial<contacts> = {}): contacts {
  return {
    id: 1n,
    accountid: 100n,
    firstname: 'John',
    lastname: 'Doe',
    middlename: null,
    email: 'john@example.com',
    gender: null,
    dob: null,
    address: null,
    address2: null,
    city: null,
    state: null,
    zip: null,
    country: null,
    phone: null,
    phone2: null,
    workphone: null,
    fax: null,
    created: new Date(),
    modified: new Date(),
    modifiedby: null,
    notes: null,
    shirt: null,
    inseam: null,
    bats: null,
    throws: null,
    yearsexp: null,
    lastupdated: null,
    positionsplayed: null,
    preferredpositions: null,
    deletedby: null,
    deletedat: null,
    ...overrides,
  } as contacts;
}

function createMockGolfer(overrides: Partial<golfer> = {}): golfer {
  return {
    id: 10n,
    contactid: 1n,
    initialdifferential: null,
    ...overrides,
  } as golfer;
}

function createMockRosterEntry(
  overrides: Partial<GolfRosterWithGolfer> = {},
): GolfRosterWithGolfer {
  const contact = createMockContact({ id: 1n });
  const golferRecord = createMockGolfer({ id: 10n, contactid: 1n });
  return {
    id: 100n,
    golferid: 10n,
    teamseasonid: 50n,
    isactive: true,
    golfer: {
      ...golferRecord,
      contact,
    },
    ...overrides,
  } as GolfRosterWithGolfer;
}

function createMockLeagueSub(overrides: Partial<golfleaguesub> = {}): golfleaguesub {
  return {
    id: 200n,
    golferid: 10n,
    leagueseasonid: 1n,
    isactive: true,
    ...overrides,
  } as golfleaguesub;
}

function createMockLeagueSubWithGolfer(
  overrides: Partial<GolfLeagueSubWithGolfer> = {},
): GolfLeagueSubWithGolfer {
  const contact = createMockContact({ id: 1n });
  const golferRecord = createMockGolfer({ id: 10n, contactid: 1n });
  return {
    id: 200n,
    golferid: 10n,
    leagueseasonid: 1n,
    isactive: true,
    golfer: {
      ...golferRecord,
      contact,
    },
    ...overrides,
  } as GolfLeagueSubWithGolfer;
}

function createMockLeague(overrides: Partial<league> = {}): league {
  return {
    id: 1n,
    accountid: 100n,
    name: 'Test League',
    ...overrides,
  } as league;
}

function createMockTeams(overrides: Partial<teams> = {}): teams {
  return {
    id: 5n,
    accountid: 100n,
    createdby: 1n,
    contact: null,
    ...overrides,
  } as teams;
}

function createMockTeamWithFlight(overrides: Partial<GolfTeamWithFlight> = {}): GolfTeamWithFlight {
  return {
    id: 50n,
    teamid: 5n,
    leagueseasonid: 1n,
    name: 'Team Alpha',
    divisionseasonid: null,
    teams: createMockTeams(),
    leagueseason: {
      id: 1n,
      league: createMockLeague(),
    },
    _count: {
      golfroster: 2,
    },
    ...overrides,
  } as GolfTeamWithFlight;
}

function buildStubRosterRepository(
  overrides: Partial<IGolfRosterRepository>,
): IGolfRosterRepository {
  return {
    async findByTeamSeasonId() {
      return [];
    },
    async findById() {
      return null;
    },
    async findByIds() {
      return [];
    },
    async findByGolferAndTeam() {
      return null;
    },
    async findSubstitutesForLeague() {
      return [];
    },
    async findGolferByContactId() {
      return null;
    },
    async findGolfersByIds() {
      return [];
    },
    async findOrCreateGolfer() {
      return createMockGolfer();
    },
    async createRosterEntry() {
      return {} as golfroster;
    },
    async createLeagueSub() {
      return createMockLeagueSub();
    },
    async updateRosterEntry() {
      return {} as golfroster;
    },
    async updateGolfer() {
      return createMockGolfer();
    },
    async updateLeagueSub() {
      return createMockLeagueSub();
    },
    async deleteRosterEntry() {
      return {} as golfroster;
    },
    async deleteLeagueSub() {
      return createMockLeagueSub();
    },
    async findAvailableContacts() {
      return [];
    },
    async contactExistsInAccount() {
      return true;
    },
    async createContact() {
      return createMockContact();
    },
    async hasMatchScores() {
      return false;
    },
    async findLeagueSubById() {
      return null;
    },
    async findLeagueSubByGolferAndSeason() {
      return null;
    },
    async findLeagueSubByGolferAndLeagueSeason() {
      return null;
    },
    async leagueSeasonExists() {
      return true;
    },
    async moveSubToRoster() {
      return createMockRosterEntry();
    },
    async moveRosterToSub() {
      return;
    },
    ...overrides,
  };
}

function buildStubTeamRepository(overrides: Partial<IGolfTeamRepository>): IGolfTeamRepository {
  return {
    async findBySeasonId() {
      return [];
    },
    async findByFlightId() {
      return [];
    },
    async findById() {
      return null;
    },
    async findByIdWithRoster() {
      return null;
    },
    async create() {
      return {} as never;
    },
    async update() {
      return {} as never;
    },
    async delete() {
      return {} as never;
    },
    async hasMatches() {
      return false;
    },
    async hasRosterEntries() {
      return false;
    },
    async findByTeamAndLeagueSeason() {
      return null;
    },
    ...overrides,
  };
}

function buildStubFlightRepository(
  overrides: Partial<IGolfFlightRepository>,
): IGolfFlightRepository {
  return {
    async findBySeasonId() {
      return [];
    },
    async findById() {
      return null;
    },
    async create() {
      return {} as never;
    },
    async update() {
      return {} as never;
    },
    async delete() {
      return;
    },
    async getPlayerCountForFlight() {
      return 0;
    },
    async flightNameExistsInSeason() {
      return false;
    },
    async seasonHasFlights() {
      return true;
    },
    async findByLeagueAndSeason() {
      return null;
    },
    ...overrides,
  };
}

describe('GolfRosterService', () => {
  describe('releasePlayer', () => {
    let rosterEntries: GolfRosterWithGolfer[];
    let leagueSubs: golfleaguesub[];
    let teamList: GolfTeamWithFlight[];
    let seasonHasFlightsResult: boolean;
    let moveRosterToSubSpy: ReturnType<typeof vi.fn<IGolfRosterRepository['moveRosterToSub']>>;
    let deleteRosterEntrySpy: ReturnType<typeof vi.fn<IGolfRosterRepository['deleteRosterEntry']>>;
    let service: GolfRosterService;

    beforeEach(() => {
      rosterEntries = [createMockRosterEntry({ id: 100n, golferid: 10n, teamseasonid: 50n })];

      leagueSubs = [];
      teamList = [createMockTeamWithFlight({ id: 50n, leagueseasonid: 1n })];
      seasonHasFlightsResult = true;

      moveRosterToSubSpy = vi
        .fn<IGolfRosterRepository['moveRosterToSub']>()
        .mockResolvedValue(undefined);
      deleteRosterEntrySpy = vi
        .fn<IGolfRosterRepository['deleteRosterEntry']>()
        .mockImplementation(async (rosterId: bigint) => {
          const index = rosterEntries.findIndex((r) => r.id === rosterId);
          const entry = rosterEntries[index];
          rosterEntries.splice(index, 1);
          return entry;
        });

      const rosterRepository = buildStubRosterRepository({
        async findById(rosterId: bigint) {
          return rosterEntries.find((r) => r.id === rosterId) ?? null;
        },
        async findLeagueSubByGolferAndLeagueSeason(golferId: bigint, leagueSeasonId: bigint) {
          return (
            leagueSubs.find(
              (s) => s.golferid === golferId && s.leagueseasonid === leagueSeasonId,
            ) ?? null
          );
        },
        moveRosterToSub: moveRosterToSubSpy,
        deleteRosterEntry: deleteRosterEntrySpy,
      });

      const teamRepository = buildStubTeamRepository({
        async findById(teamSeasonId: bigint) {
          return teamList.find((t) => t.id === teamSeasonId) ?? null;
        },
      });

      const flightRepository = buildStubFlightRepository({
        async seasonHasFlights() {
          return seasonHasFlightsResult;
        },
      });

      service = new GolfRosterService(rosterRepository, teamRepository, flightRepository);
    });

    it('deletes roster entry when releaseAsSub is false', async () => {
      await service.releasePlayer(100n, 1n, { releaseAsSub: false });

      expect(deleteRosterEntrySpy).toHaveBeenCalledWith(100n);
      expect(moveRosterToSubSpy).not.toHaveBeenCalled();
    });

    it('moves roster to sub when releaseAsSub is true and no existing sub exists', async () => {
      await service.releasePlayer(100n, 1n, { releaseAsSub: true });

      expect(moveRosterToSubSpy).toHaveBeenCalledWith(100n, null, {
        golferid: 10n,
        leagueseasonid: 1n,
        isactive: true,
      });
      expect(deleteRosterEntrySpy).not.toHaveBeenCalled();
    });

    it('moves roster to sub reusing existing sub when one exists for the same leagueSeasonId', async () => {
      leagueSubs.push(createMockLeagueSub({ id: 300n, golferid: 10n, leagueseasonid: 1n }));

      await service.releasePlayer(100n, 1n, { releaseAsSub: true });

      expect(moveRosterToSubSpy).toHaveBeenCalledWith(100n, 300n, {
        golferid: 10n,
        leagueseasonid: 1n,
        isactive: true,
      });
    });

    it('passes null as existingSubId when the only existing sub belongs to a different leagueSeasonId', async () => {
      leagueSubs.push(createMockLeagueSub({ id: 400n, golferid: 10n, leagueseasonid: 99n }));

      await service.releasePlayer(100n, 1n, { releaseAsSub: true });

      expect(moveRosterToSubSpy).toHaveBeenCalledWith(100n, null, {
        golferid: 10n,
        leagueseasonid: 1n,
        isactive: true,
      });
    });

    it('throws NotFoundError when roster entry not found', async () => {
      await expect(service.releasePlayer(999n, 1n, { releaseAsSub: false })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when season has no flights', async () => {
      seasonHasFlightsResult = false;

      await expect(service.releasePlayer(100n, 1n, { releaseAsSub: true })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when team not found', async () => {
      teamList = [];

      await expect(service.releasePlayer(100n, 1n, { releaseAsSub: true })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('signSubstitute', () => {
    let leagueSubs: golfleaguesub[];
    let golfers: golfer[];
    let leagueSeasonExistsResult: boolean;
    let contactExistsResult: boolean;
    let createLeagueSubSpy: ReturnType<typeof vi.fn<IGolfRosterRepository['createLeagueSub']>>;
    let updateLeagueSubSpy: ReturnType<typeof vi.fn<IGolfRosterRepository['updateLeagueSub']>>;
    let service: GolfRosterService;

    beforeEach(() => {
      leagueSubs = [];
      golfers = [];
      leagueSeasonExistsResult = true;
      contactExistsResult = true;

      createLeagueSubSpy = vi
        .fn<IGolfRosterRepository['createLeagueSub']>()
        .mockImplementation(async (data) => {
          const sub = createMockLeagueSub({ id: 200n, ...data });
          leagueSubs.push(sub);
          return sub;
        });

      updateLeagueSubSpy = vi
        .fn<IGolfRosterRepository['updateLeagueSub']>()
        .mockImplementation(async (subId, data) => {
          const index = leagueSubs.findIndex((s) => s.id === subId);
          leagueSubs[index] = { ...leagueSubs[index], ...data };
          return leagueSubs[index];
        });

      const rosterRepository = buildStubRosterRepository({
        async leagueSeasonExists() {
          return leagueSeasonExistsResult;
        },
        async contactExistsInAccount() {
          return contactExistsResult;
        },
        async findOrCreateGolfer(contactId: bigint, initialDifferential?: number | null) {
          const existing = golfers.find((g) => g.contactid === contactId);
          if (existing) return existing;
          const newGolfer = createMockGolfer({
            id: 10n,
            contactid: contactId,
            initialdifferential: initialDifferential ?? null,
          });
          golfers.push(newGolfer);
          return newGolfer;
        },
        async findLeagueSubByGolferAndLeagueSeason(golferId: bigint, leagueSeasonId: bigint) {
          return (
            leagueSubs.find(
              (s) => s.golferid === golferId && s.leagueseasonid === leagueSeasonId,
            ) ?? null
          );
        },
        createLeagueSub: createLeagueSubSpy,
        updateLeagueSub: updateLeagueSubSpy,
        async updateGolfer(golferId: bigint, data) {
          const index = golfers.findIndex((g) => g.id === golferId);
          if (index !== -1) {
            golfers[index] = { ...golfers[index], ...data };
            return golfers[index];
          }
          return createMockGolfer({ id: golferId, ...data });
        },
        async findLeagueSubById(subId: bigint) {
          const sub = leagueSubs.find((s) => s.id === subId);
          if (!sub) return null;
          const golferRecord =
            golfers.find((g) => g.id === sub.golferid) ?? createMockGolfer({ id: sub.golferid });
          const contact = createMockContact({ id: golferRecord.contactid ?? 1n });
          return createMockLeagueSubWithGolfer({
            ...sub,
            golfer: { ...golferRecord, contact },
          });
        },
      });

      service = new GolfRosterService(
        rosterRepository,
        buildStubTeamRepository({}),
        buildStubFlightRepository({}),
      );
    });

    it('creates a new substitute when no existing sub row exists', async () => {
      const result = await service.signSubstitute(1n, 100n, 1n, {
        contactId: '1',
        isSub: true,
      });

      expect(createLeagueSubSpy).toHaveBeenCalledOnce();
      expect(updateLeagueSubSpy).not.toHaveBeenCalled();
      expect(result.leagueSeasonId).toBe('1');
      expect(result.isActive).toBe(true);
    });

    it('reactivates an inactive existing substitute instead of creating a new one', async () => {
      leagueSubs.push(
        createMockLeagueSub({ id: 300n, golferid: 10n, leagueseasonid: 1n, isactive: false }),
      );
      golfers.push(createMockGolfer({ id: 10n, contactid: 1n }));

      await service.signSubstitute(1n, 100n, 1n, { contactId: '1', isSub: true });

      expect(updateLeagueSubSpy).toHaveBeenCalledWith(300n, { isactive: true });
      expect(createLeagueSubSpy).not.toHaveBeenCalled();
    });

    it('throws ValidationError when existing sub is already active', async () => {
      leagueSubs.push(
        createMockLeagueSub({ id: 300n, golferid: 10n, leagueseasonid: 1n, isactive: true }),
      );
      golfers.push(createMockGolfer({ id: 10n, contactid: 1n }));

      await expect(
        service.signSubstitute(1n, 100n, 1n, { contactId: '1', isSub: true }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('updates golfer initialDifferential when provided on re-sign', async () => {
      leagueSubs.push(
        createMockLeagueSub({ id: 300n, golferid: 10n, leagueseasonid: 1n, isactive: false }),
      );
      golfers.push(createMockGolfer({ id: 10n, contactid: 1n, initialdifferential: 5 }));

      const result = await service.signSubstitute(1n, 100n, 1n, {
        contactId: '1',
        isSub: true,
        initialDifferential: 12,
      });

      expect(updateLeagueSubSpy).toHaveBeenCalledWith(300n, { isactive: true });
      expect(result.initialDifferential).toBe(12);
    });

    it('throws NotFoundError when league season not found', async () => {
      leagueSeasonExistsResult = false;

      await expect(
        service.signSubstitute(1n, 100n, 1n, { contactId: '1', isSub: true }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when contact not found in account', async () => {
      contactExistsResult = false;

      await expect(
        service.signSubstitute(1n, 100n, 1n, { contactId: '1', isSub: true }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
