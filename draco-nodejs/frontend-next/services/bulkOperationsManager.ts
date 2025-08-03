// Enhanced Bulk Operations Manager following SOLID principles
// Single Responsibility: Manages execution of bulk operations
// Open/Closed: Extensible through operation registration
// Dependency Inversion: Depends on abstractions, not concrete implementations

import {
  BulkOperation,
  BulkOperationContext,
  BulkOperationProgress,
  BulkOperationHistory,
  BulkOperationsManager,
  BulkOperationSettings,
  DEFAULT_BULK_OPERATION_SETTINGS,
} from '../types/bulkOperations';
import { EnhancedUser } from '../types/userTable';

export class EnhancedBulkOperationsManager implements BulkOperationsManager {
  private operations = new Map<string, BulkOperation>();
  private runningOperations = new Map<string, AbortController>();
  private progressTrackers = new Map<string, BulkOperationProgress>();
  private operationHistory: BulkOperationHistory[] = [];
  private settings: BulkOperationSettings;

  constructor(settings: Partial<BulkOperationSettings> = {}) {
    this.settings = { ...DEFAULT_BULK_OPERATION_SETTINGS, ...settings };
  }

  // Operation Registration (Open/Closed Principle)
  registerOperation(operation: BulkOperation): void {
    this.operations.set(operation.config.id, operation);
  }

  // Get available operations based on user selection and permissions
  getAvailableOperations(users: EnhancedUser[]): BulkOperation[] {
    if (users.length === 0) return [];

    return Array.from(this.operations.values()).filter((operation) => {
      // Check if operation is applicable to the selected users
      const validation = operation.validate(users, {});
      return validation.isValid || validation.warnings.length > 0;
    });
  }

  // Execute bulk operation with comprehensive progress tracking
  async executeOperation(
    operationId: string,
    users: EnhancedUser[],
    params: Record<string, unknown>,
    context: BulkOperationContext,
  ): Promise<BulkOperationProgress> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    // Validate operation
    const validation = operation.validate(users, params);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check permissions
    const requiredPermissions = operation.getRequiredPermissions();
    const hasPermissions = requiredPermissions.every((permission) =>
      context.permissions.includes(permission),
    );
    if (!hasPermissions) {
      throw new Error('Insufficient permissions for this operation');
    }

    // Create unique execution ID
    const executionId = `${operationId}-${Date.now()}`;

    // Setup abort controller
    const abortController = new AbortController();
    this.runningOperations.set(executionId, abortController);

    // Initialize progress tracking
    const initialProgress: BulkOperationProgress = {
      total: users.length,
      completed: 0,
      failed: 0,
      currentOperation: operation.config.name,
      isRunning: true,
      startTime: new Date(),
      results: [],
    };

    this.progressTrackers.set(executionId, initialProgress);

    // Add to history
    const historyEntry: BulkOperationHistory = {
      id: executionId,
      operationId,
      operationName: operation.config.name,
      userCount: users.length,
      startTime: new Date(),
      status: 'running',
      progress: initialProgress,
      initiatedBy: context.userToken, // In real app, extract user info from token
    };

    if (this.settings.enableHistory) {
      this.operationHistory.unshift(historyEntry);
      // Keep only last 50 entries
      if (this.operationHistory.length > 50) {
        this.operationHistory = this.operationHistory.slice(0, 50);
      }
    }

    // Enhanced progress callback
    const progressCallback = (progress: BulkOperationProgress) => {
      this.progressTrackers.set(executionId, progress);
      context.onProgress(progress);

      // Update history
      if (this.settings.enableHistory) {
        const historyIndex = this.operationHistory.findIndex((h) => h.id === executionId);
        if (historyIndex >= 0) {
          this.operationHistory[historyIndex].progress = progress;
          if (!progress.isRunning) {
            this.operationHistory[historyIndex].endTime = new Date();
            this.operationHistory[historyIndex].status =
              progress.failed === 0
                ? 'completed'
                : progress.completed === 0
                  ? 'failed'
                  : 'completed';
          }
        }
      }
    };

