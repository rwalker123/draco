import { promises as fs } from 'fs';
import path from 'path';

const DEFAULT_LOG_RELATIVE_PATH = path.join('storage', 'admin', 'account-creations.log');
const RETENTION_DAYS = 90;

export interface AccountCreationLogEntry {
  accountId: string;
  accountName: string;
  ownerUserId: string;
  ownerUserName: string;
  createdAt: string;
}

export class AccountCreationLogService {
  private readonly logFilePath: string;

  constructor(logFilePath?: string) {
    this.logFilePath = logFilePath ?? path.resolve(process.cwd(), DEFAULT_LOG_RELATIVE_PATH);
  }

  async recordEntry(
    entry: Omit<AccountCreationLogEntry, 'createdAt'> & { createdAt?: string },
  ): Promise<void> {
    const timestamp = entry.createdAt ?? new Date().toISOString();
    const retainedEntries = await this.loadEntriesWithinRetention();
    retainedEntries.push({
      accountId: entry.accountId,
      accountName: entry.accountName,
      ownerUserId: entry.ownerUserId,
      ownerUserName: entry.ownerUserName,
      createdAt: timestamp,
    });

    await this.persistEntries(retainedEntries);
  }

  async getRecentEntries(limit = 50): Promise<AccountCreationLogEntry[]> {
    const retainedEntries = await this.loadEntriesWithinRetention();
    return retainedEntries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  private async loadEntriesWithinRetention(): Promise<AccountCreationLogEntry[]> {
    const allEntries = await this.readEntriesFromDisk();
    const retentionCutoff = this.calculateRetentionCutoff();

    return allEntries.filter((entry) => {
      const createdAt = new Date(entry.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= retentionCutoff;
    });
  }

  private calculateRetentionCutoff(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    return cutoff.getTime();
  }

  private async readEntriesFromDisk(): Promise<AccountCreationLogEntry[]> {
    try {
      const content = await fs.readFile(this.logFilePath, 'utf8');
      return content
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          try {
            const parsed = JSON.parse(line) as AccountCreationLogEntry;
            return parsed;
          } catch (_error) {
            return null;
          }
        })
        .filter((entry): entry is AccountCreationLogEntry => entry !== null);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return [];
      }

      throw error;
    }
  }

  private async persistEntries(entries: AccountCreationLogEntry[]): Promise<void> {
    const directory = path.dirname(this.logFilePath);
    await fs.mkdir(directory, { recursive: true });

    const sortedEntries = entries.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const serialized = sortedEntries.map((entry) => JSON.stringify(entry)).join('\n');
    const content = serialized.length > 0 ? `${serialized}\n` : '';

    await fs.writeFile(this.logFilePath, content, 'utf8');
  }
}
