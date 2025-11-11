import { SocialIngestionConnector } from '../ingestionTypes.js';

export abstract class BaseSocialIngestionConnector implements SocialIngestionConnector {
  readonly name: string;
  readonly intervalMs: number;
  readonly enabled: boolean;

  protected constructor(name: string, enabled: boolean, intervalMs: number) {
    this.name = name;
    this.enabled = enabled;
    this.intervalMs = intervalMs;
  }

  async ingest(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.runIngestion();
    } catch (error) {
      console.error(`[${this.name}] ingestion failed`, error);
    }
  }

  protected abstract runIngestion(): Promise<void>;
}
