// Enhanced bulk operations types following SOLID principles
// Single Responsibility: Each interface handles one aspect of bulk operations

import { EnhancedUser } from './userTable';

// Core operation result interface
export interface BulkOperationResult {
  success: boolean;
  user: EnhancedUser;
  error?: string;
  data?: unknown;
}

// Progress tracking state
export interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  currentOperation?: string;
  currentUser?: string;
  isRunning: boolean;
  startTime?: Date;
  estimatedTimeRemaining?: number;
  results: BulkOperationResult[];
}

// Operation configuration
export interface BulkOperationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  maxBatchSize?: number;
  allowPartialFailure: boolean;
  estimatedTimePerUser?: number; // milliseconds
}

// Base operation interface (Strategy pattern)
export interface BulkOperation {
  config: BulkOperationConfig;
  execute(
    users: EnhancedUser[],
    params: Record<string, unknown>,
    onProgress: (progress: BulkOperationProgress) => void,
    abortSignal?: AbortSignal,
  ): Promise<BulkOperationProgress>;
  validate(users: EnhancedUser[], params: Record<string, unknown>): ValidationResult;
  getRequiredPermissions(): string[];
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  affectedCount: number;
}

// Operation parameters for different bulk operations
export interface BulkAssignRoleParams {
  roleId: string;
  roleData: string;
  seasonId?: string;
  skipExisting?: boolean;
}

export interface BulkRemoveRoleParams {
  roleId: string;
  roleData?: string;
  removeAll?: boolean;
}

export interface BulkExportParams {
  format: 'csv' | 'xlsx' | 'json';
  includeFields: string[];
  includeRoles: boolean;
  includeContactInfo: boolean;
  filename?: string;
}

export interface BulkUpdateParams {
  field: string;
  value: unknown;
  updateCondition?: (user: EnhancedUser) => boolean;
}

// Operation context for execution
export interface BulkOperationContext {
  accountId: string;
  currentSeasonId?: string;
  userToken: string;
  permissions: string[];
  onProgress: (progress: BulkOperationProgress) => void;
  abortSignal?: AbortSignal;
}

// Manager interface for handling operations
export interface BulkOperationsManager {
  // Operation management
  registerOperation(operation: BulkOperation): void;
  getAvailableOperations(users: EnhancedUser[]): BulkOperation[];
  executeOperation(
    operationId: string,
    users: EnhancedUser[],
    params: Record<string, unknown>,
    context: BulkOperationContext,
  ): Promise<BulkOperationProgress>;

  // Progress management
  getOperationProgress(operationId: string): BulkOperationProgress | null;
  cancelOperation(operationId: string): Promise<void>;

  // History and logging
  getOperationHistory(): BulkOperationHistory[];
  clearHistory(): void;
}

// Operation history for audit trail
export interface BulkOperationHistory {
  id: string;
  operationId: string;
  operationName: string;
  userCount: number;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: BulkOperationProgress;
  initiatedBy: string;
}

// Dialog props for the bulk operation UI
export interface BulkOperationDialogProps {
  open: boolean;
  onClose: () => void;
  operation: BulkOperation | null;
  users: EnhancedUser[];
  onExecute: (params: Record<string, unknown>) => Promise<void>;
  initialParams?: Record<string, unknown>;
  title?: string;
}

// Toolbar integration props
export interface BulkOperationToolbarProps {
  selectedUsers: EnhancedUser[];
  availableOperations: BulkOperation[];
  onOperationSelect: (operation: BulkOperation) => void;
  isOperationRunning: boolean;
  canManageUsers: boolean;
}

// Progress component props
export interface BulkOperationProgressProps {
  progress: BulkOperationProgress;
  operation: BulkOperation;
  onCancel?: () => void;
  onViewDetails?: () => void;
  showDetails?: boolean;
}

// Result summary props
export interface BulkOperationResultProps {
  progress: BulkOperationProgress;
  operation: BulkOperation;
  onClose: () => void;
  onRetryFailed?: () => void;
  onExportResults?: () => void;
}

// Default operation configurations
export const DEFAULT_BULK_OPERATIONS: Partial<BulkOperationConfig>[] = [
  {
    id: 'assign-role',
    name: 'Assign Role',
    description: 'Assign a role to multiple users',
    color: 'primary',
    requiresConfirmation: true,
    maxBatchSize: 50,
    allowPartialFailure: true,
    estimatedTimePerUser: 500,
  },
  {
    id: 'remove-role',
    name: 'Remove Role',
    description: 'Remove roles from multiple users',
    color: 'warning',
    requiresConfirmation: true,
    maxBatchSize: 50,
    allowPartialFailure: true,
    estimatedTimePerUser: 400,
  },
  {
    id: 'export-users',
    name: 'Export Users',
    description: 'Export user data to various formats',
    color: 'info',
    requiresConfirmation: false,
    maxBatchSize: 1000,
    allowPartialFailure: false,
    estimatedTimePerUser: 50,
  },
  {
    id: 'send-notification',
    name: 'Send Notification',
    description: 'Send notifications to multiple users',
    color: 'secondary',
    requiresConfirmation: true,
    maxBatchSize: 100,
    allowPartialFailure: true,
    estimatedTimePerUser: 200,
  },
];

// Performance optimization settings
export interface BulkOperationSettings {
  maxConcurrentOperations: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  progressUpdateInterval: number;
  enableLogging: boolean;
  enableHistory: boolean;
}

export const DEFAULT_BULK_OPERATION_SETTINGS: BulkOperationSettings = {
  maxConcurrentOperations: 3,
  batchSize: 10,
  retryAttempts: 2,
  retryDelay: 1000,
  progressUpdateInterval: 100,
  enableLogging: true,
  enableHistory: true,
};
