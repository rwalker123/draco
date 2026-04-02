import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';

const mockCtpRepo = {
  findByMatchId: vi.fn(),
  findByFlightId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockMatchRepo = {
  findById: vi.fn(),
  findByIdWithLeague: vi.fn(),
};

const mockCourseRepo = {
  findById: vi.fn(),
};

const repositoryFactoryMock = vi.hoisted(() => ({
  getGolfClosestToPinRepository: vi.fn(() => mockCtpRepo),
  getGolfMatchRepository: vi.fn(() => mockMatchRepo),
  getGolfCourseRepository: vi.fn(() => mockCourseRepo),
}));

vi.mock('../../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: repositoryFactoryMock,
}));

import { GolfClosestToPinService } from '../golfClosestToPinService.js';

const createMockCourse = (par3HoleNumber = 3): Record<string, unknown> => {
  const course: Record<string, unknown> = { id: 1n };
  for (let i = 1; i <= 18; i++) {
    course[`menspar${i}`] = i === par3HoleNumber ? 3 : 4;
  }
  return course;
};

type MockCtpOverrides = {
  id?: bigint;
  matchid?: bigint;
  holeno?: number;
  contactid?: bigint;
  distance?: number;
  unit?: string;
  enteredby?: string;
  createdat?: Date;
  contacts?: { id: bigint; firstname: string; lastname: string };
  golfmatch?: { id: bigint; matchdate: Date; weeknumber: number | null };
};

const createMockCtpEntry = (overrides: MockCtpOverrides = {}) => ({
  id: overrides.id ?? 1n,
  matchid: overrides.matchid ?? 10n,
  holeno: overrides.holeno ?? 3,
  contactid: overrides.contactid ?? 100n,
  distance: overrides.distance ?? 12.5,
  unit: overrides.unit ?? 'feet',
  enteredby: overrides.enteredby ?? 'user1',
  createdat: overrides.createdat ?? new Date('2024-01-01'),
  contacts: overrides.contacts ?? {
    id: 100n,
    firstname: 'Alice',
    lastname: 'Smith',
  },
  golfmatch: overrides.golfmatch ?? {
    id: 10n,
    matchdate: new Date('2024-06-15'),
    weeknumber: 5,
  },
});

const createMockMatch = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  id: 10n,
  courseid: 1n,
  matchdate: new Date('2024-06-15'),
  weeknumber: 5,
  ...overrides,
});

const TEST_ACCOUNT_ID = 1n;

const mockMatchWithLeague = {
  id: 10n,
  leagueid: 100n,
  leagueseason: {
    id: 100n,
    leagueid: 200n,
    league: {
      id: 200n,
      accountid: TEST_ACCOUNT_ID,
    },
  },
};

const setupOwnershipMock = () => {
  mockCtpRepo.findById.mockResolvedValue(createMockCtpEntry());
  mockMatchRepo.findByIdWithLeague.mockResolvedValue(mockMatchWithLeague);
};

