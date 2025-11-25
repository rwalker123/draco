import { BaseSocialIngestionConnector } from './baseConnector.js';
import { InstagramIntegrationService } from '../../instagramIntegrationService.js';
import { InstagramConnectorOptions } from '../ingestionTypes.js';

export class InstagramConnector extends BaseSocialIngestionConnector {
  constructor(
    private readonly integrationService: InstagramIntegrationService,
    private readonly options: InstagramConnectorOptions,
  ) {
    super('instagram', options.enabled, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      return;
    }

    for (const target of targets) {
      await this.integrationService
        .ingestRecentMedia(target, this.options.maxResults)
        .catch((error) =>
          console.error('[instagram] Failed to ingest media', {
            accountId: target.accountId.toString(),
            error,
          }),
        );
    }
  }
}
