import {
  ExpiredPlayersWantedWithEmail,
  ExpiredTeamsWantedWithEmail,
} from '../../interfaces/cleanupInterfaces.js';

/**
 * Interface for cleanup repository operations
 * Used by components that need to interact with the database
 */
export interface ICleanupRepository {
  /**
   * Find expired records in a table
   * @param tableName - Name of the table to search
   * @param cutoffDate - Date before which records are considered expired
   * @param batchSize - Maximum number of records to return
   * @returns Promise<Array<{id: bigint}>> - Array of expired record IDs
   */
  findExpiredRecords(
    tableName: string,
    cutoffDate: Date,
    batchSize: number,
  ): Promise<Array<{ id: bigint }>>;

  /**
   * Delete records by IDs
   * @param tableName - Name of the table to delete from
   * @param ids - Array of record IDs to delete
   * @returns Promise<number> - Number of records deleted
   */
  deleteRecordsByIds(tableName: string, ids: bigint[]): Promise<number>;

  /**
   * Find expired Players Wanted classifieds with creator email info
   * @param cutoffDate - Date before which records are considered expired
   * @param batchSize - Maximum number of records to return
   * @returns Promise<ExpiredPlayersWantedWithEmail[]> - Expired records with email info
   */
  findExpiredPlayersWantedWithEmail(
    cutoffDate: Date,
    batchSize: number,
  ): Promise<ExpiredPlayersWantedWithEmail[]>;

  /**
   * Find expired Teams Wanted classifieds with email info
   * @param cutoffDate - Date before which records are considered expired
   * @param batchSize - Maximum number of records to return
   * @returns Promise<ExpiredTeamsWantedWithEmail[]> - Expired records with email info
   */
  findExpiredTeamsWantedWithEmail(
    cutoffDate: Date,
    batchSize: number,
  ): Promise<ExpiredTeamsWantedWithEmail[]>;
}
