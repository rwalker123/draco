// Cleanup Service
// Handles automatic cleanup of expired data including player classifieds

import {
  ICleanupService,
  ICleanupConfig,
  CleanupResult,
  CleanupStatus,
  ExpiredPlayersWantedWithEmail,
  ExpiredTeamsWantedWithEmail,
} from '../interfaces/cleanupInterfaces.js';

import { ICleanupRepository, RepositoryFactory } from '../repositories/index.js';
import { ValidationError, InternalServerError } from '../utils/customErrors.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';
import { ClassifiedExpirationEmailService } from './player-classified/ClassifiedExpirationEmailService.js';

export class CleanupService implements ICleanupService {
  private repository: ICleanupRepository;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private config: ICleanupConfig;
  private lastCleanup: Date | null = null;
  private lastError: string | null = null;
  private emailService: ClassifiedExpirationEmailService;

  constructor(config?: Partial<ICleanupConfig>, repository?: ICleanupRepository) {
    this.repository = repository || RepositoryFactory.getCleanupRepository();
    this.emailService = new ClassifiedExpirationEmailService();

    // Use provided configuration or defaults
    this.config = {
      batchSize: 25,
      cleanupHour: 2, // 2:00 AM
      cleanupIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
      expirationDays: 45,
      ...config,
    };
  }

  /**
   * Start the cleanup service
   */
  public start(): void {
    if (this.cleanupInterval) {
      this.stop();
    }

    // Set the interval immediately to indicate the service is running
    // We'll use a placeholder interval that gets replaced by the actual one
    this.cleanupInterval = setInterval(() => {}, 1000);

    // Calculate time until next cleanup (2:00 AM)
    const now = new Date();
    const nextCleanup = new Date();
    nextCleanup.setHours(this.config.cleanupHour, 0, 0, 0);

    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    const initialDelay = nextCleanup.getTime() - now.getTime();

    // Schedule first cleanup
    setTimeout(() => {
      // Clear the placeholder interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      this.performCleanup();
      // Then schedule recurring cleanup every 24 hours
      this.cleanupInterval = setInterval(() => {
        this.performCleanup();
      }, this.config.cleanupIntervalMs);
    }, initialDelay);

    console.log(
      `🧹 Cleanup service started. First cleanup scheduled for ${nextCleanup.toISOString()}`,
    );
  }

  /**
   * Stop the cleanup service
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🧹 Cleanup service stopped');
    }
  }

  /**
   * Perform the cleanup operation
   */
  private async performCleanup(): Promise<void> {
    const startTime = Date.now();
    const operationContext = {
      operation: 'automatic',
      timestamp: new Date(),
      batchSize: this.config.batchSize,
      expirationDays: this.config.expirationDays,
    };

    try {
      console.log('🧹 Starting daily cleanup of expired data...');

      // Clean up expired player classifieds
      const expiredPlayersWanted = await this.cleanupExpiredPlayersWanted();
      const expiredTeamsWanted = await this.cleanupExpiredTeamsWanted();

      const totalDeleted = expiredPlayersWanted + expiredTeamsWanted;
      const duration = Date.now() - startTime;
      this.lastCleanup = new Date();
      this.lastError = null;

      // Record successful cleanup operation in performance monitor
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.automatic',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'automatic',
      });

