export interface IBackupService {
  start(): void;
  stop(): void;
  performBackup(): Promise<void>;
  applyRetentionPolicy(): Promise<void>;
}
