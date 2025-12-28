import { describe, it, expect, beforeEach } from 'vitest';
import { GolfFlightService } from '../golfFlightService.js';
import {
  type IGolfFlightRepository,
  type GolfFlightWithDetails,
  type GolfFlightWithCounts,
  type LeagueSeasonWithSeason,
} from '../../repositories/index.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type { divisionseason, divisiondefs, leagueseason, season } from '#prisma/client';

function createMockSeason(overrides: Partial<season> = {}): season {
  return {
    id: 1n,
    accountid: 100n,
    name: '2024 Season',
    startdate: new Date('2024-01-01'),
    enddate: new Date('2024-12-31'),
    isactive: true,
    iscurrent: true,
    ...overrides,
  } as season;
}

function createMockLeagueSeason(
  overrides: Partial<leagueseason> = {},
): leagueseason & { season: season } {
  return {
    id: 1n,
    accountid: 100n,
    seasonid: 1n,
    created: new Date(),
    schedulelocked: false,
    seasonmanagerid: 0n,
    season: createMockSeason(),
    ...overrides,
  } as leagueseason & { season: season };
}

function createMockDivision(overrides: Partial<divisiondefs> = {}): divisiondefs {
  return {
    id: 1n,
    accountid: 100n,
    name: 'Flight A',
    ...overrides,
  } as divisiondefs;
}

function createMockFlight(overrides: Partial<GolfFlightWithDetails> = {}): GolfFlightWithDetails {
  return {
    id: 1n,
    leagueseasonid: 1n,
    divisionid: 1n,
    priority: 0,
    divisiondefs: createMockDivision(),
    leagueseason: createMockLeagueSeason(),
    ...overrides,
  } as GolfFlightWithDetails;
}

function createMockFlightWithCounts(
  overrides: Partial<GolfFlightWithCounts> = {},
): GolfFlightWithCounts {
  return {
    ...createMockFlight(overrides),
    _count: { teamsseason: 0 },
    playerCount: 0,
    ...overrides,
  } as GolfFlightWithCounts;
}