    try {
      // Execute operation with progress tracking
      const finalProgress = await operation.execute(
        users,
        params,
        progressCallback,
        abortController.signal,
      );

      // Final cleanup
      this.runningOperations.delete(executionId);

      if (this.settings.enableLogging) {
        console.log(`Bulk operation ${operationId} completed:`, {
          total: finalProgress.total,
          completed: finalProgress.completed,
          failed: finalProgress.failed,
          duration: finalProgress.startTime ? Date.now() - finalProgress.startTime.getTime() : 0,
        });
      }

      return finalProgress;
    } catch (error) {
      // Handle operation failure
      this.runningOperations.delete(executionId);

      const currentProgress = this.progressTrackers.get(executionId);
      if (currentProgress) {
        const errorProgress: BulkOperationProgress = {
          ...currentProgress,
          isRunning: false,
          currentOperation: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
        this.progressTrackers.set(executionId, errorProgress);
        context.onProgress(errorProgress);
      }

      // Update history
      if (this.settings.enableHistory) {
        const historyIndex = this.operationHistory.findIndex((h) => h.id === executionId);
        if (historyIndex >= 0) {
          this.operationHistory[historyIndex].status = 'failed';
          this.operationHistory[historyIndex].endTime = new Date();
        }
      }

      throw error;
    }
  }

  // Get current progress for an operation
  getOperationProgress(operationId: string): BulkOperationProgress | null {
    return this.progressTrackers.get(operationId) || null;
  }

  // Cancel running operation
  async cancelOperation(operationId: string): Promise<void> {
    const abortController = this.runningOperations.get(operationId);
    if (abortController) {
      abortController.abort();
      this.runningOperations.delete(operationId);

      // Update progress
      const currentProgress = this.progressTrackers.get(operationId);
      if (currentProgress) {
        const cancelledProgress: BulkOperationProgress = {
          ...currentProgress,
          isRunning: false,
          currentOperation: 'Operation cancelled',
        };
        this.progressTrackers.set(operationId, cancelledProgress);
      }

      // Update history
      if (this.settings.enableHistory) {
        const historyIndex = this.operationHistory.findIndex((h) => h.id === operationId);
        if (historyIndex >= 0) {
          this.operationHistory[historyIndex].status = 'cancelled';
          this.operationHistory[historyIndex].endTime = new Date();
        }
      }

      if (this.settings.enableLogging) {
        console.log(`Bulk operation ${operationId} cancelled`);
      }
    }
  }

  // Get operation history
  getOperationHistory(): BulkOperationHistory[] {
    return [...this.operationHistory];
  }

  // Clear operation history
  clearHistory(): void {
    this.operationHistory = [];
    console.log('Bulk operations history cleared');
  }

  // Utility methods

  // Get running operations count
  getRunningOperationsCount(): number {
    return this.runningOperations.size;
  }

  // Check if max concurrent operations reached
  canStartNewOperation(): boolean {
    return this.runningOperations.size < this.settings.maxConcurrentOperations;
  }

  // Get operation statistics
  getOperationStats() {
    const history = this.getOperationHistory();
    const stats = {
      total: history.length,
      completed: history.filter((h) => h.status === 'completed').length,
      failed: history.filter((h) => h.status === 'failed').length,
      cancelled: history.filter((h) => h.status === 'cancelled').length,
      running: history.filter((h) => h.status === 'running').length,
    };

    // Calculate success rate
    const finishedOperations = stats.completed + stats.failed;
    const successRate = finishedOperations > 0 ? (stats.completed / finishedOperations) * 100 : 0;

    return {
      ...stats,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  // Cleanup completed operations older than specified time
  cleanupOldOperations(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    const beforeCount = this.operationHistory.length;

    this.operationHistory = this.operationHistory.filter((operation) => {
      return operation.status === 'running' || !operation.endTime || operation.endTime > cutoffTime;
    });

    const removedCount = beforeCount - this.operationHistory.length;
    if (removedCount > 0 && this.settings.enableLogging) {
      console.log(`Cleaned up ${removedCount} old bulk operations from history`);
    }
  }

  // Update settings
  updateSettings(newSettings: Partial<BulkOperationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Bulk operations settings updated:', newSettings);
  }

  // Get current settings
  getSettings(): BulkOperationSettings {
    return { ...this.settings };
  }
}

// Singleton instance for application-wide use
export const bulkOperationsManager = new EnhancedBulkOperationsManager();

// Helper function to create manager with custom settings
export const createBulkOperationsManager = (settings?: Partial<BulkOperationSettings>) => {
  return new EnhancedBulkOperationsManager(settings);
};
