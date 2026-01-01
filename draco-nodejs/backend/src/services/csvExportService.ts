import { IRosterRepository } from '../repositories/interfaces/IRosterRepository.js';
import { IManagerRepository } from '../repositories/interfaces/IManagerRepository.js';
import { dbRosterExportData, dbManagerExportData } from '../repositories/types/dbTypes.js';
import {
  generateCsv,
  RosterExportRow,
  ManagerExportRow,
  ROSTER_EXPORT_HEADERS,
  MANAGER_EXPORT_HEADERS,
} from '../utils/csvGenerator.js';

export interface CsvExportResult {
  buffer: Buffer;
  fileName: string;
}

export class CsvExportService {
  constructor(
    private readonly rosterRepository: IRosterRepository,
    private readonly managerRepository: IManagerRepository,
  ) {}

  async exportTeamRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    teamName: string,
  ): Promise<CsvExportResult> {
    const rosterData = await this.rosterRepository.findRosterMembersForExport(
      teamSeasonId,
      seasonId,
    );
    const rows = this.mapRosterToExportRows(rosterData, seasonId);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(teamName);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportLeagueRoster(
    leagueSeasonId: bigint,
    seasonId: bigint,
    leagueName: string,
  ): Promise<CsvExportResult> {
    const rosterData = await this.rosterRepository.findLeagueRosterForExport(
      leagueSeasonId,
      seasonId,
    );
    const rows = this.mapRosterToExportRows(rosterData, seasonId);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportSeasonRoster(
    seasonId: bigint,
    accountId: bigint,
    seasonName: string,
  ): Promise<CsvExportResult> {
    const rosterData = await this.rosterRepository.findSeasonRosterForExport(seasonId, accountId);
    const rows = this.mapRosterToExportRows(rosterData, seasonId);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(seasonName);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportLeagueManagers(leagueSeasonId: bigint, leagueName: string): Promise<CsvExportResult> {
    const managerData = await this.managerRepository.findLeagueManagersForExport(leagueSeasonId);
    const rows = this.mapManagersToExportRows(managerData);
    const buffer = await generateCsv(rows, MANAGER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    return {
      buffer,
      fileName: `${sanitizedName}-managers.csv`,
    };
  }

  async exportSeasonManagers(
    seasonId: bigint,
    accountId: bigint,
    seasonName: string,
  ): Promise<CsvExportResult> {
    const managerData = await this.managerRepository.findSeasonManagersForExport(
      seasonId,
      accountId,
    );
    const rows = this.mapManagersToExportRows(managerData);
    const buffer = await generateCsv(rows, MANAGER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(seasonName);
    return {
      buffer,
      fileName: `${sanitizedName}-managers.csv`,
    };
  }

  private mapRosterToExportRows(data: dbRosterExportData[], seasonId: bigint): RosterExportRow[] {
    return data.map((item) => {
      const contact = item.roster.contacts;
      const dues = item.roster.playerseasonaffiliationdues.find((d) => d.seasonid === seasonId);
      return {
        fullName: this.formatFullName(contact.firstname, contact.middlename, contact.lastname),
        email: contact.email ?? '',
        streetAddress: contact.streetaddress ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        affiliationDuesPaid: dues?.affiliationduespaid ?? '',
      };
    });
  }

  private mapManagersToExportRows(data: dbManagerExportData[]): ManagerExportRow[] {
    return data.map((item) => {
      const contact = item.contacts;
      const leagueName = item.teamsseason.leagueseason.league.name;
      const teamName = item.teamsseason.name;
      return {
        fullName: this.formatFullName(contact.firstname, contact.middlename, contact.lastname),
        email: contact.email ?? '',
        phone2: contact.phone2 ?? '',
        phone3: contact.phone3 ?? '',
        phone1: contact.phone1 ?? '',
        streetAddress: contact.streetaddress ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        leagueTeamName: `${leagueName} - ${teamName}`,
      };
    });
  }

  private formatFullName(
    firstName: string | null,
    middleName: string | null,
    lastName: string | null,
  ): string {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    return parts.join(' ');
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }
}