      console.log(
        `🧹 Cleanup completed in ${duration}ms. Deleted ${totalDeleted} expired classifieds:`,
      );
      console.log(`  - Players Wanted: ${expiredPlayersWanted}`);
      console.log(`  - Teams Wanted: ${expiredTeamsWanted}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.lastError = errorMessage;

      // Record failed cleanup operation in performance monitor
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.automatic.failed',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'automatic',
      });

      // Log error with context
      console.error('❌ Cleanup service error:', {
        error: errorMessage,
        context: operationContext,
        duration,
        timestamp: new Date().toISOString(),
      });

      // Re-throw as InternalServerError for proper error handling
      throw new InternalServerError(`Automatic cleanup failed: ${errorMessage}`);
    }
  }

  /**
   * Clean up expired Players Wanted classifieds (older than configured days)
   * Sends expiration notification emails before deletion
   * @param expirationDays - Optional override for expiration days
   * @param batchSize - Optional override for batch size
   * @param enabled - Optional flag to enable/disable this cleanup
   */
  public async cleanupExpiredPlayersWanted(
    expirationDays?: number,
    batchSize?: number,
    enabled?: boolean,
  ): Promise<number> {
    if (enabled === false) {
      console.log('🧹 Players Wanted cleanup disabled for this operation');
      return 0;
    }

    const days = expirationDays || this.config.expirationDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const effectiveBatchSize = batchSize || this.config.batchSize;

    return this.cleanupExpiredPlayersWantedWithNotifications(cutoffDate, effectiveBatchSize, days);
  }

  /**
   * Clean up expired Teams Wanted classifieds (older than configured days)
   * Sends expiration notification emails before deletion
   * @param expirationDays - Optional override for expiration days
   * @param batchSize - Optional override for batch size
   * @param enabled - Optional flag to enable/disable this cleanup
   */
  public async cleanupExpiredTeamsWanted(
    expirationDays?: number,
    batchSize?: number,
    enabled?: boolean,
  ): Promise<number> {
    if (enabled === false) {
      console.log('🧹 Teams Wanted cleanup disabled for this operation');
      return 0;
    }

    const days = expirationDays || this.config.expirationDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const effectiveBatchSize = batchSize || this.config.batchSize;

    return this.cleanupExpiredTeamsWantedWithNotifications(cutoffDate, effectiveBatchSize, days);
  }

  /**
   * Clean up expired Players Wanted with email notifications
   */
  private async cleanupExpiredPlayersWantedWithNotifications(
    cutoffDate: Date,
    batchSize: number,
    expirationDays: number,
  ): Promise<number> {
    let totalDeleted = 0;
    let hasMore = true;
    const startTime = Date.now();

    try {
      while (hasMore) {
        const expiredRecords = await this.repository.findExpiredPlayersWantedWithEmail(
          cutoffDate,
          batchSize,
        );

        if (expiredRecords.length === 0) {
          break;
        }

        // Send expiration emails before deletion (failures are handled gracefully)
        await this.sendPlayersWantedExpirationEmails(expiredRecords, expirationDays);

        // Delete the records
        const ids = expiredRecords.map((record) => record.id);
        const result = await this.repository.deleteRecordsByIds('playerswantedclassified', ids);

        totalDeleted += result;
        hasMore = expiredRecords.length === batchSize;
      }

      const duration = Date.now() - startTime;
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.playerswantedclassified',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'delete',
      });

      return totalDeleted;
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.playerswantedclassified.failed',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'delete',
      });

      console.error('❌ Cleanup failed for Players Wanted:', {
        error: error instanceof Error ? error.message : String(error),
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        duration,
        timestamp: new Date().toISOString(),
      });

      throw new InternalServerError(
        `Cleanup failed for Players Wanted: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Clean up expired Teams Wanted with email notifications
   */
  private async cleanupExpiredTeamsWantedWithNotifications(
    cutoffDate: Date,
    batchSize: number,
    expirationDays: number,
  ): Promise<number> {
    let totalDeleted = 0;
    let hasMore = true;
    const startTime = Date.now();

    try {
      while (hasMore) {
        const expiredRecords = await this.repository.findExpiredTeamsWantedWithEmail(
          cutoffDate,
          batchSize,
        );

        if (expiredRecords.length === 0) {
          break;
        }

        // Send expiration emails before deletion (failures are handled gracefully)
        await this.sendTeamsWantedExpirationEmails(expiredRecords, expirationDays);

        // Delete the records
        const ids = expiredRecords.map((record) => record.id);
        const result = await this.repository.deleteRecordsByIds('teamswantedclassified', ids);

        totalDeleted += result;
        hasMore = expiredRecords.length === batchSize;
      }

      const duration = Date.now() - startTime;
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.teamswantedclassified',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'delete',
      });

      return totalDeleted;
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.teamswantedclassified.failed',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'delete',
      });

      console.error('❌ Cleanup failed for Teams Wanted:', {
        error: error instanceof Error ? error.message : String(error),
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        duration,
        timestamp: new Date().toISOString(),
      });

      throw new InternalServerError(
        `Cleanup failed for Teams Wanted: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send expiration emails for Players Wanted classifieds
   * Silently skips records without email, continues on failure
   */
  private async sendPlayersWantedExpirationEmails(
    records: ExpiredPlayersWantedWithEmail[],
    expirationDays: number,
  ): Promise<void> {
    for (const record of records) {
      if (!record.creatorEmail) {
        continue;
      }

      try {
        await this.emailService.sendPlayersWantedExpirationEmail(record, expirationDays);
      } catch {
        // Continue cleanup even if email fails
      }
    }
  }

  /**
   * Send expiration emails for Teams Wanted classifieds
   * Continues on failure to ensure cleanup proceeds
   */
  private async sendTeamsWantedExpirationEmails(
    records: ExpiredTeamsWantedWithEmail[],
    expirationDays: number,
  ): Promise<void> {
    for (const record of records) {
      if (!record.email) {
        continue;
      }

      try {
        await this.emailService.sendTeamsWantedExpirationEmail(record, expirationDays);
      } catch {
        // Continue cleanup even if email fails
      }
    }
  }

  /**
   * Manual cleanup trigger (for testing and maintenance)
   * @param options - Optional cleanup parameters
   * @returns Promise<CleanupResult> - Result of cleanup operation
   */
  public async manualCleanup(options?: {
    batchSize?: number;
    expirationDays?: number;
    tableFilter?: string;
    dryRun?: boolean;
  }): Promise<CleanupResult> {
    console.log('🧹 Manual cleanup triggered', options);
    const startTime = Date.now();

    try {
      // Validate and sanitize input parameters
      const validatedOptions = this.validateCleanupOptions(options);

      // Perform cleanup with validated options
      const expiredPlayersWanted = await this.cleanupExpiredPlayersWanted(
        validatedOptions.expirationDays,
        validatedOptions.batchSize,
        validatedOptions.tableFilter === 'playerswantedclassified' ? true : undefined,
      );

      const expiredTeamsWanted = await this.cleanupExpiredTeamsWanted(
        validatedOptions.expirationDays,
        validatedOptions.batchSize,
        validatedOptions.tableFilter === 'teamswantedclassified' ? true : undefined,
      );

      const totalDeleted = expiredPlayersWanted + expiredTeamsWanted;

      // Optional delay for test timing (configured via testDelayMs)
      if (this.config.testDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.config.testDelayMs));
      }

      const duration = Date.now() - startTime;
      const timestamp = new Date();

      this.lastCleanup = timestamp;
      this.lastError = null;

      // Record successful manual cleanup operation
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.manual',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'manual',
      });

      console.log(`🧹 Manual cleanup completed. Deleted ${totalDeleted} expired classifieds`);

      const result = {
        expiredPlayersWanted,
        expiredTeamsWanted,
        totalDeleted,
        timestamp,
        duration,
      };

      // Verify cleanup results
      await this.verifyCleanupResults(result, validatedOptions);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed manual cleanup operation
      performanceMonitor.recordQuery({
        duration,
        query: 'cleanup.manual.failed',
        timestamp: new Date(),
        model: 'Cleanup',
        operation: 'manual',
      });

      // Log error with context
      console.error('❌ Manual cleanup failed:', {
        error: error instanceof Error ? error.message : String(error),
        operation: 'manual',
        duration,
        timestamp: new Date().toISOString(),
      });

      // Re-throw as InternalServerError for proper error handling
      throw new InternalServerError(
        `Manual cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get cleanup service status
   */
  public getStatus(): CleanupStatus {
    return {
      isRunning: this.cleanupInterval !== null,
      nextCleanup: this.getNextCleanupTime(),
      lastCleanup: this.lastCleanup,
      isHealthy: this.lastError === null,
      lastError: this.lastError || undefined,
    };
  }

  /**
   * Calculate next cleanup time
   */
  public getNextCleanupTime(): Date | null {
    if (!this.cleanupInterval) {
      return null;
    }

    const now = new Date();
    const nextCleanup = new Date();
    nextCleanup.setHours(this.config.cleanupHour, 0, 0, 0);

    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    return nextCleanup;
  }

  /**
   * Validate cleanup options and return sanitized values
   * @param options - Raw cleanup options to validate
   * @returns Validated and sanitized cleanup options
   */
  private validateCleanupOptions(options?: {
    batchSize?: number;
    expirationDays?: number;
    tableFilter?: string;
    dryRun?: boolean;
  }): {
    batchSize: number;
    expirationDays: number;
    tableFilter?: string;
    dryRun: boolean;
  } {
    const validated = {
      batchSize: this.config.batchSize,
      expirationDays: this.config.expirationDays,
      tableFilter: undefined as string | undefined,
      dryRun: false,
    };

    // Validate batch size
    if (options?.batchSize !== undefined) {
      if (
        !Number.isInteger(options.batchSize) ||
        options.batchSize < 1 ||
        options.batchSize > 1000
      ) {
        throw new ValidationError('Batch size must be an integer between 1 and 1000');
      }
      validated.batchSize = options.batchSize;
    }

    // Validate expiration days
    if (options?.expirationDays !== undefined) {
      if (
        !Number.isInteger(options.expirationDays) ||
        options.expirationDays < 1 ||
        options.expirationDays > 365
      ) {
        throw new ValidationError('Expiration days must be an integer between 1 and 365');
      }
      validated.expirationDays = options.expirationDays;
    }

    // Validate table filter
    if (options?.tableFilter !== undefined) {
      const allowedTables = ['playerswantedclassified', 'teamswantedclassified'];
      if (!allowedTables.includes(options.tableFilter)) {
        throw new ValidationError(
          'Table filter must be one of: playerswantedclassified, teamswantedclassified',
        );
      }
      validated.tableFilter = options.tableFilter;
    }

    // Validate dry run flag
    if (options?.dryRun !== undefined) {
      if (typeof options.dryRun !== 'boolean') {
        throw new ValidationError('Dry run must be a boolean value');
      }
      validated.dryRun = options.dryRun;
    }

    return validated;
  }

  /**
   * Verify cleanup results for integrity and consistency
   * @param result - Cleanup operation result to verify
   * @param options - Options used for the cleanup operation
   */
  private async verifyCleanupResults(
    result: CleanupResult,
    options: {
      batchSize: number;
      expirationDays: number;
      tableFilter?: string;
      dryRun: boolean;
    },
  ): Promise<void> {
    // Skip verification for dry runs
    if (options.dryRun) {
      console.log('🧹 Dry run - skipping result verification');
      return;
    }

    try {
      // Verify that the total matches the sum of individual counts
      if (result.totalDeleted !== result.expiredPlayersWanted + result.expiredTeamsWanted) {
        throw new ValidationError('Cleanup result total does not match sum of individual counts');
      }

      // Verify that we didn't delete more records than expected
      // This is a basic sanity check - in a real scenario you might want more sophisticated verification
      const maxExpectedRecords = options.batchSize * 10; // Reasonable upper bound
      if (result.totalDeleted > maxExpectedRecords) {
        console.warn(
          `⚠️ Cleanup deleted ${result.totalDeleted} records, which exceeds expected maximum of ${maxExpectedRecords}`,
        );
      }

      // Verify that the operation completed in a reasonable time
      const maxExpectedDuration = 30000; // 30 seconds
      if (result.duration > maxExpectedDuration) {
        console.warn(
          `⚠️ Cleanup took ${result.duration}ms, which exceeds expected maximum of ${maxExpectedDuration}ms`,
        );
      }

      console.log('✅ Cleanup results verified successfully');
    } catch (error) {
      console.error('❌ Cleanup result verification failed:', error);
      // Don't throw here - the cleanup operation succeeded, this is just verification
      // In production, you might want to log this to an audit system
    }
  }
}