describe('GolfClosestToPinService', () => {
  let service: GolfClosestToPinService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GolfClosestToPinService();
  });

  describe('getForMatch', () => {
    it('returns formatted CTP entries for a match', async () => {
      const entry = createMockCtpEntry();
      mockCtpRepo.findByMatchId.mockResolvedValue([entry]);

      const result = await service.getForMatch(10n);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        matchId: '10',
        holeNumber: 3,
        contactId: '100',
        firstName: 'Alice',
        lastName: 'Smith',
        distance: 12.5,
        unit: 'feet',
        weekNumber: 5,
      });
    });

    it('returns empty array when no entries exist', async () => {
      mockCtpRepo.findByMatchId.mockResolvedValue([]);

      const result = await service.getForMatch(10n);

      expect(result).toHaveLength(0);
    });

    it('formats matchDate as ISO string', async () => {
      const entry = createMockCtpEntry();
      mockCtpRepo.findByMatchId.mockResolvedValue([entry]);

      const result = await service.getForMatch(10n);

      expect(result[0].matchDate).toBe(new Date('2024-06-15').toISOString());
    });

    it('sets weekNumber to undefined when null', async () => {
      const entry = createMockCtpEntry({
        golfmatch: { id: 10n, matchdate: new Date('2024-06-15'), weeknumber: null },
      });
      mockCtpRepo.findByMatchId.mockResolvedValue([entry]);

      const result = await service.getForMatch(10n);

      expect(result[0].weekNumber).toBeUndefined();
    });
  });

  describe('getForFlight', () => {
    it('returns formatted CTP entries for a flight', async () => {
      const entry1 = createMockCtpEntry();
      const entry2 = createMockCtpEntry({
        id: 2n,
        holeno: 7,
        contactid: 200n,
        contacts: { id: 200n, firstname: 'Bob', lastname: 'Jones' },
      });
      mockCtpRepo.findByFlightId.mockResolvedValue([entry1, entry2]);

      const result = await service.getForFlight(50n);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('returns empty array when no entries', async () => {
      mockCtpRepo.findByFlightId.mockResolvedValue([]);

      const result = await service.getForFlight(50n);

      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('creates a CTP entry and returns formatted result', async () => {
      const match = createMockMatch();
      const course = createMockCourse(3);
      const createdRaw = {
        id: 99n,
        matchid: 10n,
        holeno: 3,
        contactid: 100n,
        distance: 8,
        unit: 'feet',
        enteredby: 'user1',
        createdat: new Date(),
      };
      const withDetails = createMockCtpEntry({ id: 99n, distance: 8 });

      mockMatchRepo.findById.mockResolvedValue(match);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockCtpRepo.create.mockResolvedValue(createdRaw);
      mockCtpRepo.findById.mockResolvedValue(withDetails);

      const result = await service.create(
        10n,
        {
          holeNumber: 3,
          contactId: '100',
          distance: 8,
          unit: 'feet',
        },
        'user1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('99');
      expect(result.holeNumber).toBe(3);
      expect(mockCtpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          matchid: 10n,
          holeno: 3,
          contactid: 100n,
          distance: 8,
          unit: 'feet',
          enteredby: 'user1',
        }),
      );
    });

    it('throws NotFoundError when match does not exist', async () => {
      mockMatchRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          999n,
          { holeNumber: 3, contactId: '100', distance: 8, unit: 'feet' },
          'user1',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when match has no course assigned', async () => {
      const match = createMockMatch({ courseid: null });
      mockMatchRepo.findById.mockResolvedValue(match);

      await expect(
        service.create(
          10n,
          { holeNumber: 3, contactId: '100', distance: 8, unit: 'feet' },
          'user1',
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when course does not exist', async () => {
      const match = createMockMatch();
      mockMatchRepo.findById.mockResolvedValue(match);
      mockCourseRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          10n,
          { holeNumber: 3, contactId: '100', distance: 8, unit: 'feet' },
          'user1',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when hole is not par 3', async () => {
      const match = createMockMatch();
      const course = createMockCourse(7);
      mockMatchRepo.findById.mockResolvedValue(match);
      mockCourseRepo.findById.mockResolvedValue(course);

      await expect(
        service.create(
          10n,
          { holeNumber: 3, contactId: '100', distance: 8, unit: 'feet' },
          'user1',
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when created entry cannot be fetched', async () => {
      const match = createMockMatch();
      const course = createMockCourse(3);
      const createdRaw = { id: 99n };

      mockMatchRepo.findById.mockResolvedValue(match);
      mockCourseRepo.findById.mockResolvedValue(course);
      mockCtpRepo.create.mockResolvedValue(createdRaw);
      mockCtpRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          10n,
          { holeNumber: 3, contactId: '100', distance: 8, unit: 'feet' },
          'user1',
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('updates entry and returns formatted result', async () => {
      setupOwnershipMock();
      const withDetails = createMockCtpEntry({ distance: 15, unit: 'yards' });
      mockCtpRepo.update.mockResolvedValue({});
      mockCtpRepo.findById
        .mockResolvedValueOnce(createMockCtpEntry())
        .mockResolvedValueOnce(withDetails);

      const result = await service.update(1n, { distance: 15, unit: 'yards' }, TEST_ACCOUNT_ID);

      expect(result).toBeDefined();
      expect(result.distance).toBe(15);
      expect(result.unit).toBe('yards');
    });

    it('throws NotFoundError when entry not found after update', async () => {
      setupOwnershipMock();
      mockCtpRepo.update.mockResolvedValue({});
      mockCtpRepo.findById.mockResolvedValueOnce(createMockCtpEntry()).mockResolvedValueOnce(null);

      await expect(service.update(999n, { distance: 10 }, TEST_ACCOUNT_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('converts contactId string to bigint in update', async () => {
      setupOwnershipMock();
      const withDetails = createMockCtpEntry();
      mockCtpRepo.update.mockResolvedValue({});
      mockCtpRepo.findById
        .mockResolvedValueOnce(createMockCtpEntry())
        .mockResolvedValueOnce(withDetails);

      await service.update(1n, { contactId: '200', distance: 10 }, TEST_ACCOUNT_ID);

      expect(mockCtpRepo.update).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          contactid: 200n,
        }),
      );
    });

    it('passes undefined contactid when contactId is not in update data', async () => {
      setupOwnershipMock();
      const withDetails = createMockCtpEntry();
      mockCtpRepo.update.mockResolvedValue({});
      mockCtpRepo.findById
        .mockResolvedValueOnce(createMockCtpEntry())
        .mockResolvedValueOnce(withDetails);

      await service.update(1n, { distance: 10 }, TEST_ACCOUNT_ID);

      expect(mockCtpRepo.update).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          contactid: undefined,
          distance: 10,
        }),
      );
    });
  });

  describe('delete', () => {
    it('calls repository delete with correct id', async () => {
      setupOwnershipMock();
      mockCtpRepo.delete.mockResolvedValue({});

      await service.delete(1n, TEST_ACCOUNT_ID);

      expect(mockCtpRepo.delete).toHaveBeenCalledWith(1n);
    });
  });
});
