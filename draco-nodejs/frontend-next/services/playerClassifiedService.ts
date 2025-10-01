// Player Classifieds Service
// Handles all API interactions for Player Classifieds feature using the shared API client

import {
  contactPlayersWantedCreator as contactPlayersWantedCreatorApi,
  createPlayersWantedClassified,
  createTeamsWantedClassified,
  deletePlayersWantedClassified,
  deleteTeamsWantedClassified,
  getTeamsWantedByAccessCode as getTeamsWantedByAccessCodeApi,
  getTeamsWantedContactInfo as getTeamsWantedContactInfoApi,
  listPlayerClassifiedExperienceLevels,
  listPlayerClassifiedPositions,
  listPlayersWantedClassifieds,
  listTeamsWantedClassifieds,
  updatePlayersWantedClassified,
  updateTeamsWantedClassified,
  verifyTeamsWantedAccess as verifyTeamsWantedAccessApi,
} from '@draco/shared-api-client';
import type {
  UpsertPlayersWantedClassifiedType,
  UpsertTeamsWantedClassifiedType,
  PlayerClassifiedSearchQueryType,
  PlayersWantedClassifiedPagedType,
  PlayersWantedClassifiedType,
  TeamsWantedContactInfoType,
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedPagedType,
} from '@draco/shared-schemas';
import { createApiClient } from '../lib/apiClientFactory';
import { IEmailVerificationRequest, IEmailVerificationResult } from '../types/playerClassifieds';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

const FAILURE_MESSAGES = {
  createPlayersWanted: 'Failed to create Players Wanted',
  fetchPlayersWanted: 'Failed to fetch Players Wanted',
  updatePlayersWanted: 'Failed to update Players Wanted',
  deletePlayersWanted: 'Failed to delete Players Wanted',
  createTeamsWanted: 'Failed to create Teams Wanted',
  fetchTeamsWanted: 'Failed to fetch Teams Wanted',
  updateTeamsWanted: 'Failed to update Teams Wanted',
  deleteTeamsWanted: 'Failed to delete Teams Wanted',
  contactCreator: 'Failed to send contact message',
  verifyAccess: 'Failed to verify access code',
  fetchContactInfo: 'Failed to fetch Teams Wanted contact information',
  fetchPositions: 'Failed to load player positions',
  fetchExperienceLevels: 'Failed to load experience levels',
};

const buildListQuery = (params?: Partial<PlayerClassifiedSearchQueryType>) => {
  if (!params) {
    return undefined;
  }

  const { page, limit, sortBy, sortOrder, searchQuery } = params;
  const query: Record<string, string | number> = {};

  if (page !== undefined) query.page = page;
  if (limit !== undefined) query.limit = limit;
  if (sortBy) query.sortBy = sortBy;
  if (sortOrder) query.sortOrder = sortOrder;
  if (searchQuery) query.searchQuery = searchQuery;

  return Object.keys(query).length > 0 ? query : undefined;
};

const createClient = (token?: string | null) => createApiClient({ token: token || undefined });

