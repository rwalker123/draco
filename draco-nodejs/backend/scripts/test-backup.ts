import '../src/config/loadEnv.js';
import { BackupService } from '../src/services/backupService.js';

const service = new BackupService();
await service.performBackup();
