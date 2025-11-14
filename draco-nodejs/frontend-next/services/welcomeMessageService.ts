import {
  createAccountWelcomeMessage as apiCreateAccountWelcomeMessage,
  createTeamWelcomeMessage as apiCreateTeamWelcomeMessage,
  deleteAccountWelcomeMessage as apiDeleteAccountWelcomeMessage,
  deleteTeamWelcomeMessage as apiDeleteTeamWelcomeMessage,
  getAccountWelcomeMessage as apiGetAccountWelcomeMessage,
  getTeamWelcomeMessage as apiGetTeamWelcomeMessage,
  listAccountWelcomeMessages as apiListAccountWelcomeMessages,
  listTeamWelcomeMessages as apiListTeamWelcomeMessages,
  updateAccountWelcomeMessage as apiUpdateAccountWelcomeMessage,
  updateTeamWelcomeMessage as apiUpdateTeamWelcomeMessage,
  type WelcomeMessage as ApiWelcomeMessage,
  type WelcomeMessageList as ApiWelcomeMessageList,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { type UpsertWelcomeMessageType, type WelcomeMessageType } from '@draco/shared-schemas';

import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

interface TeamScope {
  teamSeasonId: string;
}

export class WelcomeMessageService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  private normalize(message: ApiWelcomeMessage): WelcomeMessageType {
    return {
      ...message,
      isTeamScoped: Boolean(message.isTeamScoped),
      scope: message.scope ?? (message.teamId ? 'team' : 'account'),
      bodyHtml: message.bodyHtml ?? '',
    } satisfies WelcomeMessageType;
  }

  private normalizeList(list?: ApiWelcomeMessageList | null): WelcomeMessageType[] {
    return (list?.welcomeMessages ?? []).map((item) => this.normalize(item));
  }

  async listAccountMessages(accountId: string): Promise<WelcomeMessageType[]> {
    const result = await apiListAccountWelcomeMessages({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });

    const payload = unwrapApiResult<ApiWelcomeMessageList>(
      result,
      'Failed to load information messages',
    );
    return this.normalizeList(payload);
  }

  async getAccountMessage(accountId: string, messageId: string): Promise<WelcomeMessageType> {
    const result = await apiGetAccountWelcomeMessage({
      client: this.client,
      path: { accountId, messageId },
      throwOnError: false,
    });

    const payload = unwrapApiResult<ApiWelcomeMessage>(
      result,
      'Failed to load information message',
    );
    return this.normalize(payload);
  }

  async createAccountMessage(
    accountId: string,
    payload: UpsertWelcomeMessageType,
  ): Promise<WelcomeMessageType> {
    const result = await apiCreateAccountWelcomeMessage({
      client: this.client,
      path: { accountId },
      body: payload,
      throwOnError: false,
    });

    const created = unwrapApiResult<ApiWelcomeMessage>(
      result,
      'Failed to create information message',
    );
    return this.normalize(created);
  }

  async updateAccountMessage(
    accountId: string,
    messageId: string,
    payload: UpsertWelcomeMessageType,
  ): Promise<WelcomeMessageType> {
    const result = await apiUpdateAccountWelcomeMessage({
      client: this.client,
      path: { accountId, messageId },
      body: payload,
      throwOnError: false,
    });

    const updated = unwrapApiResult<ApiWelcomeMessage>(
      result,
      'Failed to update information message',
    );
    return this.normalize(updated);
  }

  async deleteAccountMessage(accountId: string, messageId: string): Promise<void> {
    const result = await apiDeleteAccountWelcomeMessage({
      client: this.client,
      path: { accountId, messageId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete information message');
  }

  async listTeamMessages(accountId: string, scope: TeamScope): Promise<WelcomeMessageType[]> {
    const result = await apiListTeamWelcomeMessages({
      client: this.client,
      path: { accountId, teamSeasonId: scope.teamSeasonId },
      throwOnError: false,
    });

    const payload = unwrapApiResult<ApiWelcomeMessageList>(
      result,
      'Failed to load team information messages',
    );
    return this.normalizeList(payload);
  }

  async getTeamMessage(
    accountId: string,
    scope: TeamScope,
    messageId: string,
  ): Promise<WelcomeMessageType> {
    const result = await apiGetTeamWelcomeMessage({
      client: this.client,
      path: { accountId, teamSeasonId: scope.teamSeasonId, messageId },
      throwOnError: false,
    });

    const payload = unwrapApiResult<ApiWelcomeMessage>(
      result,
      'Failed to load team information message',
    );
    return this.normalize(payload);
  }

  async createTeamMessage(
    accountId: string,
    scope: TeamScope,
    payload: UpsertWelcomeMessageType,
  ): Promise<WelcomeMessageType> {
    const result = await apiCreateTeamWelcomeMessage({
      client: this.client,
      path: { accountId, teamSeasonId: scope.teamSeasonId },
      body: payload,
      throwOnError: false,
    });

    const created = unwrapApiResult<ApiWelcomeMessage>(
      result,
      'Failed to create team information message',
    );
    return this.normalize(created);
  }

  async updateTeamMessage(
    accountId: string,
    scope: TeamScope,
    messageId: string,
    payload: UpsertWelcomeMessageType,
  ): Promise<WelcomeMessageType> {
    const result = await apiUpdateTeamWelcomeMessage({
      client: this.client,
      path: { accountId, teamSeasonId: scope.teamSeasonId, messageId },
      body: payload,
      throwOnError: false,
    });

    const updated = unwrapApiResult<ApiWelcomeMessage>(
      result,
      'Failed to update team information message',
    );
    return this.normalize(updated);
  }

  async deleteTeamMessage(accountId: string, scope: TeamScope, messageId: string): Promise<void> {
    const result = await apiDeleteTeamWelcomeMessage({
      client: this.client,
      path: { accountId, teamSeasonId: scope.teamSeasonId, messageId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete team information message');
  }
}

export type WelcomeMessageTeamScope = TeamScope;
