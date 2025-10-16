import {
  dbAdminAccountEmailActivity,
  dbAdminAccountStorageUsage,
  dbAdminEmailSummary,
} from '../types/index.js';

export interface IAdminAnalyticsRepository {
  getTotalAccountCount(): Promise<number>;
  getAccountStorageUsage(): Promise<dbAdminAccountStorageUsage[]>;
  getEmailSummary(): Promise<dbAdminEmailSummary>;
  getAccountEmailActivity(): Promise<dbAdminAccountEmailActivity[]>;
}
