import '../src/config/loadEnv.js';
import { ServiceFactory } from '../src/services/serviceFactory.js';

const service = ServiceFactory.getBackupService();
await service.performBackup();
