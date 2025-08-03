// Bulk Export Operation following Strategy pattern
// Single Responsibility: Handles exporting user data to various formats
// Open/Closed: Extensible through export format strategies

import {
  BulkOperation,
  BulkOperationConfig,
  BulkOperationProgress,
  BulkExportParams,
  ValidationResult,
} from '../../types/bulkOperations';
import { EnhancedUser } from '../../types/userTable';
import { Download as DownloadIcon } from '@mui/icons-material';

// Export format strategies
interface ExportFormatter {
  format(users: EnhancedUser[], params: BulkExportParams): string | Blob;
  getContentType(): string;
  getFileExtension(): string;
}

// CSV formatter
class CSVFormatter implements ExportFormatter {
  format(users: EnhancedUser[], params: BulkExportParams): string {
    const headers = this.getHeaders(params);
    const rows = users.map((user) => this.formatUserRow(user, params));

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  getContentType(): string {
    return 'text/csv';
  }

  getFileExtension(): string {
    return 'csv';
  }

  private getHeaders(params: BulkExportParams): string[] {
    const headers: string[] = [];

    if (params.includeFields.includes('name')) {
      headers.push('First Name', 'Last Name', 'Display Name');
    }

    if (params.includeFields.includes('contact')) {
      headers.push('Email', 'Phone');
    }

    if (params.includeContactInfo) {
      headers.push('Address', 'City', 'State', 'ZIP', 'Date of Birth');
    }

    if (params.includeRoles) {
      headers.push('Roles', 'Role Count');
    }

    headers.push('Last Activity', 'Has Contact Info');

    return headers.map((header) => `"${header}"`);
  }

  private formatUserRow(user: EnhancedUser, params: BulkExportParams): string[] {
    const row: string[] = [];

    if (params.includeFields.includes('name')) {
      row.push(
        `"${user.firstName || ''}"`,
        `"${user.lastName || ''}"`,
        `"${user.displayName || ''}"`,
      );
    }

    if (params.includeFields.includes('contact')) {
      row.push(`"${user.email || ''}"`, `"${user.primaryPhone || ''}"`);
    }

    if (params.includeContactInfo) {
      row.push(
        `"${user.fullAddress || ''}"`,
        `"${user.contactDetails?.city || ''}"`,
        `"${user.contactDetails?.state || ''}"`,
        `"${user.contactDetails?.zip || ''}"`,
        `"${user.contactDetails?.dateofbirth ? new Date(user.contactDetails.dateofbirth).toLocaleDateString() : ''}"`,
      );
    }

    if (params.includeRoles) {
      row.push(`"${user.activeRoleNames?.join('; ') || ''}"`, `"${user.roleCount || 0}"`);
    }

    row.push(
      `"${user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : ''}"`,
      `"${user.hasContactInfo ? 'Yes' : 'No'}"`,
    );

    return row;
  }
}

// JSON formatter
class JSONFormatter implements ExportFormatter {
  format(users: EnhancedUser[], params: BulkExportParams): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      includeFields: params.includeFields,
      includeRoles: params.includeRoles,
      includeContactInfo: params.includeContactInfo,
      users: users.map((user) => this.formatUser(user, params)),
    };

    return JSON.stringify(exportData, null, 2);
  }

  getContentType(): string {
    return 'application/json';
  }

  getFileExtension(): string {
    return 'json';
  }

  private formatUser(user: EnhancedUser, params: BulkExportParams): Record<string, unknown> {
    const exportUser: Record<string, unknown> = {
      id: user.id,
      displayName: user.displayName,
      hasContactInfo: user.hasContactInfo,
    };

    if (params.includeFields.includes('name')) {
      exportUser.name = {
        first: user.firstName,
        last: user.lastName,
        middle: user.contactDetails?.middlename,
      };
    }

    if (params.includeFields.includes('contact')) {
      exportUser.contact = {
        email: user.email,
        phone: user.primaryPhone,
      };
    }

    if (params.includeContactInfo && user.contactDetails) {
      exportUser.contactDetails = {
        address: user.fullAddress,
        city: user.contactDetails.city,
        state: user.contactDetails.state,
        zip: user.contactDetails.zip,
        dateOfBirth: user.contactDetails.dateofbirth,
      };
    }

    if (params.includeRoles) {
      exportUser.roles = {
        active: user.activeRoleNames,
        count: user.roleCount,
        details: user.roles?.map((role) => ({
          id: role.roleId,
          name: role.roleName,
          data: role.roleData,
          context: role.contextName,
        })),
      };
    }

    if (user.lastActivity) {
      exportUser.lastActivity = user.lastActivity;
    }

    return exportUser;
  }
}

export class BulkExportOperation implements BulkOperation {
  config: BulkOperationConfig = {
    id: 'export-users',
    name: 'Export Users',
    description: 'Export user data to CSV, JSON, or Excel format',
    icon: DownloadIcon,
    color: 'info',
    requiresConfirmation: false,
    maxBatchSize: 1000,
    allowPartialFailure: false,
    estimatedTimePerUser: 50,
  };

