// Bulk Role Assignment Operation following Strategy pattern
// Single Responsibility: Handles bulk role assignment to multiple users
// Open/Closed: Extensible through configuration and parameters

import {
  BulkOperation,
  BulkOperationConfig,
  BulkOperationProgress,
  BulkOperationResult,
  BulkAssignRoleParams,
  ValidationResult,
  DEFAULT_BULK_OPERATION_SETTINGS,
} from '../../types/bulkOperations';
import { EnhancedUser } from '../../types/userTable';
import { createUserManagementService } from '../userManagementService';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

export class BulkAssignRoleOperation implements BulkOperation {
  config: BulkOperationConfig = {
    id: 'assign-role',
    name: 'Assign Role',
    description: 'Assign a role to multiple users simultaneously',
    icon: PersonAddIcon,
    color: 'primary',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to assign this role to {count} user(s)?',
    maxBatchSize: 50,
    allowPartialFailure: true,
    estimatedTimePerUser: 500,
  };

  private userService: ReturnType<typeof createUserManagementService> | null = null;

  constructor(private token: string) {
    this.userService = createUserManagementService(token);
  }

  // Validate operation parameters and user selection
  validate(users: EnhancedUser[], params: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if users are provided
    if (!users || users.length === 0) {
      errors.push('No users selected for role assignment');
    }

    // Validate parameters
    const roleParams = params as unknown as BulkAssignRoleParams;
    if (!roleParams.roleId) {
      errors.push('Role ID is required');
    }

    if (!roleParams.roleData) {
      errors.push('Role data is required');
    }

    // Check batch size limits
    if (users.length > this.config.maxBatchSize!) {
      warnings.push(
        `Selected ${users.length} users exceeds recommended batch size of ${this.config.maxBatchSize}. Consider processing in smaller batches.`,
      );
    }

    // Check for users who already have the role
    const usersWithRole = users.filter((user) =>
      user.roles?.some(
        (role) => role.roleId === roleParams.roleId && role.roleData === roleParams.roleData,
      ),
    );

    if (usersWithRole.length > 0 && !roleParams.skipExisting) {
      warnings.push(
        `${usersWithRole.length} user(s) already have this role. Enable "Skip Existing" to ignore them.`,
      );
    }

    // Validate role requirements (example: team roles require seasonId)
    const teamRoleIds = [
      '777D771B-1CBA-4126-B8F3-DD7F3478D40E', // TEAM_ADMIN
      '55FD3262-343F-4000-9561-6BB7F658DEB7', // TEAM_PHOTO_ADMIN
    ];

    if (teamRoleIds.includes(roleParams.roleId) && !roleParams.seasonId) {
      errors.push('Season ID is required for team-based roles');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      affectedCount: roleParams.skipExisting ? users.length - usersWithRole.length : users.length,
    };
  }

  // Get required permissions for role assignment
  getRequiredPermissions(): string[] {
    return ['manage_users', 'assign_roles'];
  }

  // Execute bulk role assignment with progress tracking
  async execute(
    users: EnhancedUser[],
    params: Record<string, unknown>,
    onProgress: (progress: BulkOperationProgress) => void,
    abortSignal?: AbortSignal,
  ): Promise<BulkOperationProgress> {
    const roleParams = params as unknown as BulkAssignRoleParams;

    if (!this.userService) {
      throw new Error('User service not initialized');
    }

    // Initialize progress
    const progress: BulkOperationProgress = {
      total: users.length,
      completed: 0,
      failed: 0,
      currentOperation: 'Assigning roles...',
      isRunning: true,
      startTime: new Date(),
      results: [],
    };

    // Filter users if skipExisting is enabled
    let targetUsers = users;
    if (roleParams.skipExisting) {
      targetUsers = users.filter(
        (user) =>
          !user.roles?.some(
            (role) => role.roleId === roleParams.roleId && role.roleData === roleParams.roleData,
          ),
      );

      // Add skipped users to results
      const skippedUsers = users.filter((user) => !targetUsers.includes(user));
      progress.results = skippedUsers.map((user) => ({
        success: true,
        user,
        data: { status: 'skipped', reason: 'User already has this role' },
      }));
      progress.completed = skippedUsers.length;
    }

    // Update initial progress
    onProgress(progress);

    // Process users in batches for better performance
    const batchSize = DEFAULT_BULK_OPERATION_SETTINGS.batchSize;
    const batches = this.createBatches(targetUsers, batchSize);

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        // Check if operation was cancelled
        if (abortSignal?.aborted) {
          progress.isRunning = false;
          progress.currentOperation = 'Operation cancelled';
          onProgress(progress);
          throw new Error('Operation was cancelled');
        }

        const batch = batches[batchIndex];
        progress.currentOperation = `Processing batch ${batchIndex + 1} of ${batches.length}...`;
        onProgress(progress);

        // Process batch concurrently with controlled concurrency
        const batchPromises = batch.map(async (user, userIndex) => {
          const absoluteIndex = batchIndex * batchSize + userIndex;

          try {
            // Update current user being processed
            progress.currentUser = user.displayName;
            progress.currentOperation = `Assigning role to ${user.displayName}...`;
            onProgress(progress);

            // Execute role assignment
            await this.userService!.assignRole(
              roleParams.roleData, // accountId or specific data
              user.id,
              roleParams.roleId,
              roleParams.roleData,
              roleParams.seasonId,
            );

            // Success result
            const result: BulkOperationResult = {
              success: true,
              user,
              data: {
                roleId: roleParams.roleId,
                roleData: roleParams.roleData,
                seasonId: roleParams.seasonId,
              },
            };

            progress.results[absoluteIndex] = result;
            progress.completed++;

            // Calculate estimated time remaining
            if (progress.startTime && progress.completed > 0) {
              const elapsed = Date.now() - progress.startTime.getTime();
              const avgTimePerUser = elapsed / progress.completed;
              const remaining = progress.total - progress.completed;
              progress.estimatedTimeRemaining = Math.round(remaining * avgTimePerUser);
            }

            return result;
          } catch (error) {
            // Failure result
            const result: BulkOperationResult = {
              success: false,
              user,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            };

            progress.results[absoluteIndex] = result;
            progress.failed++;

            return result;
          }
        });

        // Wait for batch to complete
        await Promise.all(batchPromises);

        // Update progress after batch completion
        progress.currentOperation = `Completed batch ${batchIndex + 1} of ${batches.length}`;
        onProgress(progress);

        // Small delay between batches to prevent overwhelming the server
        if (batchIndex < batches.length - 1) {
          await this.delay(100);
        }
      }

      // Final progress update
      progress.isRunning = false;
      progress.currentOperation = 'Role assignment completed';
      progress.currentUser = undefined;
      progress.estimatedTimeRemaining = 0;

      // Generate summary message
      const successCount = progress.completed;
      const failureCount = progress.failed;
      const skippedCount = roleParams.skipExisting ? users.length - targetUsers.length : 0;

      if (failureCount > 0) {
        progress.currentOperation = `Completed with ${failureCount} failure(s). ${successCount} role(s) assigned successfully.`;
      } else {
        progress.currentOperation = `Successfully assigned role to ${successCount} user(s)${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}.`;
      }

      onProgress(progress);
      return progress;
    } catch (error) {
      // Handle unexpected errors
      progress.isRunning = false;
      progress.currentOperation = `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onProgress(progress);
      throw error;
    }
  }

  // Helper method to create user batches
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Helper method for delays
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Static factory method
  static create(token: string): BulkAssignRoleOperation {
    return new BulkAssignRoleOperation(token);
  }
}
