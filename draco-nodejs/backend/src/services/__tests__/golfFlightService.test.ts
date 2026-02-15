import { describe, it, expect, beforeEach } from 'vitest';
import { GolfFlightService } from '../golfFlightService.js';
import {
  type IGolfFlightRepository,
  type GolfFlightWithDetails,
  type GolfFlightWithCounts,
} from '../../repositories/index.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type { league, season } from '#prisma/client';

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

function createMockLeague(overrides: Partial<league> = {}): league {
  return {
    id: 1n,
    accountid: 100n,
    name: 'Flight A',
    ...overrides,
  } as league;
}

function createMockFlight(overrides: Partial<GolfFlightWithDetails> = {}): GolfFlightWithDetails {
  return {
    id: 1n,
    seasonid: 1n,
    leagueid: 1n,
    league: createMockLeague(),
    season: createMockSeason(),
    ...overrides,
  } as GolfFlightWithDetails;
}

function createMockFlightWithCounts(
  overrides: Partial<GolfFlightWithCounts> = {},
): GolfFlightWithCounts {
  return {
    ...createMockFlight(overrides),
    teamCount: 0,
    playerCount: 0,
    ...overrides,
  } as GolfFlightWithCounts;
}

describe('GolfFlightService', () => {
  let flights: GolfFlightWithCounts[];
  let nextFlightId: bigint;
  let nextLeagueId: bigint;
  let repository: IGolfFlightRepository;
  let service: GolfFlightService;

  beforeEach(() => {
    nextFlightId = 3n;
    nextLeagueId = 3n;

    flights = [
      createMockFlightWithCounts({
        id: 1n,
        leagueid: 1n,
        league: createMockLeague({ id: 1n, name: 'Flight A' }),
      }),
      createMockFlightWithCounts({
        id: 2n,
        leagueid: 2n,
        league: createMockLeague({ id: 2n, name: 'Flight B' }),
        teamCount: 3,
      }),
    ];

    repository = {
      async findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]> {
        return flights.filter((f) => f.seasonid === seasonId);
      },
      async findById(flightId: bigint): Promise<GolfFlightWithDetails | null> {
        return flights.find((f) => f.id === flightId) ?? null;
      },
      async create(
        accountId: bigint,
        seasonId: bigint,
        name: string,
      ): Promise<GolfFlightWithDetails> {
        const newLeague = createMockLeague({
          id: nextLeagueId,
          accountid: accountId,
          name,
        });
        const created: GolfFlightWithCounts = {
          id: nextFlightId,
          seasonid: seasonId,
          leagueid: newLeague.id,
          league: newLeague,
          season: createMockSeason({ id: seasonId }),
          teamCount: 0,
          playerCount: 0,
        } as GolfFlightWithCounts;
        nextFlightId += 1n;
        nextLeagueId += 1n;
        flights.push(created);
        return created;
      },
      async update(flightId: bigint, name: string): Promise<GolfFlightWithDetails> {
        const index = flights.findIndex((f) => f.id === flightId);
        if (index === -1) {
          throw new NotFoundError('Flight not found');
        }
        flights[index] = {
          ...flights[index],
          league: {
            ...flights[index].league,
            name,
          },
        };
        return flights[index];
      },
      async delete(flightId: bigint): Promise<void> {
        const index = flights.findIndex((f) => f.id === flightId);
        if (index === -1) {
          throw new NotFoundError('Flight not found');
        }
        flights.splice(index, 1);
      },
      async getPlayerCountForFlight(flightId: bigint): Promise<number> {
        const flight = flights.find((f) => f.id === flightId);
        return flight?.teamCount ?? 0;
      },
      async flightNameExistsInSeason(
        accountId: bigint,
        seasonId: bigint,
        name: string,
      ): Promise<boolean> {
        return flights.some(
          (f) =>
            f.seasonid === seasonId &&
            f.league.accountid === accountId &&
            f.league.name.toLowerCase() === name.toLowerCase(),
        );
      },
      async seasonHasFlights(seasonId: bigint): Promise<boolean> {
        return flights.some((f) => f.seasonid === seasonId);
      },
      async findByLeagueAndSeason(
        leagueId: bigint,
        seasonId: bigint,
      ): Promise<{ id: bigint } | null> {
        const found = flights.find((f) => f.leagueid === leagueId && f.seasonid === seasonId);
        return found ? { id: found.id } : null;
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

    it('returns flights ordered by name', async () => {
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
      const result = await service.createFlight(100n, 1n, { name: 'Flight C' });

      expect(result.name).toBe('Flight C');
      expect(flights).toHaveLength(3);
    });

    it('trims flight name', async () => {
      const result = await service.createFlight(100n, 1n, { name: '  Flight C  ' });

      expect(result.name).toBe('Flight C');
    });

    it('throws ValidationError for duplicate name in season', async () => {
      await expect(service.createFlight(100n, 1n, { name: 'Flight A' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('throws ValidationError for duplicate name case-insensitive', async () => {
      await expect(service.createFlight(100n, 1n, { name: 'flight a' })).rejects.toBeInstanceOf(
        ValidationError,
      );
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