export const playerClassifiedService = {
  /**
   * Private method retained for endpoints that still require raw query construction.
   */
  buildSearchParams(params?: Partial<PlayerClassifiedSearchQueryType>): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (!params) {
      return searchParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return searchParams;
  },

  async createPlayersWanted(
    accountId: string,
    data: UpsertPlayersWantedClassifiedType,
    token: string,
  ): Promise<PlayersWantedClassifiedType> {
    const client = createClient(token);
    const result = await createPlayersWantedClassified({
      client,
      path: { accountId },
      body: data,
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.createPlayersWanted);
  },

  async getPlayersWanted(
    accountId: string,
    params?: Partial<PlayerClassifiedSearchQueryType>,
  ): Promise<PlayersWantedClassifiedPagedType> {
    const client = createClient();

    const result = await listPlayersWantedClassifieds({
      client,
      path: { accountId },
      query: buildListQuery(params),
      throwOnError: false,
    });

    const data = unwrapApiResult(result, FAILURE_MESSAGES.fetchPlayersWanted);
    return data;
  },

  async updatePlayersWanted(
    accountId: string,
    classifiedId: string,
    data: UpsertPlayersWantedClassifiedType,
    token: string,
  ): Promise<PlayersWantedClassifiedType> {
    const client = createClient(token);
    const result = await updatePlayersWantedClassified({
      client,
      path: { accountId, classifiedId },
      body: data,
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.updatePlayersWanted);
  },

  async deletePlayersWanted(accountId: string, classifiedId: string, token: string): Promise<void> {
    const client = createClient(token);
    const result = await deletePlayersWantedClassified({
      client,
      path: { accountId, classifiedId },
      throwOnError: false,
    });

    assertNoApiError(result, FAILURE_MESSAGES.deletePlayersWanted);
  },

  async createTeamsWanted(
    accountId: string,
    data: UpsertTeamsWantedClassifiedType,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    const client = createClient();
    const result = await createTeamsWantedClassified({
      client,
      path: { accountId },
      body: data,
      throwOnError: false,
    });

    return unwrapApiResult(
      result,
      FAILURE_MESSAGES.createTeamsWanted,
    ) as TeamsWantedOwnerClassifiedType;
  },

  async getTeamsWanted(
    accountId: string,
    params: Partial<PlayerClassifiedSearchQueryType> | undefined,
    token: string,
  ): Promise<TeamsWantedPublicClassifiedPagedType> {
    const client = createClient(token);

    const result = await listTeamsWantedClassifieds({
      client,
      path: { accountId },
      query: buildListQuery(params),
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.fetchTeamsWanted);
  },

  async updateTeamsWanted(
    accountId: string,
    classifiedId: string,
    data: UpsertTeamsWantedClassifiedType,
    token?: string,
    accessCode?: string,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    const client = createClient(token);
    const requestBody = {
      ...data,
      ...(accessCode ? { accessCode } : {}),
    };

    const result = await updateTeamsWantedClassified({
      client,
      path: { accountId, classifiedId },
      body: requestBody,
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.updateTeamsWanted);
  },

  async deleteTeamsWanted(
    accountId: string,
    classifiedId: string,
    token?: string,
    accessCode?: string,
  ): Promise<void> {
    const client = createClient(token);
    const result = await deleteTeamsWantedClassified({
      client,
      path: { accountId, classifiedId },
      ...(accessCode ? { body: { accessCode } } : {}),
      throwOnError: false,
    });

    assertNoApiError(result, FAILURE_MESSAGES.deleteTeamsWanted);
  },

  async getTeamsWantedContactForEdit(
    accountId: string,
    classifiedId: string,
    accessCode: string,
    token?: string,
  ): Promise<TeamsWantedContactInfoType> {
    const client = createClient(token);

    const result = await getTeamsWantedContactInfoApi({
      client,
      path: { accountId, classifiedId },
      query: !token ? { accessCode } : undefined,
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.fetchContactInfo) as TeamsWantedContactInfoType;
  },

  async verifyTeamsWantedAccessCode(
    accountId: string,
    accessCode: string,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    const client = createClient();
    const result = await getTeamsWantedByAccessCodeApi({
      client,
      path: { accountId },
      body: { accessCode },
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.verifyAccess);
  },

  async verifyTeamsWantedAccess(
    accountId: string,
    classifiedId: string,
    accessCode: string,
  ): Promise<TeamsWantedOwnerClassifiedType> {
    const client = createClient();
    const result = await verifyTeamsWantedAccessApi({
      client,
      path: { accountId, classifiedId },
      body: { accessCode },
      throwOnError: false,
    });

    return unwrapApiResult(result, FAILURE_MESSAGES.verifyAccess);
  },

  async verifyEmail(request: IEmailVerificationRequest): Promise<IEmailVerificationResult> {
    const client = createClient();
    const result = await client.post<unknown, unknown, false>({
      url: '/api/accounts/verify-email',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to verify email') as IEmailVerificationResult;
  },

  async contactPlayersWantedCreator(
    accountId: string,
    classifiedId: string,
    data: {
      senderName: string;
      senderEmail: string;
      message: string;
    },
  ): Promise<void> {
    const client = createClient();
    const result = await contactPlayersWantedCreatorApi({
      client,
      path: { accountId, classifiedId },
      body: data,
      throwOnError: false,
    });

    assertNoApiError(result, FAILURE_MESSAGES.contactCreator);
  },

  async listPlayerClassifiedPositions(accountId: string): Promise<string[]> {
    const client = createClient();
    const result = await listPlayerClassifiedPositions({
      client,
      path: { accountId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, FAILURE_MESSAGES.fetchPositions);
    return (data as { id: string; name: string }[]).map((position) => position.name);
  },

  async listPlayerClassifiedExperienceLevels(accountId: string): Promise<string[]> {
    const client = createClient();
    const result = await listPlayerClassifiedExperienceLevels({
      client,
      path: { accountId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, FAILURE_MESSAGES.fetchExperienceLevels);
    return (data as { id: string; name: string }[]).map((level) => level.name);
  },
};
