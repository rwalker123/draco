import '../src/config/loadEnv.js';
import { BackupService } from '../src/services/backup-service.js';

const service = new BackupService();
await service.performBackup();
