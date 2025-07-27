import { BatchQueryHelper } from '../batchQueries';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client type for testing
type MockPrismaClient = {
  teamsseason: {
    findMany: jest.Mock;
  };
  leagueschedule: {
    findMany: jest.Mock;
  };
};

describe('BatchQueryHelper', () => {
  afterEach(() => {
    // Clear caches after each test
    BatchQueryHelper.clearAllCaches();
  });

  describe('batchTeamNames', () => {
    it('should handle empty array', async () => {
      const mockPrisma: MockPrismaClient = {
        teamsseason: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        leagueschedule: {
          findMany: jest.fn(),
        },
      };

      const result = await BatchQueryHelper.batchTeamNames(
        mockPrisma as unknown as PrismaClient,
        [],
      );
      expect(result.size).toBe(0);
      expect(mockPrisma.teamsseason.findMany).not.toHaveBeenCalled();
    });

    it('should batch multiple team IDs into single query', async () => {
      const mockPrisma: MockPrismaClient = {
        teamsseason: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1n, name: 'Team A' },
            { id: 2n, name: 'Team B' },
          ]),
        },
        leagueschedule: {
          findMany: jest.fn(),
        },
      };

      const result = await BatchQueryHelper.batchTeamNames(mockPrisma as unknown as PrismaClient, [
        1n,
        2n,
      ]);

      expect(mockPrisma.teamsseason.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.teamsseason.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1n, 2n] } },
        select: { id: true, name: true },
      });

      expect(result.get('1')).toBe('Team A');
      expect(result.get('2')).toBe('Team B');
    });

    it('should use cache for repeated requests', async () => {
      const mockPrisma: MockPrismaClient = {
        teamsseason: {
          findMany: jest.fn().mockResolvedValue([{ id: 1n, name: 'Team A' }]),
        },
        leagueschedule: {
          findMany: jest.fn(),
        },
      };

      // First call
      await BatchQueryHelper.batchTeamNames(mockPrisma as unknown as PrismaClient, [1n]);
      // Second call with same ID
      const result = await BatchQueryHelper.batchTeamNames(mockPrisma as unknown as PrismaClient, [
        1n,
      ]);

      // Should only call database once
      expect(mockPrisma.teamsseason.findMany).toHaveBeenCalledTimes(1);
      expect(result.get('1')).toBe('Team A');
    });
  });

  describe('batchTeamRecords', () => {
    it('should handle empty array', async () => {
      const mockPrisma: MockPrismaClient = {
        teamsseason: {
          findMany: jest.fn(),
        },
        leagueschedule: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const result = await BatchQueryHelper.batchTeamRecords(
        mockPrisma as unknown as PrismaClient,
        [],
      );
      expect(result.size).toBe(0);
      expect(mockPrisma.leagueschedule.findMany).not.toHaveBeenCalled();
    });

    it('should calculate records correctly', async () => {
      const mockPrisma: MockPrismaClient = {
        teamsseason: {
          findMany: jest.fn(),
        },
        leagueschedule: {
          findMany: jest.fn().mockResolvedValue([
            {
              hteamid: 1n,
              vteamid: 2n,
              hscore: 5,
              vscore: 3,
              gamestatus: 1, // Final
            },
            {
              hteamid: 2n,
              vteamid: 1n,
              hscore: 2,
              vscore: 4,
              gamestatus: 1, // Final
            },
          ]),
        },
      };

      const result = await BatchQueryHelper.batchTeamRecords(
        mockPrisma as unknown as PrismaClient,
        [1n, 2n],
      );

      expect(mockPrisma.leagueschedule.findMany).toHaveBeenCalledTimes(1);

      const team1Record = result.get('1');
      const team2Record = result.get('2');

      expect(team1Record).toEqual({ wins: 2, losses: 0, ties: 0 });
      expect(team2Record).toEqual({ wins: 0, losses: 2, ties: 0 });
    });
  });
});
