import { IRosterRepository } from '../repositories/interfaces/IRosterRepository.js';
import { IManagerRepository } from '../repositories/interfaces/IManagerRepository.js';
import {
  IContactRepository,
  ContactExportOptions,
} from '../repositories/interfaces/IContactRepository.js';
import { IRoleRepository } from '../repositories/interfaces/IRoleRepository.js';
import {
  dbRosterExportData,
  dbManagerExportData,
  dbContactExportData,
} from '../repositories/types/dbTypes.js';
import {
  generateCsv,
  RosterExportRow,
  ManagerExportRow,
  ContactExportRow,
  ROSTER_EXPORT_HEADERS,
  MANAGER_EXPORT_HEADERS,
  CONTACT_EXPORT_HEADERS,
} from '../utils/csvGenerator.js';
import { PayloadTooLargeError } from '../utils/customErrors.js';

const MAX_EXPORT_ROWS = 10000;

export interface CsvExportResult {
  buffer: Buffer;
  fileName: string;
}

export class CsvExportService {
  constructor(
    private readonly rosterRepository: IRosterRepository,
    private readonly managerRepository: IManagerRepository,
    private readonly contactRepository?: IContactRepository,
    private readonly roleRepository?: IRoleRepository,
  ) {}

  async exportTeamRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    teamName: string,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const rosterData = await this.rosterRepository.findRosterMembersForExport(
      teamSeasonId,
      seasonId,
    );
    this.checkExportLimit(rosterData.length, 'team roster', teamName);
    const rows = this.mapRosterToExportRows(rosterData, seasonId);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(teamName);
    this.logExportMetrics('team roster', teamName, rows.length, buffer.length, startTime);
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
    const startTime = Date.now();
    const rosterData = await this.rosterRepository.findLeagueRosterForExport(
      leagueSeasonId,
      seasonId,
    );
    this.checkExportLimit(rosterData.length, 'league roster', leagueName);
    const rows = this.mapRosterToExportRows(rosterData, seasonId);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    this.logExportMetrics('league roster', leagueName, rows.length, buffer.length, startTime);
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
    const startTime = Date.now();
    const rosterData = await this.rosterRepository.findSeasonRosterForExport(seasonId, accountId);
    this.checkExportLimit(rosterData.length, 'season roster', seasonName);
    const rows = this.mapRosterToExportRows(rosterData, seasonId);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(seasonName);
    this.logExportMetrics('season roster', seasonName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportLeagueManagers(leagueSeasonId: bigint, leagueName: string): Promise<CsvExportResult> {
    const startTime = Date.now();
    const managerData = await this.managerRepository.findLeagueManagersForExport(leagueSeasonId);
    this.checkExportLimit(managerData.length, 'league managers', leagueName);
    const rows = this.mapManagersToExportRows(managerData);
    const buffer = await generateCsv(rows, MANAGER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    this.logExportMetrics('league managers', leagueName, rows.length, buffer.length, startTime);
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
    const startTime = Date.now();
    const managerData = await this.managerRepository.findSeasonManagersForExport(
      seasonId,
      accountId,
    );
    this.checkExportLimit(managerData.length, 'season managers', seasonName);
    const rows = this.mapManagersToExportRows(managerData);
    const buffer = await generateCsv(rows, MANAGER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(seasonName);
    this.logExportMetrics('season managers', seasonName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-managers.csv`,
    };
  }

  async exportContacts(
    accountId: bigint,
    accountName: string,
    options: ContactExportOptions = {},
  ): Promise<CsvExportResult> {
    if (!this.contactRepository) {
      throw new Error('Contact repository is required for contact exports');
    }
    if (!this.roleRepository) {
      throw new Error('Role repository is required for contact exports');
    }
    const startTime = Date.now();

    const [contactData, allRoles] = await Promise.all([
      this.contactRepository.findContactsForExport(accountId, options),
      this.roleRepository.findAllRoles(),
    ]);

    const roleNameMap = new Map(allRoles.map((role) => [role.id, role.name]));

    this.checkExportLimit(contactData.length, 'contacts', accountName);
    const rows = this.mapContactsToExportRows(contactData, roleNameMap);
    const buffer = await generateCsv(rows, CONTACT_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(accountName);
    this.logExportMetrics('contacts', accountName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-users.csv`,
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

  private mapContactsToExportRows(
    data: dbContactExportData[],
    roleNameMap: Map<string, string | null>,
  ): ContactExportRow[] {
    return data.map((contact) => {
      const roleNames = contact.contactroles
        .map((cr) => roleNameMap.get(cr.roleid) ?? cr.roleid)
        .filter(Boolean)
        .join(', ');
      return {
        lastName: contact.lastname ?? '',
        firstName: contact.firstname ?? '',
        middleName: contact.middlename ?? '',
        email: contact.email ?? '',
        streetAddress: contact.streetaddress ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        dateOfBirth: this.formatDate(contact.dateofbirth),
        phone1: contact.phone1 ?? '',
        phone2: contact.phone2 ?? '',
        phone3: contact.phone3 ?? '',
        roles: roleNames,
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

  private formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }

  private checkExportLimit(rowCount: number, exportType: string, name: string): void {
    if (rowCount > MAX_EXPORT_ROWS) {
      console.warn(
        `📊 Export limit exceeded for ${exportType} "${name}": ${rowCount} rows (limit: ${MAX_EXPORT_ROWS})`,
      );
      throw new PayloadTooLargeError(
        `Export limit exceeded: ${rowCount} rows requested, maximum is ${MAX_EXPORT_ROWS}`,
      );
    }
  }

  private logExportMetrics(
    exportType: string,
    name: string,
    rowCount: number,
    bufferSize: number,
    startTime: number,
  ): void {
    const durationMs = Date.now() - startTime;
    console.log(
      `📊 CSV Export: ${exportType} "${name}" - ${rowCount} rows, ${(bufferSize / 1024).toFixed(1)} KB, ${durationMs}ms`,
    );
  }
}
