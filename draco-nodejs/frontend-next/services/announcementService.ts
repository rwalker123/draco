import { AnnouncementType, UpsertAnnouncementType } from '@draco/shared-schemas';
import {
  listAccountAnnouncements as apiListAccountAnnouncements,
  createAccountAnnouncement as apiCreateAccountAnnouncement,
  updateAccountAnnouncement as apiUpdateAccountAnnouncement,
  deleteAccountAnnouncement as apiDeleteAccountAnnouncement,
  getAccountAnnouncement as apiGetAccountAnnouncement,
  listTeamAnnouncements as apiListTeamAnnouncements,
  createTeamAnnouncement as apiCreateTeamAnnouncement,
  updateTeamAnnouncement as apiUpdateTeamAnnouncement,
  deleteTeamAnnouncement as apiDeleteTeamAnnouncement,
  getTeamAnnouncement as apiGetTeamAnnouncement,
  type Announcement as ApiAnnouncement,
  type AnnouncementList as ApiAnnouncementList,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

interface TeamContext {
  accountId: string;
  teamId: string;
}

export class AnnouncementService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  private normalizeAnnouncement(announcement: ApiAnnouncement): AnnouncementType {
    return {
      ...announcement,
      isSpecial: announcement.isSpecial ?? false,
    };
  }

  private normalizeAnnouncementList(payload?: ApiAnnouncementList | null): AnnouncementType[] {
    return (payload?.announcements ?? []).map((item) => this.normalizeAnnouncement(item));
  }

  async listAccountAnnouncements(accountId: string): Promise<AnnouncementType[]> {
    const result = await apiListAccountAnnouncements({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });

    const payload = unwrapApiResult<ApiAnnouncementList>(
      result,
      'Failed to load account announcements',
    );
    return this.normalizeAnnouncementList(payload);
  }

  async getAccountAnnouncement(
    accountId: string,
    announcementId: string,
  ): Promise<AnnouncementType> {
    const result = await apiGetAccountAnnouncement({
      client: this.client,
      path: { accountId, announcementId },
      throwOnError: false,
    });

    const announcement = unwrapApiResult<ApiAnnouncement>(
      result,
      'Failed to load announcement details',
    );
    return this.normalizeAnnouncement(announcement);
  }

  async createAccountAnnouncement(
    accountId: string,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    const result = await apiCreateAccountAnnouncement({
      client: this.client,
      path: { accountId },
      body: payload,
      throwOnError: false,
    });

    const announcement = unwrapApiResult<ApiAnnouncement>(result, 'Failed to create announcement');
    return this.normalizeAnnouncement(announcement);
  }

  async updateAccountAnnouncement(
    accountId: string,
    announcementId: string,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    const result = await apiUpdateAccountAnnouncement({
      client: this.client,
      path: { accountId, announcementId },
      body: payload,
      throwOnError: false,
    });

    const announcement = unwrapApiResult<ApiAnnouncement>(result, 'Failed to update announcement');
    return this.normalizeAnnouncement(announcement);
  }

  async deleteAccountAnnouncement(accountId: string, announcementId: string): Promise<void> {
    const result = await apiDeleteAccountAnnouncement({
      client: this.client,
      path: { accountId, announcementId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete announcement');
  }

  async listTeamAnnouncements(context: TeamContext): Promise<AnnouncementType[]> {
    const result = await apiListTeamAnnouncements({
      client: this.client,
      path: { accountId: context.accountId, teamId: context.teamId },
      throwOnError: false,
    });

    const payload = unwrapApiResult<ApiAnnouncementList>(
      result,
      'Failed to load team announcements',
    );
    return this.normalizeAnnouncementList(payload);
  }

  async getTeamAnnouncement(
    context: TeamContext,
    announcementId: string,
  ): Promise<AnnouncementType> {
    const result = await apiGetTeamAnnouncement({
      client: this.client,
      path: {
        accountId: context.accountId,
        teamId: context.teamId,
        announcementId,
      },
      throwOnError: false,
    });

    const announcement = unwrapApiResult<ApiAnnouncement>(
      result,
      'Failed to load announcement details',
    );
    return this.normalizeAnnouncement(announcement);
  }

  async createTeamAnnouncement(
    context: TeamContext,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    const result = await apiCreateTeamAnnouncement({
      client: this.client,
      path: { accountId: context.accountId, teamId: context.teamId },
      body: payload,
      throwOnError: false,
    });

    const announcement = unwrapApiResult<ApiAnnouncement>(result, 'Failed to create announcement');
    return this.normalizeAnnouncement(announcement);
  }

  async updateTeamAnnouncement(
    context: TeamContext,
    announcementId: string,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    const result = await apiUpdateTeamAnnouncement({
      client: this.client,
      path: { accountId: context.accountId, teamId: context.teamId, announcementId },
      body: payload,
      throwOnError: false,
    });

    const announcement = unwrapApiResult<ApiAnnouncement>(result, 'Failed to update announcement');
    return this.normalizeAnnouncement(announcement);
  }

  async deleteTeamAnnouncement(context: TeamContext, announcementId: string): Promise<void> {
    const result = await apiDeleteTeamAnnouncement({
      client: this.client,
      path: { accountId: context.accountId, teamId: context.teamId, announcementId },
      throwOnError: false,
    });

    assertNoApiError(result, 'Failed to delete announcement');
  }
}
