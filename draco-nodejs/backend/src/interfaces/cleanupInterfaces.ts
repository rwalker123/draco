// Cleanup Service Interfaces
// Follows Interface Segregation Principle to avoid fat interfaces

/**
 * Interface for cleanup execution operations
 * Used by components that need to perform actual cleanup tasks
 */
export interface ICleanupExecutor {
  /**
   * Clean up expired Players Wanted classifieds
   * @param expirationDays - Optional override for expiration days
   * @param batchSize - Optional override for batch size
   * @param enabled - Optional flag to enable/disable this cleanup
   * @returns Promise<number> - Number of records deleted
   */
  cleanupExpiredPlayersWanted(
    expirationDays?: number,
    batchSize?: number,
    enabled?: boolean,
  ): Promise<number>;

  /**
   * Clean up expired Teams Wanted classifieds
   * @param expirationDays - Optional override for expiration days
   * @param batchSize - Optional override for batch size
   * @param enabled - Optional flag to enable/disable this cleanup
   * @returns Promise<number> - Number of records deleted
   */
  cleanupExpiredTeamsWanted(
    expirationDays?: number,
    batchSize?: number,
    enabled?: boolean,
  ): Promise<number>;

  /**
   * Perform manual cleanup of all expired data
   * @param options - Optional cleanup parameters
   * @returns Promise<CleanupResult> - Result of cleanup operation
   */
  manualCleanup(options?: {
    batchSize?: number;
    expirationDays?: number;
    tableFilter?: string;
    dryRun?: boolean;
  }): Promise<CleanupResult>;
}

/**
 * Interface for cleanup scheduling operations
 * Used by components that need to manage cleanup timing
 */
export interface ICleanupScheduler {
  /**
   * Start the cleanup service
   */
  start(): void;

  /**
   * Stop the cleanup service
   */
  stop(): void;

  /**
   * Get the current status of the cleanup service
   * @returns CleanupStatus - Current service status
   */
  getStatus(): CleanupStatus;

  /**
   * Calculate the next scheduled cleanup time
   * @returns Date | null - Next cleanup time or null if not running
   */
  getNextCleanupTime(): Date | null;
}

/**
 * Combined interface for the main cleanup service
 * Combines executor and scheduler functionality
 */
export interface ICleanupService extends ICleanupExecutor, ICleanupScheduler {}

/**
 * Interface for cleanup configuration
 * Defines configurable parameters for the cleanup service
 */
export interface ICleanupConfig {
  /** Batch size for processing records */
  batchSize: number;

  /** Hour of day to run cleanup (0-23) */
  cleanupHour: number;

  /** Interval between cleanups in milliseconds */
  cleanupIntervalMs: number;

  /** Number of days after which records expire */
  expirationDays: number;

  /** Optional delay in milliseconds for test timing (tests only) */
  testDelayMs?: number;
}

/**
 * Result of a cleanup operation
 */
export interface CleanupResult {
  /** Number of expired Players Wanted records deleted */
  expiredPlayersWanted: number;

  /** Number of expired Teams Wanted records deleted */
  expiredTeamsWanted: number;

  /** Total number of records deleted */
  totalDeleted: number;

  /** Timestamp when cleanup was performed */
  timestamp: Date;

  /** Duration of cleanup operation in milliseconds */
  duration: number;
}

/**
 * Status of the cleanup service
 */
export interface CleanupStatus {
  /** Whether the service is currently running */
  isRunning: boolean;

  /** Next scheduled cleanup time */
  nextCleanup: Date | null;

  /** Last cleanup execution time */
  lastCleanup: Date | null;

  /** Whether the service is healthy */
  isHealthy: boolean;

  /** Any error messages from the last operation */
  lastError?: string;
}

/**
 * Expired Players Wanted classified with creator email info
 * Used for sending expiration notifications before deletion
 */
export interface ExpiredPlayersWantedWithEmail {
  id: bigint;
  accountId: bigint;
  teamEventName: string;
  dateCreated: Date;
  creatorEmail: string | null;
  creatorFirstName: string;
  creatorLastName: string;
  accountName: string;
}

/**
 * Expired Teams Wanted classified with email info
 * Used for sending expiration notifications before deletion
 */
export interface ExpiredTeamsWantedWithEmail {
  id: bigint;
  accountId: bigint;
  name: string;
  email: string;
  dateCreated: Date;
  accountName: string;
}