describe('GolfFlightService', () => {
  let flights: GolfFlightWithCounts[];
  let divisions: divisiondefs[];
  let nextFlightId: bigint;
  let nextDivisionId: bigint;
  let seasonExists: boolean;
  let repository: IGolfFlightRepository;
  let service: GolfFlightService;

  beforeEach(() => {
    nextFlightId = 3n;
    nextDivisionId = 3n;
    seasonExists = true;

    divisions = [
      createMockDivision({ id: 1n, name: 'Flight A' }),
      createMockDivision({ id: 2n, name: 'Flight B' }),
    ];

    flights = [
      createMockFlightWithCounts({
        id: 1n,
        divisionid: 1n,
        priority: 0,
        divisiondefs: divisions[0],
      }),
      createMockFlightWithCounts({
        id: 2n,
        divisionid: 2n,
        priority: 1,
        divisiondefs: divisions[1],
        _count: { teamsseason: 3 },
      }),
    ];

    repository = {
      async findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]> {
        return flights.filter((f) => f.leagueseason.seasonid === seasonId);
      },
      async findByLeagueSeasonId(leagueSeasonId: bigint): Promise<GolfFlightWithCounts[]> {
        return flights.filter((f) => f.leagueseasonid === leagueSeasonId);
      },
      async findById(flightId: bigint): Promise<GolfFlightWithDetails | null> {
        return flights.find((f) => f.id === flightId) ?? null;
      },
      async create(
        leagueSeasonId: bigint,
        divisionId: bigint,
        priority?: number,
      ): Promise<divisionseason> {
        const division = divisions.find((d) => d.id === divisionId);
        const created: GolfFlightWithCounts = {
          id: nextFlightId,
          leagueseasonid: leagueSeasonId,
          divisionid: divisionId,
          priority: priority ?? 0,
          divisiondefs: division ?? createMockDivision({ id: divisionId }),
          leagueseason: createMockLeagueSeason({ id: leagueSeasonId }),
          _count: { teamsseason: 0 },
        };
        nextFlightId += 1n;
        flights.push(created);
        return created as divisionseason;
      },
      async update(flightId: bigint, data): Promise<divisionseason> {
        const index = flights.findIndex((f) => f.id === flightId);
        if (index === -1) {
          throw new NotFoundError('Flight not found');
        }
        if (data.divisionid !== undefined) {
          const division = divisions.find((d) => d.id === data.divisionid);
          if (division) {
            flights[index] = {
              ...flights[index],
              divisionid: data.divisionid,
              divisiondefs: division,
            };
          }
        }
        return flights[index] as divisionseason;
      },
      async delete(flightId: bigint): Promise<divisionseason> {
        const index = flights.findIndex((f) => f.id === flightId);
        if (index === -1) {
          throw new NotFoundError('Flight not found');
        }
        const deleted = flights[index];
        flights.splice(index, 1);
        return deleted as divisionseason;
      },
      async findOrCreateDivision(accountId: bigint, name: string): Promise<divisiondefs> {
        let division = divisions.find(
          (d) => d.accountid === accountId && d.name.toLowerCase() === name.toLowerCase(),
        );
        if (!division) {
          division = createMockDivision({
            id: nextDivisionId,
            accountid: accountId,
            name,
          });
          nextDivisionId += 1n;
          divisions.push(division);
        }
        return division;
      },
      async getPlayerCountForFlight(): Promise<number> {
        return 0;
      },
      async getLeagueSeasonWithHierarchy(
        leagueSeasonId: bigint,
      ): Promise<LeagueSeasonWithSeason | null> {
        if (!seasonExists) return null;
        return createMockLeagueSeason({ id: leagueSeasonId });
      },
      async leagueSeasonExists(): Promise<boolean> {
        return seasonExists;
      },
    };

    service = new GolfFlightService(repository);
  });

  describe('getFlightsForSeason', () => {
    it('returns formatted flights with team counts', async () => {
      const result = await service.getFlightsForSeason(1n);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Flight A');
      expect(result[0].teamCount).toBe(0);
    });

    it('returns flights ordered by priority', async () => {
      const result = await service.getFlightsForSeason(1n);

      expect(result[0].name).toBe('Flight A');
      expect(result[1].name).toBe('Flight B');
    });

    it('includes team count for each flight', async () => {
      const result = await service.getFlightsForSeason(1n);

      expect(result[1].teamCount).toBe(3);
    });

    it('returns empty array when no flights exist', async () => {
      flights = [];

      const result = await service.getFlightsForSeason(1n);

      expect(result).toHaveLength(0);
    });
  });

  describe('getFlightById', () => {
    it('returns formatted flight when found', async () => {
      const result = await service.getFlightById(1n);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Flight A');
      expect(result.season).toBeDefined();
      expect(result.season!.id).toBe('1');
      expect(result.season!.name).toBe('2024 Season');
    });

    it('throws NotFoundError when flight not found', async () => {
      await expect(service.getFlightById(999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('createFlight', () => {
    it('creates flight with valid data', async () => {
      const result = await service.createFlight(100n, 1n, 1n, { name: 'Flight C' });

      expect(result.name).toBe('Flight C');
      expect(flights).toHaveLength(3);
    });

    it('trims flight name', async () => {
      const result = await service.createFlight(100n, 1n, 1n, { name: '  Flight C  ' });

      expect(result.name).toBe('Flight C');
    });

    it('assigns next priority value', async () => {
      await service.createFlight(100n, 1n, 1n, { name: 'Flight C' });

      const created = flights.find((f) => f.divisiondefs.name === 'Flight C');
      expect(created?.priority).toBe(2);
    });

    it('throws NotFoundError when league season does not exist', async () => {
      seasonExists = false;

      await expect(
        service.createFlight(100n, 1n, 999n, { name: 'New Flight' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError for duplicate name in league season', async () => {
      await expect(service.createFlight(100n, 1n, 1n, { name: 'Flight A' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('throws ValidationError for duplicate name case-insensitive', async () => {
      await expect(service.createFlight(100n, 1n, 1n, { name: 'flight a' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('reuses existing division with same name', async () => {
      const initialDivisionCount = divisions.length;

      await service.createFlight(100n, 1n, 1n, { name: 'Flight A' }).catch(() => {});

      expect(divisions.length).toBe(initialDivisionCount);
    });
  });

  describe('updateFlight', () => {
    it('updates flight name', async () => {
      const result = await service.updateFlight(1n, 100n, { name: 'Updated Flight' });

      expect(result.name).toBe('Updated Flight');
    });

    it('trims updated name', async () => {
      const result = await service.updateFlight(1n, 100n, { name: '  Trimmed Name  ' });

      expect(result.name).toBe('Trimmed Name');
    });

    it('throws NotFoundError when flight not found', async () => {
      await expect(service.updateFlight(999n, 100n, { name: 'Test' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ValidationError for duplicate name on update', async () => {
      await expect(service.updateFlight(1n, 100n, { name: 'Flight B' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('allows keeping the same name', async () => {
      const result = await service.updateFlight(1n, 100n, { name: 'Flight A' });

      expect(result.name).toBe('Flight A');
    });

    it('creates new division if name does not exist', async () => {
      const initialDivisionCount = divisions.length;

      await service.updateFlight(1n, 100n, { name: 'New Division Name' });

      expect(divisions.length).toBe(initialDivisionCount + 1);
    });
  });

  describe('deleteFlight', () => {
    it('deletes flight when no teams assigned', async () => {
      await service.deleteFlight(1n);

      expect(flights).toHaveLength(1);
      expect(flights[0].id).toBe(2n);
    });

    it('throws NotFoundError when flight not found', async () => {
      await expect(service.deleteFlight(999n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError when flight has teams assigned', async () => {
      await expect(service.deleteFlight(2n)).rejects.toBeInstanceOf(ValidationError);
    });

    it('error message mentions teams when deletion fails', async () => {
      await expect(service.deleteFlight(2n)).rejects.toThrow(/teams assigned/i);
    });
  });
});