  private formatters = new Map<string, ExportFormatter>([
    ['csv', new CSVFormatter()],
    ['json', new JSONFormatter()],
    // Note: XLSX formatter would require additional library like xlsx
  ]);

  // Validate export parameters
  validate(users: EnhancedUser[], params: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if users are provided
    if (!users || users.length === 0) {
      errors.push('No users selected for export');
    }

    const exportParams = params as unknown as BulkExportParams;

    // Validate export format
    if (!exportParams.format) {
      errors.push('Export format is required');
    } else if (!this.formatters.has(exportParams.format)) {
      errors.push(`Unsupported export format: ${exportParams.format}`);
    }

    // Validate include fields
    if (!exportParams.includeFields || exportParams.includeFields.length === 0) {
      warnings.push('No specific fields selected. All available data will be included.');
    }

    // Check for large exports
    if (users.length > 500) {
      warnings.push(
        `Exporting ${users.length} users may take some time. Consider filtering to reduce the dataset size.`,
      );
    }

    // Validate filename if provided
    if (exportParams.filename && !/^[a-zA-Z0-9_\-\s]+$/.test(exportParams.filename)) {
      warnings.push('Filename contains special characters. They will be removed.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      affectedCount: users.length,
    };
  }

  // Get required permissions for export
  getRequiredPermissions(): string[] {
    return ['view_users', 'export_data'];
  }

  // Execute bulk export with progress tracking
  async execute(
    users: EnhancedUser[],
    params: Record<string, unknown>,
    onProgress: (progress: BulkOperationProgress) => void,
    abortSignal?: AbortSignal,
  ): Promise<BulkOperationProgress> {
    const exportParams = params as unknown as BulkExportParams;
    const formatter = this.formatters.get(exportParams.format);

    if (!formatter) {
      throw new Error(`Unsupported export format: ${exportParams.format}`);
    }

    // Initialize progress
    const progress: BulkOperationProgress = {
      total: users.length,
      completed: 0,
      failed: 0,
      currentOperation: 'Preparing export...',
      isRunning: true,
      startTime: new Date(),
      results: [],
    };

    onProgress(progress);

    try {
      // Check if operation was cancelled
      if (abortSignal?.aborted) {
        throw new Error('Export cancelled');
      }

      // Step 1: Validate and prepare data
      progress.currentOperation = 'Validating user data...';
      onProgress(progress);

      // Filter out users with missing critical data if needed
      const validUsers = users.filter((user) => {
        // Basic validation - could be extended based on requirements
        return user.id && user.displayName;
      });

      if (validUsers.length < users.length) {
        const invalidCount = users.length - validUsers.length;
        progress.results.push({
          success: false,
          user: users[0], // placeholder
          error: `${invalidCount} users skipped due to missing required data`,
        });
      }

      progress.completed = Math.floor(progress.total * 0.1); // 10% for validation
      onProgress(progress);

      // Step 2: Format data
      progress.currentOperation = `Formatting ${validUsers.length} users as ${exportParams.format.toUpperCase()}...`;
      onProgress(progress);

      // Simulate progress for data formatting
      for (let i = 0; i < validUsers.length; i += 50) {
        if (abortSignal?.aborted) {
          throw new Error('Export cancelled');
        }

        progress.completed =
          Math.floor(progress.total * 0.1) +
          Math.floor((i / validUsers.length) * progress.total * 0.8);
        progress.currentOperation = `Processing users ${i + 1}-${Math.min(i + 50, validUsers.length)} of ${validUsers.length}...`;
        onProgress(progress);

        // Small delay to show progress
        await this.delay(50);
      }

      // Step 3: Generate export content
      progress.currentOperation = 'Generating export file...';
      progress.completed = Math.floor(progress.total * 0.9);
      onProgress(progress);

      const exportContent = formatter.format(validUsers, exportParams);

      // Step 4: Trigger download
      progress.currentOperation = 'Preparing download...';
      onProgress(progress);

      const filename = this.generateFilename(exportParams);
      this.downloadFile(exportContent, filename, formatter.getContentType());

      // Final progress
      progress.completed = progress.total;
      progress.failed = users.length - validUsers.length;
      progress.isRunning = false;
      progress.currentOperation = `Export completed. ${validUsers.length} users exported to ${filename}`;
      progress.estimatedTimeRemaining = 0;

      // Add success results
      validUsers.forEach((user) => {
        progress.results.push({
          success: true,
          user,
          data: { exported: true, format: exportParams.format },
        });
      });

      onProgress(progress);
      return progress;
    } catch (error) {
      progress.isRunning = false;
      progress.currentOperation = `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onProgress(progress);
      throw error;
    }
  }

  // Generate filename for export
  private generateFilename(params: BulkExportParams): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = params.filename?.replace(/[^a-zA-Z0-9_\-\s]/g, '') || 'users_export';
    const formatter = this.formatters.get(params.format);
    const extension = formatter?.getFileExtension() || params.format;

    return `${baseName}_${timestamp}.${extension}`;
  }

  // Download file to user's browser
  private downloadFile(content: string | Blob, filename: string, contentType: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Helper method for delays
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Static factory method
  static create(): BulkExportOperation {
    return new BulkExportOperation();
  }
}
