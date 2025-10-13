import { TeamSeasonType } from '@draco/shared-schemas';
import {
  updateTeamSeason as apiUpdateTeamSeason,
  type UpsertTeamSeasonWithLogo,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

interface UpdateTeamContext {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

export interface UpdateTeamMetadataInput {
  name: string;
  logoFile?: File;
}

export class TeamManagementService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  async updateTeamMetadata(
    context: UpdateTeamContext,
    input: UpdateTeamMetadataInput,
  ): Promise<TeamSeasonType> {
    const payload: UpsertTeamSeasonWithLogo = { name: input.name };

    if (input.logoFile) {
      payload.logo = input.logoFile;
    }

    const result = await apiUpdateTeamSeason({
      path: context,
      client: this.client,
      body: payload,
      throwOnError: false,
      ...(input.logoFile
        ? { ...formDataBodySerializer, headers: { 'Content-Type': null } }
        : {}),
    });

    return unwrapApiResult(result, 'Failed to update team');
  }
}
