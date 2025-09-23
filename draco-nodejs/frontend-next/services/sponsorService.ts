import { SponsorType } from '@draco/shared-schemas';
import {
  listAccountSponsors as apiListAccountSponsors,
  createAccountSponsor as apiCreateAccountSponsor,
  updateAccountSponsor as apiUpdateAccountSponsor,
  deleteAccountSponsor as apiDeleteAccountSponsor,
  listTeamSponsors as apiListTeamSponsors,
  createTeamSponsor as apiCreateTeamSponsor,
  updateTeamSponsor as apiUpdateTeamSponsor,
  deleteTeamSponsor as apiDeleteTeamSponsor,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';

export interface SponsorInput {
  name: string;
  streetAddress?: string;
  cityStateZip?: string;
  description?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  photo?: File | null;
}

interface SponsorPayload {
  name: string;
  streetAddress?: string;
  cityStateZip?: string;
  description?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
}

interface SponsorRequestContext {
  accountId: string;
  seasonId?: string;
  teamSeasonId?: string;
}

export class SponsorService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  async listAccountSponsors(accountId: string): Promise<SponsorType[]> {
    const result = await apiListAccountSponsors({
      path: { accountId },
      client: this.client,
      throwOnError: false,
    });

    const data = this.ensureSuccess(result, 'Failed to load sponsors');
    return data.sponsors ?? [];
  }

  async listTeamSponsors(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
  ): Promise<SponsorType[]> {
    const result = await apiListTeamSponsors({
      path: { accountId, seasonId, teamSeasonId },
      client: this.client,
      throwOnError: false,
    });

    const data = this.ensureSuccess(result, 'Failed to load team sponsors');
    return data.sponsors ?? [];
  }

  async createAccountSponsor(accountId: string, input: SponsorInput): Promise<SponsorType> {
    return this.createSponsor({ accountId }, input);
  }

  async updateAccountSponsor(
    accountId: string,
    sponsorId: string,
    input: SponsorInput,
  ): Promise<SponsorType> {
    return this.updateSponsor({ accountId }, sponsorId, input);
  }

  async deleteAccountSponsor(accountId: string, sponsorId: string): Promise<void> {
    const result = await apiDeleteAccountSponsor({
      path: { accountId, sponsorId },
      client: this.client,
      throwOnError: false,
    });

    this.ensureNoError(result, 'Failed to delete sponsor');
  }

  async createTeamSponsor(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    input: SponsorInput,
  ): Promise<SponsorType> {
    return this.createSponsor({ accountId, seasonId, teamSeasonId }, input);
  }

  async updateTeamSponsor(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    sponsorId: string,
    input: SponsorInput,
  ): Promise<SponsorType> {
    return this.updateSponsor({ accountId, seasonId, teamSeasonId }, sponsorId, input);
  }

  async deleteTeamSponsor(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    sponsorId: string,
  ): Promise<void> {
    const result = await apiDeleteTeamSponsor({
      path: { accountId, seasonId, teamSeasonId, sponsorId },
      client: this.client,
      throwOnError: false,
    });

    this.ensureNoError(result, 'Failed to delete sponsor');
  }

  private async createSponsor(
    context: SponsorRequestContext,
    input: SponsorInput,
  ): Promise<SponsorType> {
    const payload = this.buildPayload(input);

    const result = input.photo
      ? await this.createSponsorWithPhoto(context, payload, input.photo)
      : await this.createSponsorWithoutPhoto(context, payload);

    return this.ensureSuccess(result, 'Failed to create sponsor');
  }

  private async updateSponsor(
    context: SponsorRequestContext,
    sponsorId: string,
    input: SponsorInput,
  ): Promise<SponsorType> {
    const payload = this.buildPayload(input);

    const result = input.photo
      ? await this.updateSponsorWithPhoto(context, sponsorId, payload, input.photo)
      : await this.updateSponsorWithoutPhoto(context, sponsorId, payload);

    return this.ensureSuccess(result, 'Failed to update sponsor');
  }

  private async createSponsorWithPhoto(
    context: SponsorRequestContext,
    payload: SponsorPayload,
    photo: File,
  ) {
    if (context.teamSeasonId && context.seasonId) {
      return apiCreateTeamSponsor({
        path: {
          accountId: context.accountId,
          seasonId: context.seasonId,
          teamSeasonId: context.teamSeasonId,
        },
        client: this.client,
        throwOnError: false,
        body: { ...payload, photo },
        ...formDataBodySerializer,
        headers: { 'Content-Type': null },
      });
    }

    return apiCreateAccountSponsor({
      path: { accountId: context.accountId },
      client: this.client,
      throwOnError: false,
      body: { ...payload, photo },
      ...formDataBodySerializer,
      headers: { 'Content-Type': null },
    });
  }

  private async createSponsorWithoutPhoto(context: SponsorRequestContext, payload: SponsorPayload) {
    if (context.teamSeasonId && context.seasonId) {
      return apiCreateTeamSponsor({
        path: {
          accountId: context.accountId,
          seasonId: context.seasonId,
          teamSeasonId: context.teamSeasonId,
        },
        client: this.client,
        throwOnError: false,
        body: payload,
      });
    }

    return apiCreateAccountSponsor({
      path: { accountId: context.accountId },
      client: this.client,
      throwOnError: false,
      body: payload,
    });
  }

  private async updateSponsorWithPhoto(
    context: SponsorRequestContext,
    sponsorId: string,
    payload: SponsorPayload,
    photo: File,
  ) {
    if (context.teamSeasonId && context.seasonId) {
      return apiUpdateTeamSponsor({
        path: {
          accountId: context.accountId,
          seasonId: context.seasonId,
          teamSeasonId: context.teamSeasonId,
          sponsorId,
        },
        client: this.client,
        throwOnError: false,
        body: { ...payload, photo },
        ...formDataBodySerializer,
        headers: { 'Content-Type': null },
      });
    }

    return apiUpdateAccountSponsor({
      path: { accountId: context.accountId, sponsorId },
      client: this.client,
      throwOnError: false,
      body: { ...payload, photo },
      ...formDataBodySerializer,
      headers: { 'Content-Type': null },
    });
  }

  private async updateSponsorWithoutPhoto(
    context: SponsorRequestContext,
    sponsorId: string,
    payload: SponsorPayload,
  ) {
    if (context.teamSeasonId && context.seasonId) {
      return apiUpdateTeamSponsor({
        path: {
          accountId: context.accountId,
          seasonId: context.seasonId,
          teamSeasonId: context.teamSeasonId,
          sponsorId,
        },
        client: this.client,
        throwOnError: false,
        body: payload,
      });
    }

    return apiUpdateAccountSponsor({
      path: { accountId: context.accountId, sponsorId },
      client: this.client,
      throwOnError: false,
      body: payload,
    });
  }

  private buildPayload(input: SponsorInput): SponsorPayload {
    return {
      name: input.name,
      streetAddress: input.streetAddress ?? '',
      cityStateZip: input.cityStateZip ?? '',
      description: input.description ?? '',
      email: input.email ?? '',
      phone: input.phone ?? '',
      fax: input.fax ?? '',
      website: input.website ?? '',
    };
  }

  private ensureSuccess<T>(
    result: { data?: T; error?: { message?: string } | null },
    fallbackMessage: string,
  ): T {
    if (result.error) {
      throw new Error(result.error.message || fallbackMessage);
    }

    if (result.data === undefined) {
      throw new Error(fallbackMessage);
    }

    return result.data;
  }

  private ensureNoError(
    result: { error?: { message?: string } | null },
    fallbackMessage: string,
  ): void {
    if (result.error) {
      throw new Error(result.error.message || fallbackMessage);
    }
  }
}
