import { HandoutType, UpsertHandoutType } from '@draco/shared-schemas';
import {
  listAccountHandouts as apiListAccountHandouts,
  createAccountHandout as apiCreateAccountHandout,
  updateAccountHandout as apiUpdateAccountHandout,
  deleteAccountHandout as apiDeleteAccountHandout,
  listTeamHandouts as apiListTeamHandouts,
  createTeamHandout as apiCreateTeamHandout,
  updateTeamHandout as apiUpdateTeamHandout,
  deleteTeamHandout as apiDeleteTeamHandout,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export interface HandoutInput {
  description: string;
  file?: File | null;
}

interface BaseContext {
  accountId: string;
}

interface TeamContext extends BaseContext {
  teamId: string;
}

export class HandoutService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  async listAccountHandouts(accountId: string): Promise<HandoutType[]> {
    const result = await apiListAccountHandouts({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load account handouts');
    return data.handouts ?? [];
  }

  async listTeamHandouts(context: TeamContext): Promise<HandoutType[]> {
    const result = await apiListTeamHandouts({
      client: this.client,
      path: { accountId: context.accountId, teamId: context.teamId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load team handouts');
    return data.handouts ?? [];
  }

  async createAccountHandout(accountId: string, input: HandoutInput): Promise<HandoutType> {
    return this.createHandout({ accountId }, input);
  }

  async updateAccountHandout(
    accountId: string,
    handoutId: string,
    input: HandoutInput,
  ): Promise<HandoutType> {
    return this.updateHandout({ accountId }, handoutId, input);
  }

  async deleteAccountHandout(accountId: string, handoutId: string): Promise<void> {
    const result = await apiDeleteAccountHandout({
      client: this.client,
      path: { accountId, handoutId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete handout');
  }

  async createTeamHandout(context: TeamContext, input: HandoutInput): Promise<HandoutType> {
    return this.createHandout(context, input);
  }

  async updateTeamHandout(
    context: TeamContext,
    handoutId: string,
    input: HandoutInput,
  ): Promise<HandoutType> {
    return this.updateHandout(context, handoutId, input);
  }

  async deleteTeamHandout(context: TeamContext, handoutId: string): Promise<void> {
    const result = await apiDeleteTeamHandout({
      client: this.client,
      path: { accountId: context.accountId, teamId: context.teamId, handoutId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete handout');
  }

  private async createHandout(context: BaseContext | TeamContext, input: HandoutInput) {
    const payload = this.buildCreatePayload(input);

    if ('teamId' in context) {
      const result = await apiCreateTeamHandout({
        client: this.client,
        path: { accountId: context.accountId, teamId: context.teamId },
        throwOnError: false,
        body: payload,
        ...formDataBodySerializer,
        headers: { 'Content-Type': null },
      });

      return unwrapApiResult(result, 'Failed to create handout');
    }

    const result = await apiCreateAccountHandout({
      client: this.client,
      path: { accountId: context.accountId },
      throwOnError: false,
      body: payload,
      ...formDataBodySerializer,
      headers: { 'Content-Type': null },
    });

    return unwrapApiResult(result, 'Failed to create handout');
  }

  private async updateHandout(
    context: BaseContext | TeamContext,
    handoutId: string,
    input: HandoutInput,
  ) {
    const payload = this.buildUpdatePayload(input);

    if ('teamId' in context) {
      const result = await apiUpdateTeamHandout({
        client: this.client,
        path: { accountId: context.accountId, teamId: context.teamId, handoutId },
        throwOnError: false,
        body: payload,
        ...formDataBodySerializer,
        headers: { 'Content-Type': null },
      });

      return unwrapApiResult(result, 'Failed to update handout');
    }

    const result = await apiUpdateAccountHandout({
      client: this.client,
      path: { accountId: context.accountId, handoutId },
      throwOnError: false,
      body: payload,
      ...formDataBodySerializer,
      headers: { 'Content-Type': null },
    });

    return unwrapApiResult(result, 'Failed to update handout');
  }

  private buildCreatePayload(input: HandoutInput): UpsertHandoutType & { file: File } {
    if (!input.file) {
      throw new Error('Handout file is required');
    }

    return {
      description: input.description,
      file: input.file,
    };
  }

  private buildUpdatePayload(input: HandoutInput): UpsertHandoutType & { file?: File } {
    if (input.file) {
      return {
        description: input.description,
        file: input.file,
      };
    }

    return {
      description: input.description,
    };
  }
}
