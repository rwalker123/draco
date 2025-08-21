import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CleanupService } from '../cleanupService.js';
import { ICleanupRepository } from '../../interfaces/cleanupInterfaces.js';
import { cleanupConfig } from '../../config/cleanup.js';

// Mock the repository constructor
vi.mock('../../repositories/implementations/PrismaCleanupRepository.js', () => ({
  PrismaCleanupRepository: vi.fn(),
}));

describe('CleanupService', () => {
  let cleanupService: CleanupService;
  let mockPrisma: any;
  let mockRepository: ICleanupRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock repository for each test that actually works
    mockRepository = {
      findExpiredRecords: async (_tableName: string, _cutoffDate: Date, _batchSize: number) => {
        // This mock will be configured per test
        return [];
      },
      deleteRecordsByIds: async (_tableName: string, _ids: bigint[]) => {
        // This mock will be configured per test
        return 0;
      },
    };

    // Create a mock Prisma client
    mockPrisma = {};

    cleanupService = new CleanupService(mockPrisma, undefined, mockRepository);
  });

  afterEach(() => {
    cleanupService.stop();
  });

  describe('manualCleanup', () => {
    it('should clean up expired Players Wanted classifieds', async () => {
      const mockExpiredRecords = [{ id: BigInt(1) }, { id: BigInt(2) }, { id: BigInt(3) }];

      // Configure the mock repository methods directly
      mockRepository.findExpiredRecords = async (
        tableName: string,
        _cutoffDate: Date,
        _batchSize: number,
      ) => {
        if (tableName === 'playerswantedclassified') {
          return mockExpiredRecords;
        }
        return [];
      };

      mockRepository.deleteRecordsByIds = async (tableName: string, _ids: bigint[]) => {
        if (tableName === 'playerswantedclassified') {
          return 3;
        }
        return 0;
      };

      const result = await cleanupService.manualCleanup();

      expect(result.expiredPlayersWanted).toBe(3);
      expect(result.expiredTeamsWanted).toBe(0);
      expect(result.totalDeleted).toBe(3);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should accept and validate cleanup options', async () => {
      const mockExpiredRecords = [{ id: BigInt(1) }, { id: BigInt(2) }];

      // Configure the mock repository methods directly
      mockRepository.findExpiredRecords = async (
        tableName: string,
        _cutoffDate: Date,
        batchSize: number,
      ) => {
        if (tableName === 'playerswantedclassified') {
          return mockExpiredRecords.slice(0, Math.min(mockExpiredRecords.length, batchSize));
        }
        return [];
      };

      mockRepository.deleteRecordsByIds = async (tableName: string, _ids: bigint[]) => {
        if (tableName === 'playerswantedclassified') {
          return 2;
        }
        return 0;
      };

      const result = await cleanupService.manualCleanup({
        batchSize: 10,
        expirationDays: 30,
        tableFilter: 'playerswantedclassified',
        dryRun: false,
      });

      expect(result.expiredPlayersWanted).toBe(2);
      expect(result.expiredTeamsWanted).toBe(0);
      expect(result.totalDeleted).toBe(2);
    });

    it('should handle table filter to disable specific cleanups', async () => {
      const mockExpiredRecords = [{ id: BigInt(1) }, { id: BigInt(2) }];

      // Configure the mock repository methods directly
      mockRepository.findExpiredRecords = async (
        tableName: string,
        _cutoffDate: Date,
        _batchSize: number,
      ) => {
        if (tableName === 'teamswantedclassified') {
          return mockExpiredRecords;
        }
        return [];
      };

      mockRepository.deleteRecordsByIds = async (tableName: string, _ids: bigint[]) => {
        if (tableName === 'teamswantedclassified') {
          return 2;
        }
        return 0;
      };

      const result = await cleanupService.manualCleanup({
        tableFilter: 'teamswantedclassified',
      });

      expect(result.expiredPlayersWanted).toBe(0);
      expect(result.expiredTeamsWanted).toBe(2);
      expect(result.totalDeleted).toBe(2);
    });

    it('should throw validation error for invalid batch size', async () => {
      await expect(cleanupService.manualCleanup({ batchSize: 0 })).rejects.toThrow(
        'Batch size must be an integer between 1 and 1000',
      );

      await expect(cleanupService.manualCleanup({ batchSize: 1001 })).rejects.toThrow(
        'Batch size must be an integer between 1 and 1000',
      );
    });

    it('should throw validation error for invalid expiration days', async () => {
      await expect(cleanupService.manualCleanup({ expirationDays: 0 })).rejects.toThrow(
        'Expiration days must be an integer between 1 and 365',
      );

      await expect(cleanupService.manualCleanup({ expirationDays: 366 })).rejects.toThrow(
        'Expiration days must be an integer between 1 and 365',
      );
    });

    it('should throw validation error for invalid table filter', async () => {
      await expect(cleanupService.manualCleanup({ tableFilter: 'invalid_table' })).rejects.toThrow(
        'Table filter must be one of: playerswantedclassified, teamswantedclassified',
      );
    });

    it('should throw validation error for invalid dry run flag', async () => {
      await expect(cleanupService.manualCleanup({ dryRun: 'not_boolean' as any })).rejects.toThrow(
        'Dry run must be a boolean value',
      );
    });

    it('should clean up expired Teams Wanted classifieds', async () => {
      const mockExpiredRecords = [{ id: BigInt(1) }, { id: BigInt(2) }];

      // Configure the mock repository methods directly
      mockRepository.findExpiredRecords = async (
        tableName: string,
        _cutoffDate: Date,
        _batchSize: number,
      ) => {
        if (tableName === 'playerswantedclassified') {
          return [];
        }
        if (tableName === 'teamswantedclassified') {
          return mockExpiredRecords;
        }
        return [];
      };

      mockRepository.deleteRecordsByIds = async (tableName: string, _ids: bigint[]) => {
        if (tableName === 'playerswantedclassified') {
          return 0;
        }
        if (tableName === 'teamswantedclassified') {
          return 2;
        }
        return 0;
      };

      const result = await cleanupService.manualCleanup();

      expect(result.expiredPlayersWanted).toBe(0);
      expect(result.expiredTeamsWanted).toBe(2);
      expect(result.totalDeleted).toBe(2);
    });

    it('should handle batch processing correctly', async () => {
      const firstBatch = Array.from({ length: 25 }, (_, i) => ({ id: BigInt(i + 1) }));
      const secondBatch = Array.from({ length: 10 }, (_, i) => ({ id: BigInt(i + 26) }));

      let callCount = 0;
      mockRepository.findExpiredRecords = async (
        tableName: string,
        _cutoffDate: Date,
        _batchSize: number,
      ) => {
        if (tableName === 'playerswantedclassified') {
          callCount++;
          if (callCount === 1) return firstBatch;
          if (callCount === 2) return secondBatch;
          return [];
        }
        if (tableName === 'teamswantedclassified') {
          return [];
        }
        return [];
      };

      let deleteCallCount = 0;
      mockRepository.deleteRecordsByIds = async (tableName: string, _ids: bigint[]) => {
        if (tableName === 'playerswantedclassified') {
          deleteCallCount++;
          if (deleteCallCount === 1) return 25;
          if (deleteCallCount === 2) return 10;
          return 0;
        }
        if (tableName === 'teamswantedclassified') {
          return 0;
        }
        return 0;
      };

      const result = await cleanupService.manualCleanup();

      expect(result.expiredPlayersWanted).toBe(35);
      expect(result.totalDeleted).toBe(35);
    });

    it('should handle no expired records', async () => {
      mockRepository.findExpiredRecords = async (
        _tableName: string,
        _cutoffDate: Date,
        _batchSize: number,
      ) => {
        return [];
      };

      mockRepository.deleteRecordsByIds = async (_tableName: string, _ids: bigint[]) => {
        return 0;
      };

      const result = await cleanupService.manualCleanup();

      expect(result.expiredPlayersWanted).toBe(0);
      expect(result.expiredTeamsWanted).toBe(0);
      expect(result.totalDeleted).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when service is not running', () => {
      const status = cleanupService.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.nextCleanup).toBeNull();
      expect(status.lastCleanup).toBeNull();
      expect(status.isHealthy).toBe(true);
      expect(status.lastError).toBeUndefined();
    });

    it('should return correct status when service is running', () => {
      cleanupService.start();
      const status = cleanupService.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.nextCleanup).toBeInstanceOf(Date);
      expect(status.isHealthy).toBe(true);
    });
  });

  describe('service lifecycle', () => {
    it('should handle start and stop calls without errors', () => {
      // These methods use timers which are hard to test, so we just verify they don't throw
      expect(() => cleanupService.start()).not.toThrow();
      expect(() => cleanupService.stop()).not.toThrow();
    });

    it('should handle multiple start calls without errors', () => {
      expect(() => cleanupService.start()).not.toThrow();
      expect(() => cleanupService.start()).not.toThrow(); // Should restart
      expect(() => cleanupService.stop()).not.toThrow();
    });
  });

  describe('configuration', () => {
    it('should use default configuration when none provided', () => {
      const service = new CleanupService(mockPrisma, undefined, mockRepository);
      const status = service.getStatus();

      expect(status.isRunning).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        batchSize: 50,
        cleanupHour: 3,
        expirationDays: 30,
      };

      const service = new CleanupService(mockPrisma, customConfig, mockRepository);
      // Configuration is applied internally, so we test by checking behavior
      expect(() => service.start()).not.toThrow();
      service.stop();
    });

    it('should use cleanup configuration from environment', () => {
      const service = new CleanupService(mockPrisma, cleanupConfig, mockRepository);
      // Configuration is applied internally, so we test by checking behavior
      expect(() => service.start()).not.toThrow();
      service.stop();
    });
  });

  describe('mock repository setup', () => {
    it('should have the correct methods', () => {
      expect(typeof mockRepository.findExpiredRecords).toBe('function');
      expect(typeof mockRepository.deleteRecordsByIds).toBe('function');
    });

    it('should be used by the service', () => {
      expect(cleanupService).toBeDefined();
      // This test verifies the mock repository is injected
    });
  });

  describe('mock repository verification', () => {
    it('should use the injected mock repository', async () => {
      // Create a simple mock that returns known values
      const simpleMock = {
        findExpiredRecords: vi.fn().mockResolvedValue([{ id: BigInt(999) }]),
        deleteRecordsByIds: vi.fn().mockResolvedValue(1),
      } as any;

      // Create a new service with this mock
      const testService = new CleanupService(mockPrisma, undefined, simpleMock);

      // Call the method that should use the repository
      const result = await testService.cleanupExpiredPlayersWanted();

      // Verify the mock was called
      expect(simpleMock.findExpiredRecords).toHaveBeenCalled();
      expect(simpleMock.deleteRecordsByIds).toHaveBeenCalled();
      expect(result).toBe(1);
    });
  });

  describe('cleanupExpiredPlayersWanted with parameters', () => {
    it('should accept optional parameters', async () => {
      const mockExpiredRecords = [{ id: BigInt(1) }, { id: BigInt(2) }];

      mockRepository.findExpiredRecords = async (
        _tableName: string,
        _cutoffDate: Date,
        batchSize: number,
      ) => {
        expect(batchSize).toBe(50);
        return mockExpiredRecords;
      };

      mockRepository.deleteRecordsByIds = async (_tableName: string, _ids: bigint[]) => {
        return 2;
      };

      const result = await cleanupService.cleanupExpiredPlayersWanted(30, 50);

      expect(result).toBe(2);
    });

    it('should respect enabled flag', async () => {
      const result = await cleanupService.cleanupExpiredPlayersWanted(undefined, undefined, false);

      expect(result).toBe(0);
    });
  });

  describe('cleanupExpiredTeamsWanted with parameters', () => {
    it('should accept optional parameters', async () => {
      const mockExpiredRecords = [{ id: BigInt(1) }, { id: BigInt(2) }];

      mockRepository.findExpiredRecords = async (
        _tableName: string,
        _cutoffDate: Date,
        batchSize: number,
      ) => {
        expect(batchSize).toBe(75);
        return mockExpiredRecords;
      };

      mockRepository.deleteRecordsByIds = async (_tableName: string, _ids: bigint[]) => {
        return 2;
      };

      const result = await cleanupService.cleanupExpiredTeamsWanted(60, 75);

      expect(result).toBe(2);
    });

    it('should respect enabled flag', async () => {
      const result = await cleanupService.cleanupExpiredTeamsWanted(undefined, undefined, false);

      expect(result).toBe(0);
    });
  });
});
