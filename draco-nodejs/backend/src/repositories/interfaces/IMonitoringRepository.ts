import { dbMonitoringConnectivityResult } from '../types/index.js';

export interface IMonitoringRepository {
  testDatabaseConnectivity(): Promise<dbMonitoringConnectivityResult>;
}
