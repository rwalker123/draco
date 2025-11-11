import { SocialIngestionConnector } from './ingestionTypes.js';

export class SocialIngestionService {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly connectors: SocialIngestionConnector[]) {}

  start(): void {
    if (!this.connectors.length) {
      console.info('[social-ingestion] No connectors configured. Skipping startup.');
      return;
    }

    for (const connector of this.connectors) {
      if (!connector.enabled) {
        console.info(`[social-ingestion] Connector ${connector.name} disabled.`);
        continue;
      }

      const execute = async (): Promise<void> => {
        await connector.ingest();
      };

      // Run immediately once
      execute().catch((error) =>
        console.error(`[social-ingestion] Initial run failed for ${connector.name}`, error),
      );

      const timer = setInterval(() => {
        execute().catch((error) =>
          console.error(`[social-ingestion] Scheduled run failed for ${connector.name}`, error),
        );
      }, connector.intervalMs);

      this.timers.set(connector.name, timer);
      console.info(
        `[social-ingestion] Connector ${connector.name} scheduled every ${connector.intervalMs}ms`,
      );
    }
  }

  stop(): void {
    for (const [name, timer] of this.timers.entries()) {
      clearInterval(timer);
      this.timers.delete(name);
      console.info(`[social-ingestion] Connector ${name} stopped.`);
    }
  }
}
