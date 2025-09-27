import { sponsors, teamsseason } from '@prisma/client';
import { CreateSponsorType, SponsorType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  ISponsorRepository,
  ITeamRepository,
  dbSponsor,
} from '../repositories/index.js';
import { SponsorResponseFormatter } from '../responseFormatters/responseFormatters.js';
import { NotFoundError } from '../utils/customErrors.js';
import { createStorageService } from './storageService.js';

export class SponsorService {
  private sponsorRepository: ISponsorRepository;
  private teamRepository: ITeamRepository;
  private storageService = createStorageService();

  constructor() {
    this.sponsorRepository = RepositoryFactory.getSponsorRepository();
    this.teamRepository = RepositoryFactory.getTeamRepository();
  }

  async getAccountSponsors(accountId: bigint): Promise<SponsorType[]> {
    const sponsors = await this.sponsorRepository.listAccountSponsors(accountId);
    return SponsorResponseFormatter.formatSponsors(sponsors);
  }

  async getTeamSponsors(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<SponsorType[]> {
    const teamSeason = await this.teamRepository.findTeamSeason(teamSeasonId, seasonId, accountId);
    if (!teamSeason) {
      throw new NotFoundError('Team not found');
    }

    const sponsors = await this.sponsorRepository.listTeamSponsors(accountId, teamSeason.teamid);
    return SponsorResponseFormatter.formatSponsors(sponsors);
  }

  async createAccountSponsor(accountId: bigint, payload: CreateSponsorType): Promise<SponsorType> {
    const dbData = this.buildSponsorWriteData(payload, accountId, null);
    const created = await this.sponsorRepository.create(dbData);
    const sponsor = await this.requireSponsor(created.id, accountId);
    return SponsorResponseFormatter.formatSponsor(sponsor);
  }

  async getSponsor(accountId: bigint, sponsorId: bigint): Promise<SponsorType> {
    const sponsor = await this.requireSponsor(sponsorId, accountId);
    return SponsorResponseFormatter.formatSponsor(sponsor);
  }

  async updateAccountSponsor(
    accountId: bigint,
    sponsorId: bigint,
    payload: CreateSponsorType,
  ): Promise<SponsorType> {
    const existing = await this.requireSponsor(sponsorId, accountId);
    if (existing.teamid) {
      throw new NotFoundError('Sponsor not found for this account');
    }

    const dbData = this.buildSponsorWriteData(payload, accountId, null);
    await this.sponsorRepository.update(sponsorId, dbData);
    const updated = await this.requireSponsor(sponsorId, accountId);
    return SponsorResponseFormatter.formatSponsor(updated);
  }

  async deleteSponsor(accountId: bigint, sponsorId: bigint): Promise<void> {
    await this.requireSponsor(sponsorId, accountId);
    await this.sponsorRepository.delete(sponsorId);
    await this.storageService.deleteSponsorPhoto(accountId.toString(), sponsorId.toString());
    // Ensure team-specific deletes don't leave orphaned photos when called from team context
  }

  async deleteTeamSponsor(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    sponsorId: bigint,
  ): Promise<void> {
    await this.requireTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId);
    await this.sponsorRepository.delete(sponsorId);
    await this.storageService.deleteSponsorPhoto(accountId.toString(), sponsorId.toString());
  }

  async createTeamSponsor(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    payload: CreateSponsorType,
  ): Promise<SponsorType> {
    const teamSeason = await this.requireTeamSeason(accountId, seasonId, teamSeasonId);

    const dbData = this.buildSponsorWriteData(payload, accountId, teamSeason.teamid);
    const created = await this.sponsorRepository.create(dbData);
    const sponsor = await this.requireSponsor(created.id, accountId);
    return SponsorResponseFormatter.formatSponsor(sponsor);
  }

  async updateTeamSponsor(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    sponsorId: bigint,
    payload: CreateSponsorType,
  ): Promise<SponsorType> {
    const { teamSeason } = await this.requireTeamSponsor(
      accountId,
      seasonId,
      teamSeasonId,
      sponsorId,
    );

    const dbData = this.buildSponsorWriteData(payload, accountId, teamSeason.teamid);
    await this.sponsorRepository.update(sponsorId, dbData);
    const updated = await this.requireSponsor(sponsorId, accountId);
    return SponsorResponseFormatter.formatSponsor(updated);
  }

  async getTeamSponsor(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    sponsorId: bigint,
  ): Promise<SponsorType> {
    const { sponsor } = await this.requireTeamSponsor(accountId, seasonId, teamSeasonId, sponsorId);
    return SponsorResponseFormatter.formatSponsor(sponsor);
  }

  private buildSponsorWriteData(
    payload: CreateSponsorType,
    accountId: bigint,
    teamId: bigint | null,
  ): Partial<sponsors> {
    return {
      accountid: accountId,
      teamid: teamId,
      name: payload.name.trim(),
      streetaddress: payload.streetAddress?.trim() || '',
      citystatezip: payload.cityStateZip?.trim() || '',
      description: payload.description?.trim() || '',
      email: payload.email?.trim() || '',
      phone: payload.phone?.trim() || '',
      fax: payload.fax?.trim() || '',
      website: payload.website?.trim() || '',
    } satisfies Partial<sponsors>;
  }

  private async requireSponsor(sponsorId: bigint, accountId: bigint): Promise<dbSponsor> {
    const sponsor = await this.sponsorRepository.findByIdAndAccount(sponsorId, accountId);
    if (!sponsor) {
      throw new NotFoundError('Sponsor not found');
    }
    return sponsor;
  }

  private async requireTeamSeason(accountId: bigint, seasonId: bigint, teamSeasonId: bigint) {
    const teamSeason = await this.teamRepository.findTeamSeason(teamSeasonId, seasonId, accountId);
    if (!teamSeason) {
      throw new NotFoundError('Team not found');
    }
    return teamSeason;
  }

  private async requireTeamSponsor(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    sponsorId: bigint,
  ): Promise<{ sponsor: dbSponsor; teamSeason: teamsseason }> {
    const teamSeason = await this.requireTeamSeason(accountId, seasonId, teamSeasonId);
    const sponsor = await this.requireSponsor(sponsorId, accountId);
    if (!sponsor.teamid || sponsor.teamid !== teamSeason.teamid) {
      throw new NotFoundError('Sponsor not found for this team');
    }

    return { sponsor, teamSeason };
  }
}
