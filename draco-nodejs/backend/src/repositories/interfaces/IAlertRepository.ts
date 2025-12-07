import { alerts } from '#prisma/client';
import { dbAlert } from '../types/index.js';

export interface IAlertRepository {
  listActiveAlerts(): Promise<dbAlert[]>;
  listAlerts(): Promise<dbAlert[]>;
  findById(alertId: bigint): Promise<dbAlert | null>;
  createAlert(data: Partial<alerts>): Promise<alerts>;
  updateAlert(alertId: bigint, data: Partial<alerts>): Promise<alerts>;
  deleteAlert(alertId: bigint): Promise<void>;
}
