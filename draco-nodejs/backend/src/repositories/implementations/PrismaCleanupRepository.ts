// Prisma implementation of ICleanupRepository
// Provides database operations for cleanup service

import { PrismaClient } from '@prisma/client';
import { ICleanupRepository } from '../../interfaces/cleanupInterfaces.js';
import { ValidationError, InternalServerError } from '../../utils/customErrors.js';

export class PrismaCleanupRepository implements ICleanupRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Find expired records in a table
   * @param tableName - Name of the table to search
   * @param cutoffDate - Date before which records are considered expired
   * @param batchSize - Maximum number of records to return
   * @returns Promise<Array<{id: bigint}>> - Array of expired record IDs
   */
  async findExpiredRecords(
    tableName: string,
    cutoffDate: Date,
    batchSize: number,
  ): Promise<Array<{ id: bigint }>> {
    // Validate input parameters
    if (!tableName || typeof tableName !== 'string') {
      throw new ValidationError('Table name must be a non-empty string');
    }

    if (!(cutoffDate instanceof Date) || isNaN(cutoffDate.getTime())) {
      throw new ValidationError('Cutoff date must be a valid Date object');
    }

    if (!Number.isInteger(batchSize) || batchSize <= 0) {
      throw new ValidationError('Batch size must be a positive integer');
    }

    try {
      switch (tableName) {
        case 'playerswantedclassified': {
          return this.prisma.playerswantedclassified.findMany({
            where: {
              datecreated: {
                lt: cutoffDate,
              },
            },
            take: batchSize,
            select: { id: true },
          });
        }

        case 'teamswantedclassified': {
          return this.prisma.teamswantedclassified.findMany({
            where: {
              datecreated: {
                lt: cutoffDate,
              },
            },
            take: batchSize,
            select: { id: true },
          });
        }

        default:
          throw new ValidationError(`Unsupported table: ${tableName}`);
      }
    } catch (error) {
      // If it's already a ValidationError, re-throw it
      if (error instanceof ValidationError) {
        throw error;
      }

      // Log the database error with context
      console.error(`Database error in findExpiredRecords for table ${tableName}:`, {
        error: error instanceof Error ? error.message : String(error),
        tableName,
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        timestamp: new Date().toISOString(),
      });

      // Re-throw as InternalServerError for proper error handling
      throw new InternalServerError(
        `Failed to find expired records in table ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete records by IDs
   * @param tableName - Name of the table to delete from
   * @param ids - Array of record IDs to delete
   * @returns Promise<number> - Number of records deleted
   */
  async deleteRecordsByIds(tableName: string, ids: bigint[]): Promise<number> {
    // Validate input parameters
    if (!tableName || typeof tableName !== 'string') {
      throw new ValidationError('Table name must be a non-empty string');
    }

    if (!Array.isArray(ids)) {
      throw new ValidationError('IDs must be an array');
    }

    if (ids.length === 0) {
      return 0;
    }

    // Validate that all IDs are valid bigint values
    if (!ids.every((id) => typeof id === 'bigint' && id > 0n)) {
      throw new ValidationError('All IDs must be positive bigint values');
    }

    try {
      switch (tableName) {
        case 'playerswantedclassified': {
          const playersResult = await this.prisma.playerswantedclassified.deleteMany({
            where: {
              id: { in: ids },
            },
          });
          return playersResult.count;
        }

        case 'teamswantedclassified': {
          const teamsResult = await this.prisma.teamswantedclassified.deleteMany({
            where: {
              id: { in: ids },
            },
          });
          return teamsResult.count;
        }

        default:
          throw new ValidationError(`Unsupported table: ${tableName}`);
      }
    } catch (error) {
      // If it's already a ValidationError, re-throw it
      if (error instanceof ValidationError) {
        throw error;
      }

      // Log the database error with context
      console.error(`Database error in deleteRecordsByIds for table ${tableName}:`, {
        error: error instanceof Error ? error.message : String(error),
        tableName,
        idsCount: ids.length,
        timestamp: new Date().toISOString(),
      });

      // Re-throw as InternalServerError for proper error handling
      throw new InternalServerError(
        `Failed to delete records from table ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
