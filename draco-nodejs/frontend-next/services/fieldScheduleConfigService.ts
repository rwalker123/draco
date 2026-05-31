import type { FieldScheduleConfigType, FieldScheduleConfigUpsertType } from '@draco/shared-schemas';
import {
  getFieldScheduleConfig,
  listFieldScheduleConfigs,
  replaceFieldScheduleConfig,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

export class FieldScheduleConfigService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  async listFieldScheduleConfigs(
    accountId: string,
    signal?: AbortSignal,
  ): Promise<FieldScheduleConfigType[]> {
    const result = await listFieldScheduleConfigs({
      client: this.client,
      path: { accountId },
      signal,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load field schedule configurations').configs;
  }

  async getFieldScheduleConfig(
    accountId: string,
    fieldId: string,
    signal?: AbortSignal,
  ): Promise<FieldScheduleConfigType> {
    const result = await getFieldScheduleConfig({
      client: this.client,
      path: { accountId, fieldId },
      signal,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load field schedule configuration');
  }

  async replaceFieldScheduleConfig(
    accountId: string,
    fieldId: string,
    body: FieldScheduleConfigUpsertType,
    signal?: AbortSignal,
  ): Promise<FieldScheduleConfigType> {
    const result = await replaceFieldScheduleConfig({
      client: this.client,
      path: { accountId, fieldId },
      body,
      signal,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to save field schedule configuration');
  }
}
